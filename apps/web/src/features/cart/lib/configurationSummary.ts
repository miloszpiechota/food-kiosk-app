export interface ModifierSummary {
  actionType: "ADD" | "REMOVE" | string;
  groupName: string;
  id: string;
  name: string;
  priceAdjustmentCents: number;
  quantity: number;
}

export interface GroupSelectionSummary {
  groupName: string;
  id: string;
  modifiers: ModifierSummary[];
  optionName: string;
  priceAdjustmentCents: number;
  quantity: number;
}

export interface BasketConfigurationSummary {
  basePriceCents: number | null;
  configuredUnitPriceCents: number | null;
  groups: GroupSelectionSummary[];
  modifiers: ModifierSummary[];
  productType: string | null;
}

export function summarizeBasketConfiguration(
  configuration: unknown,
): BasketConfigurationSummary {
  if (!isRecord(configuration)) {
    return emptySummary();
  }

  return {
    basePriceCents: toCents(configuration.basePrice),
    configuredUnitPriceCents: toCents(configuration.configuredUnitPrice),
    groups: readGroups(configuration.groups),
    modifiers: readModifiers(configuration.modifiers),
    productType:
      typeof configuration.productType === "string"
        ? configuration.productType
        : null,
  };
}

function emptySummary(): BasketConfigurationSummary {
  return {
    basePriceCents: null,
    configuredUnitPriceCents: null,
    groups: [],
    modifiers: [],
    productType: null,
  };
}

function readGroups(value: unknown): GroupSelectionSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).flatMap((group) => {
    const selections = Array.isArray(group.selections)
      ? group.selections.filter(isRecord)
      : [];
    return selections.map((selection) => ({
      groupName: readString(group.groupName, "Choice"),
      id: readString(group.groupId, readString(selection.optionId, "choice")),
      modifiers: readModifiers(selection.modifiers),
      optionName: readString(selection.productName, "Selected item"),
      priceAdjustmentCents: toCents(selection.priceAdjustment) ?? 0,
      quantity: readPositiveInteger(selection.quantity, 1),
    }));
  });
}

function readModifiers(value: unknown): ModifierSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).map((modifier) => ({
    actionType: readString(modifier.actionType, "ADD"),
    groupName: readString(modifier.modifierGroupName, "Modifier"),
    id: readString(modifier.modifierOptionId, readString(modifier.ingredientId, "modifier")),
    name: readString(modifier.ingredientName, "Option"),
    priceAdjustmentCents: toCents(modifier.priceAdjustment) ?? 0,
    quantity: readPositiveInteger(modifier.quantity, 1),
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readPositiveInteger(value: unknown, fallback: number): number {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback;
}

function toCents(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.round(numericValue * 100) : null;
}
