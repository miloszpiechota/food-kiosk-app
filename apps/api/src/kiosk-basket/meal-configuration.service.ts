import { createHash } from 'node:crypto';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AddBasketItemRequest,
  MealConfigurationFieldError,
  ModifierSelectionRequest,
} from './kiosk-basket.types';
import {
  ConfigurableMenuProduct,
  ConfigurableModifierGroup,
  ConfigurableProductGroup,
} from './meal-configuration.query';

interface ConfigurationResult {
  fingerprint: string;
  snapshot: Prisma.InputJsonValue;
  unitPrice: Prisma.Decimal;
}

@Injectable()
export class MealConfigurationService {
  evaluate(
    menuProduct: ConfigurableMenuProduct,
    request: AddBasketItemRequest,
  ): ConfigurationResult {
    const errors: MealConfigurationFieldError[] = [];
    const product = menuProduct.product;
    const basePrice = new Prisma.Decimal(
      menuProduct.menuPrice ?? product.basePrice,
    );

    const topLevelModifiers = this.validateModifiers(
      product.modifierGroups,
      request.modifierSelections ?? [],
      'modifierSelections',
      errors,
    );

    let groupAdjustment = new Prisma.Decimal(0);
    const groupSnapshots: Prisma.InputJsonObject[] = [];

    if (product.type === 'ITEM') {
      if ((request.groupSelections ?? []).length > 0) {
        errors.push({
          path: 'groupSelections',
          code: 'GROUPS_NOT_ALLOWED',
          message: 'Standalone items do not accept meal-group selections.',
        });
      }
    } else {
      this.validateMealDefinition(product.productGroups, errors);
      const submittedGroups = new Map(
        (request.groupSelections ?? []).map((selection) => [
          selection.productGroupId,
          selection,
        ]),
      );

      if (submittedGroups.size !== (request.groupSelections ?? []).length) {
        errors.push({
          path: 'groupSelections',
          code: 'DUPLICATE_GROUP',
          message: 'Each meal group can be submitted only once.',
        });
      }

      for (const group of product.productGroups) {
        const submittedGroup = submittedGroups.get(group.id);
        if (!submittedGroup || submittedGroup.options.length !== 1) {
          errors.push({
            path: `groupSelections.${group.id}`,
            code: 'ONE_SELECTION_REQUIRED',
            message: 'Choose exactly one option.',
          });
          continue;
        }

        const submittedOption = submittedGroup.options[0];
        if (submittedOption.quantity !== 1) {
          errors.push({
            path: `groupSelections.${group.id}.options`,
            code: 'INVALID_OPTION_QUANTITY',
            message: 'Meal-group option quantity must be one.',
          });
        }

        const option = group.options.find(
          (candidate) => candidate.id === submittedOption.productGroupOptionId,
        );
        if (!option) {
          errors.push({
            path: `groupSelections.${group.id}.options`,
            code: 'OPTION_NOT_IN_GROUP',
            message: 'The selected option is not available in this group.',
          });
          continue;
        }

        const optionModifiers = this.validateModifiers(
          option.product.modifierGroups,
          submittedOption.modifierSelections ?? [],
          `groupSelections.${group.id}.options.0.modifierSelections`,
          errors,
        );

        groupAdjustment = groupAdjustment.add(option.priceAdjustment);
        groupAdjustment = groupAdjustment.add(optionModifiers.adjustment);
        groupSnapshots.push({
          groupId: group.id,
          groupCode: group.productGroupTemplate.code,
          groupName: group.nameOverride ?? group.productGroupTemplate.name,
          selections: [
            {
              optionId: option.id,
              productId: option.product.id,
              productName: option.product.name,
              quantity: 1,
              priceAdjustment: option.priceAdjustment.toString(),
              modifiers: optionModifiers.snapshots,
            },
          ],
        });
        submittedGroups.delete(group.id);
      }

      for (const unknownGroupId of submittedGroups.keys()) {
        errors.push({
          path: `groupSelections.${unknownGroupId}`,
          code: 'GROUP_NOT_FOUND',
          message: 'The submitted group does not belong to this meal.',
        });
      }
    }

    if (errors.length > 0) {
      throw new UnprocessableEntityException({
        code: 'INVALID_MEAL_CONFIGURATION',
        message: 'Complete the required product selections.',
        fieldErrors: errors,
      });
    }

    const unitPrice = basePrice
      .add(groupAdjustment)
      .add(topLevelModifiers.adjustment);
    if (unitPrice.isNegative()) {
      throw new UnprocessableEntityException({
        code: 'INVALID_CONFIGURED_PRICE',
        message: 'The configured product price is invalid.',
      });
    }

    const snapshot: Prisma.InputJsonObject = {
      version: 1,
      productType: product.type,
      basePrice: basePrice.toString(),
      groups: groupSnapshots,
      modifiers: topLevelModifiers.snapshots,
      configuredUnitPrice: unitPrice.toString(),
    };
    const normalized = this.stableStringify(snapshot);

    return {
      fingerprint: createHash('sha256').update(normalized).digest('hex'),
      snapshot,
      unitPrice,
    };
  }

