import { describe, expect, it } from "vitest";
import { summarizeBasketConfiguration } from "./configurationSummary";

describe("configuration summary", () => {
  it("maps backend basket snapshots into customer-readable groups and modifiers", () => {
    const summary = summarizeBasketConfiguration({
      productType: "MEAL",
      basePrice: "20.00",
      configuredUnitPrice: "26.50",
      groups: [
        {
          groupId: "group-main",
          groupName: "Choose your burger",
          selections: [
            {
              optionId: "option-classic",
              productName: "Classic Burger",
              quantity: 1,
              priceAdjustment: "0.00",
              modifiers: [
                {
                  modifierGroupName: "Add extras",
                  modifierOptionId: "extra-bacon",
                  ingredientName: "Bacon",
                  actionType: "ADD",
                  quantity: 2,
                  priceAdjustment: "2.50",
                },
              ],
            },
          ],
        },
        {
          groupId: "group-side",
          groupName: "Choose your side",
          selections: [
            {
              optionId: "option-large-fries",
              productName: "Large Fries",
              quantity: 1,
              priceAdjustment: "4.00",
              modifiers: [],
            },
          ],
        },
      ],
      modifiers: [
        {
          modifierGroupName: "Remove ingredients",
          modifierOptionId: "remove-pickles",
          ingredientName: "Pickles",
          actionType: "REMOVE",
          quantity: 1,
          priceAdjustment: "0.00",
        },
      ],
    });

    expect(summary).toMatchObject({
      productType: "MEAL",
      basePriceCents: 2000,
      configuredUnitPriceCents: 2650,
      groups: [
        {
          groupName: "Choose your burger",
          optionName: "Classic Burger",
          priceAdjustmentCents: 0,
          modifiers: [
            {
              actionType: "ADD",
              name: "Bacon",
              priceAdjustmentCents: 250,
              quantity: 2,
            },
          ],
        },
        {
          groupName: "Choose your side",
          optionName: "Large Fries",
          priceAdjustmentCents: 400,
        },
      ],
      modifiers: [
        {
          actionType: "REMOVE",
          name: "Pickles",
        },
      ],
    });
  });

  it("returns an empty summary for unknown configuration payloads", () => {
    expect(summarizeBasketConfiguration(null)).toEqual({
      basePriceCents: null,
      configuredUnitPriceCents: null,
      groups: [],
      modifiers: [],
      productType: null,
    });
  });
});