  private validateMealDefinition(
    groups: ConfigurableProductGroup[],
    errors: MealConfigurationFieldError[],
  ): void {
    if (groups.length < 2 || groups.length > 4) {
      errors.push({
        path: 'groupSelections',
        code: 'INVALID_GROUP_COUNT',
        message: 'A meal must contain between two and four groups.',
      });
    }

    for (const group of groups) {
      if (
        group.selectionMode !== 'SINGLE' ||
        group.minSelections !== 1 ||
        group.maxSelections !== 1 ||
        !group.isRequired
      ) {
        errors.push({
          path: `groupSelections.${group.id}`,
          code: 'INVALID_GROUP_DEFINITION',
          message: 'This meal group is not configured correctly.',
        });
      }
      if (group.options.length === 0) {
        errors.push({
          path: `groupSelections.${group.id}`,
          code: 'GROUP_HAS_NO_OPTIONS',
          message: 'This meal group has no available options.',
        });
      }
    }
  }

  private validateModifiers(
    groups: ConfigurableModifierGroup[],
    selections: ModifierSelectionRequest[],
    path: string,
    errors: MealConfigurationFieldError[],
  ): {
    adjustment: Prisma.Decimal;
    snapshots: Prisma.InputJsonObject[];
  } {
    const submitted = new Map<string, ModifierSelectionRequest>();
    for (const selection of selections) {
      if (submitted.has(selection.modifierOptionId)) {
        errors.push({
          path,
          code: 'DUPLICATE_MODIFIER',
          message: 'A modifier can be submitted only once.',
        });
      }
      submitted.set(selection.modifierOptionId, selection);
    }

    let adjustment = new Prisma.Decimal(0);
    const snapshots: Prisma.InputJsonObject[] = [];

    for (const group of groups) {
      const selectedInGroup = group.options
        .map((option) => ({
          option,
          selection: submitted.get(option.id),
        }))
        .filter(
          (entry: {
            option: ConfigurableModifierGroup['options'][number];
            selection: ModifierSelectionRequest | undefined;
          }) => entry.selection !== undefined,
        );

      if (
        selectedInGroup.length < group.minSelections ||
        selectedInGroup.length > group.maxSelections ||
        (group.selectionType === 'SINGLE' && selectedInGroup.length > 1)
      ) {
        errors.push({
          path,
          code: 'INVALID_MODIFIER_SELECTION_COUNT',
          message: `Invalid selections for ${group.name}.`,
        });
      }

      for (const { option, selection } of selectedInGroup) {
        if (!selection) {
          continue;
        }
        const quantity = selection.quantity;
        const quantityAllowed = group.allowQuantity
          ? quantity >= 1 && quantity <= option.maxQuantity
          : quantity === 1;
        if (!Number.isInteger(quantity) || !quantityAllowed) {
          errors.push({
            path,
            code: 'MODIFIER_QUANTITY_EXCEEDED',
            message: `Invalid quantity for ${group.name}.`,
          });
          continue;
        }

        adjustment = adjustment.add(
          new Prisma.Decimal(option.priceAdjustment).mul(quantity),
        );
        const ingredient =
          option.ingredient ?? option.productIngredient?.ingredient ?? null;
        snapshots.push({
          modifierGroupId: group.id,
          modifierGroupName: group.name,
          modifierOptionId: option.id,
          ingredientId: option.ingredientId,
          ingredientName: ingredient?.name ?? null,
          actionType: group.actionType,
          quantity,
          priceAdjustment: option.priceAdjustment.toString(),
        });
        submitted.delete(option.id);
      }
    }

    for (const unknownModifierId of submitted.keys()) {
      errors.push({
        path,
        code: 'INVALID_MODIFIER',
        message: `Modifier ${unknownModifierId} is not available for this item.`,
      });
    }

    snapshots.sort((left, right) => {
      const leftId = left.modifierOptionId;
      const rightId = right.modifierOptionId;
      return typeof leftId === 'string' && typeof rightId === 'string'
        ? leftId.localeCompare(rightId)
        : 0;
    });

    return { adjustment, snapshots };
  }

  private stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      return `{${Object.keys(record)
        .sort()
        .map(
          (key) =>
            `${JSON.stringify(key)}:${this.stableStringify(record[key])}`,
        )
        .join(',')}}`;
    }
    return JSON.stringify(value);
  }
}
