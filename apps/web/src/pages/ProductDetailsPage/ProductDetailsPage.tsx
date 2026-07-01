import { ArrowLeft, CheckCircle2, Minus, Plus, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { OrderMode } from "../../app/router";
import type { AddBasketItemRequest } from "../../features/cart/api/basketApi";
import { OrderFooter } from "../../features/cart/components/OrderFooter";
import type { CartItem, CartSummary } from "../../features/cart/types/cart.types";
import { getProductDetail } from "../../features/menu/api/menuApi";
import type {
  MealSizeVariant,
  ModifierGroup,
  Product,
  ProductDetail,
  ProductGroup,
  ProductGroupOption,
} from "../../features/menu/types/menu.types";
import { focusRing } from "../../shared/components/IconButton";
import { Price } from "../../shared/components/Price";
import { Header } from "../../shared/layout/Header";
import { KioskShell } from "../../shared/layout/KioskShell";

interface ProductDetailsPageProps {
  cartItems: CartItem[];
  cartSummary: CartSummary;
  orderMode: OrderMode;
  product: Product;
  searchTerm: string;
  onAddToCart: (request: AddBasketItemRequest) => Promise<void>;
  onBack: () => void;
  onOrderModeToggle: () => void;
  onSearchChange: (value: string) => void;
}

type ModifierQuantities = Record<string, number>;

export function ProductDetailsPage({
  cartItems,
  cartSummary,
  orderMode,
  product,
  searchTerm,
  onAddToCart,
  onBack,
  onOrderModeToggle,
  onSearchChange,
}: ProductDetailsPageProps) {
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [groupSelections, setGroupSelections] = useState<
    Record<string, string>
  >({});
  const [modifierQuantities, setModifierQuantities] =
    useState<ModifierQuantities>({});
  const [optionModifierQuantities, setOptionModifierQuantities] = useState<
    Record<string, ModifierQuantities>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDetail(product);
    // Product identity is stable while this page is mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.menuProductId]);

  async function loadDetail(targetProduct: Product) {
    setIsLoading(true);
    setError(null);
    try {
      const nextDetail = await getProductDetail(targetProduct);
      setDetail(nextDetail);
      setGroupSelections(
        Object.fromEntries(
          nextDetail.groups
            .map((group) => [
              group.id,
              group.options.find((option) => option.isInitialSelection)?.id ??
                group.options[0]?.id,
            ])
            .filter((entry): entry is [string, string] => Boolean(entry[1])),
        ),
      );
      setModifierQuantities({});
      setOptionModifierQuantities({});
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Product details could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const selectedOptions = useMemo(() => {
    if (!detail) return [];
    return detail.groups.flatMap((group) => {
      const option = group.options.find(
        (candidate) => candidate.id === groupSelections[group.id],
      );
      return option ? [{ groupId: group.id, option }] : [];
    });
  }, [detail, groupSelections]);

  const configuredUnitPriceCents = useMemo(() => {
    if (!detail) return product.priceCents;
    const groupAdjustments = selectedOptions.reduce(
      (total, selection) =>
        total + decimalToCents(selection.option.priceAdjustment),
      0,
    );
    const topLevelAdjustments = modifierPrice(
      detail.modifierGroups,
      modifierQuantities,
    );
    const optionAdjustments = selectedOptions.reduce(
      (total, selection) =>
        total +
        modifierPrice(
          selection.option.modifierGroups,
          optionModifierQuantities[selection.option.id] ?? {},
        ),
      0,
    );
    return (
      detail.priceCents +
      groupAdjustments +
      topLevelAdjustments +
      optionAdjustments
    );
  }, [
    detail,
    modifierQuantities,
    optionModifierQuantities,
    product.priceCents,
    selectedOptions,
  ]);

  const totalCents = configuredUnitPriceCents * quantity;
  const isConfigurationComplete =
    detail?.groups.every((group) => Boolean(groupSelections[group.id])) ?? false;

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => Math.min(9, current + 1));
  }

  async function switchVariant(variant: MealSizeVariant) {
    if (!detail) return;
    await loadDetail({
      ...detail,
      id: variant.menuProductId,
      menuProductId: variant.menuProductId,
      productId: variant.productId,
      type: variant.type,
      name: variant.name,
      priceCents: decimalToCents(variant.price),
      image: variant.image,
      hasCustomizations: true,
    });
  }

  async function handleAddToOrder() {
    if (!detail || !isConfigurationComplete) {
      setError("Choose one option in every required group.");
      return;
    }

    const request: AddBasketItemRequest = {
      menuProductId: detail.menuProductId,
      quantity,
      groupSelections: selectedOptions.map(({ groupId, option }) => ({
        productGroupId: groupId,
        options: [
          {
            productGroupOptionId: option.id,
            quantity: 1,
            modifierSelections: toModifierSelections(
              optionModifierQuantities[option.id] ?? {},
            ),
          },
        ],
      })),
      modifierSelections: toModifierSelections(modifierQuantities),
    };

    setIsSubmitting(true);
    setError(null);
    try {
      await onAddToCart(request);
      onBack();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The product could not be added.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayedProduct = detail ?? product;
  const regularMeal =
    detail?.type === "MEAL"
      ? {
          menuProductId: detail.menuProductId,
          productId: detail.productId,
          type: "MEAL" as const,
          name: detail.name,
          price: centsToDecimalString(detail.priceCents),
          image: detail.image,
        }
      : detail?.regularMeal;
  const largeMeal =
    detail?.type === "LARGE_MEAL"
      ? {
          menuProductId: detail.menuProductId,
          productId: detail.productId,
          type: "LARGE_MEAL" as const,
          name: detail.name,
          price: centsToDecimalString(detail.priceCents),
          image: detail.image,
        }
      : detail?.largeMeal;
  const hasConfigurationSections =
    Boolean(detail?.groups.length) || Boolean(detail?.modifierGroups.length);

  return (
    <KioskShell className="flex flex-col">
      <Header
        orderMode={orderMode}
        searchTerm={searchTerm}
        onOrderModeToggle={onOrderModeToggle}
        onSearchChange={onSearchChange}
      />

      <main className="min-h-0 flex-1 overflow-y-auto pb-48">
        <div className="mx-auto max-w-screen-2xl">
          {isLoading ? (
            <ProductDetailsSkeleton />
          ) : (
            <>
              <section className="mx-4 mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/20 sm:mx-6">
                <div className="relative aspect-[16/9] min-h-72 bg-muted md:aspect-[16/7]">
                  <img
                    src={displayedProduct.image}
                    alt={displayedProduct.name}
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent" />
                </div>
              </section>

              <section
                aria-labelledby="product-details-heading"
                className="px-4 pt-5 sm:px-6"
              >
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h1
                      id="product-details-heading"
                      className="text-3xl font-black leading-tight text-foreground sm:text-5xl"
                    >
                      {displayedProduct.name}
                    </h1>
                    {displayedProduct.description && (
                      <p className="mt-2 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                        {displayedProduct.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onBack}
                    className={`flex min-h-12 shrink-0 items-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-black text-foreground shadow-xl shadow-black/10 transition hover:border-primary/60 hover:text-primary active:scale-95 sm:px-5 sm:text-base ${focusRing}`}
                  >
                    <ArrowLeft aria-hidden="true" className="size-5" />
                    Back to menu
                  </button>
                </div>
              </section>

              <div className="space-y-8 px-4 py-6 sm:px-6">
                {detail && (regularMeal || largeMeal) && (
                  <section aria-labelledby="meal-size-heading">
                    <SectionHeading
                      id="meal-size-heading"
                      label="Meal size"
                      helper="Pick regular or large"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      {regularMeal && (
                        <MealVariantCard
                          active={detail.type === "MEAL"}
                          image={regularMeal.image}
                          label="Regular"
                          name={regularMeal.name}
                          onClick={() => {
                            if (detail.type !== "MEAL") {
                              void switchVariant(regularMeal);
                            }
                          }}
                          priceCents={decimalToCents(regularMeal.price)}
                        />
                      )}
                      {largeMeal && (
                        <MealVariantCard
                          active={detail.type === "LARGE_MEAL"}
                          image={largeMeal.image}
                          label="Large"
                          name={largeMeal.name}
                          onClick={() => {
                            if (detail.type !== "LARGE_MEAL") {
                              void switchVariant(largeMeal);
                            }
                          }}
                          priceCents={decimalToCents(largeMeal.price)}
                        />
                      )}
                    </div>
                  </section>
                )}

                {detail?.groups.map((group) => {
                  const selectedOption = group.options.find(
                    (option) => option.id === groupSelections[group.id],
                  );
                  return (
                    <section key={group.id} aria-labelledby={`${group.id}-heading`}>
                      <MealGroupSection
                        fallbackImage={displayedProduct.image}
                        group={group}
                        headingId={`${group.id}-heading`}
                        selectedId={groupSelections[group.id]}
                        onSelect={(optionId) =>
                          setGroupSelections((current) => ({
                            ...current,
                            [group.id]: optionId,
                          }))
                        }
                      />
                      {selectedOption &&
                        selectedOption.modifierGroups.length > 0 && (
                          <div className="mt-4">
                            <SectionHeading
                              id={`${selectedOption.id}-customize-heading`}
                              label={`Customize ${selectedOption.name}`}
                              helper="Optional"
                            />
                            <ModifierGroups
                              groups={selectedOption.modifierGroups}
                              quantities={
                                optionModifierQuantities[selectedOption.id] ?? {}
                              }
                              onChange={(next) =>
                                setOptionModifierQuantities((current) => ({
                                  ...current,
                                  [selectedOption.id]: next,
                                }))
                              }
                            />
                          </div>
                        )}
                    </section>
                  );
                })}

                {detail && detail.modifierGroups.length > 0 && (
                  <section aria-labelledby="customize-heading">
                    <SectionHeading
                      id="customize-heading"
                      label="Customize"
                      helper="Add extras or remove ingredients"
                    />
                    <ModifierGroups
                      groups={detail.modifierGroups}
                      quantities={modifierQuantities}
                      onChange={setModifierQuantities}
                    />
                  </section>
                )}

                {!hasConfigurationSections && (
                  <section className="rounded-3xl border border-border bg-card p-5">
                    <h2 className="text-2xl font-black text-foreground">
                      Ready to add
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                      No extra choices are needed for this item.
                    </p>
                  </section>
                )}

                <section className="rounded-3xl border border-border bg-card p-4 shadow-2xl shadow-black/10 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/60 p-2 lg:w-auto">
                      <button
                        type="button"
                        onClick={decreaseQuantity}
                        aria-label="Decrease quantity"
                        className={`grid size-12 place-items-center rounded-xl text-foreground transition hover:bg-muted active:scale-95 ${focusRing}`}
                      >
                        <Minus className="size-5" />
                      </button>
                      <span
                        aria-live="polite"
                        className="grid min-w-14 place-items-center text-3xl font-black text-foreground"
                      >
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={increaseQuantity}
                        aria-label="Increase quantity"
                        className={`grid size-12 place-items-center rounded-xl text-foreground transition hover:bg-muted active:scale-95 ${focusRing}`}
                      >
                        <Plus className="size-5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={
                        isSubmitting ||
                        !detail ||
                        (detail.type !== "ITEM" && !isConfigurationComplete)
                      }
                      onClick={() => void handleAddToOrder()}
                      className={`flex min-h-20 flex-1 items-center justify-center gap-3 rounded-3xl border border-primary/60 bg-primary px-8 text-xl font-black text-primary-foreground shadow-xl shadow-primary/25 transition enabled:hover:bg-primary/90 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                    >
                      <ShoppingCart aria-hidden="true" className="size-7" />
                      {isSubmitting ? (
                        "Adding..."
                      ) : (
                        <>
                          Add to order
                          <Price cents={totalCents} />
                        </>
                      )}
                    </button>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="mt-4 rounded-2xl border border-destructive/60 bg-destructive/10 p-4 font-semibold text-destructive"
                    >
                      {error}
                    </p>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </main>

      <OrderFooter items={cartItems} summary={cartSummary} />
    </KioskShell>
  );
}

function ProductDetailsSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-5 p-4 sm:p-6">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-2xl shadow-black/10">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-primary">
          Loading product details
        </p>
        <p className="mt-2 text-base font-semibold text-muted-foreground">
          Preparing meal sizes, choices, and customization options.
        </p>
      </div>
      <div className="aspect-[16/7] min-h-72 animate-pulse rounded-3xl bg-muted" />
      <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-muted" />
      <div className="h-5 w-full max-w-3xl animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-52 animate-pulse rounded-3xl bg-muted" />
        <div className="h-52 animate-pulse rounded-3xl bg-muted" />
      </div>
    </div>
  );
}

function SectionHeading({
  helper,
  id,
  label,
}: {
  helper?: string;
  id: string;
  label: string;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <h2
        id={id}
        className="text-sm font-black uppercase tracking-[0.14em] text-muted-foreground"
      >
        {label}
      </h2>
      {helper && (
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-primary">
          {helper}
        </span>
      )}
    </div>
  );
}

function MealGroupSection({
  fallbackImage,
  group,
  headingId,
  onSelect,
  selectedId,
}: {
  fallbackImage: string;
  group: ProductGroup;
  headingId: string;
  onSelect: (optionId: string) => void;
  selectedId: string | undefined;
}) {
  return (
    <div>
      <SectionHeading
        id={headingId}
        label={group.name}
        helper={group.isRequired ? "Required" : "Optional"}
      />
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        {group.options.map((option) => {
          const selected = selectedId === option.id;
          return (
            <MealOptionCard
              key={option.id}
              fallbackImage={fallbackImage}
              option={option}
              selected={selected}
              onClick={() => onSelect(option.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function MealOptionCard({
  fallbackImage,
  onClick,
  option,
  selected,
}: {
  fallbackImage: string;
  onClick: () => void;
  option: ProductGroupOption;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative w-44 flex-none overflow-hidden rounded-3xl border-2 text-left transition hover:border-primary/60 active:scale-[0.98] sm:w-52 lg:w-60 ${
        selected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
          : "border-border bg-card"
      } ${focusRing}`}
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={resolveOptionImage(option.imageUrl, fallbackImage)}
          alt={option.name}
          className={`size-full object-cover transition duration-300 ${
            selected ? "scale-105" : ""
          }`}
        />
      </div>
      <div className="p-4">
        <p className="line-clamp-2 min-h-12 text-base font-black leading-6 text-foreground sm:text-lg">
          {option.name}
        </p>
        {decimalToCents(option.priceAdjustment) === 0 ? (
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            Included
          </p>
        ) : (
          <p className="mt-2 text-sm font-black text-primary">
            +{formatCents(decimalToCents(option.priceAdjustment))}
          </p>
        )}
      </div>
      {selected && (
        <span className="absolute right-3 top-3 rounded-full bg-primary p-1 text-primary-foreground">
          <CheckCircle2 aria-hidden="true" className="size-5" />
        </span>
      )}
    </button>
  );
}

function ModifierGroups({
  groups,
  quantities,
  onChange,
}: {
  groups: ModifierGroup[];
  quantities: ModifierQuantities;
  onChange: (quantities: ModifierQuantities) => void;
}) {
  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const tone = modifierTone(group.actionType);
        return (
          <div key={group.id}>
            <div className="mb-3 flex items-center gap-2">
              <span className={`size-2 rounded-full ${tone.dot}`} />
              <h3 className="text-base font-black text-foreground">
                {group.name}
              </h3>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-black ${tone.badge}`}>
                {group.actionType === "ADD" ? "Extras" : "Remove"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const current = quantities[option.id] ?? 0;
                return (
                  <ModifierChip
                    key={option.id}
                    actionType={group.actionType}
                    allowQuantity={group.allowQuantity}
                    current={current}
                    maxQuantity={option.maxQuantity}
                    name={option.name ?? "Option"}
                    priceAdjustment={option.priceAdjustment}
                    onChange={(nextQuantity) =>
                      onChange({
                        ...quantities,
                        [option.id]: nextQuantity,
                      })
                    }
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModifierChip({
  actionType,
  allowQuantity,
  current,
  maxQuantity,
  name,
  onChange,
  priceAdjustment,
}: {
  actionType: ModifierGroup["actionType"];
  allowQuantity: boolean;
  current: number;
  maxQuantity: number;
  name: string;
  onChange: (quantity: number) => void;
  priceAdjustment: string;
}) {
  const selected = current > 0;
  const tone = modifierTone(actionType);
  const priceCents = decimalToCents(priceAdjustment);

  return (
    <div
      className={`flex min-h-12 items-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-bold transition ${
        selected ? tone.selectedChip : "border-border bg-card text-foreground"
      }`}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onChange(selected ? 0 : 1)}
        className={`flex items-center gap-2 ${focusRing}`}
      >
        <span
          className={`grid size-5 place-items-center rounded-full border-2 ${
            selected ? tone.iconSelected : "border-current"
          }`}
        >
          {selected &&
            (actionType === "ADD" ? (
              <CheckCircle2 aria-hidden="true" className="size-3" />
            ) : (
              <Minus aria-hidden="true" className="size-3" />
            ))}
        </span>
        <span className={selected && actionType === "REMOVE" ? "line-through" : ""}>
          {name}
        </span>
      </button>

      {priceCents !== 0 && (
        <span className={selected ? tone.price : "text-muted-foreground"}>
          +{formatCents(priceCents)}
        </span>
      )}

      {allowQuantity && selected && (
        <span className="ml-1 flex items-center gap-1 rounded-xl border border-border bg-background/60 p-1">
          <button
            type="button"
            aria-label={`Decrease ${name}`}
            onClick={() => onChange(Math.max(0, current - 1))}
            className={`grid size-7 place-items-center rounded-lg hover:bg-muted ${focusRing}`}
          >
            <Minus className="size-3" />
          </button>
          <span className="min-w-5 text-center">{current}</span>
          <button
            type="button"
            aria-label={`Increase ${name}`}
            onClick={() => onChange(Math.min(maxQuantity, current + 1))}
            className={`grid size-7 place-items-center rounded-lg hover:bg-muted ${focusRing}`}
          >
            <Plus className="size-3" />
          </button>
        </span>
      )}
    </div>
  );
}

function MealVariantCard({
  active,
  image,
  label,
  name,
  onClick,
  priceCents,
}: {
  active: boolean;
  image: string;
  label: string;
  name: string;
  onClick: () => void;
  priceCents: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`relative overflow-hidden rounded-3xl border-2 text-left transition hover:border-primary/60 active:scale-[0.99] ${
        active
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
          : "border-border bg-card"
      } ${focusRing}`}
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={image}
          alt=""
          className={`size-full object-cover transition duration-300 ${
            active ? "scale-105" : ""
          }`}
        />
      </div>
      <div className="p-4">
        <span
          className={`mb-2 inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.1em] ${
            active
              ? "border-primary/60 bg-primary/20 text-primary"
              : "border-border bg-background/60 text-muted-foreground"
          }`}
        >
          {label}
        </span>
        <p className="line-clamp-2 text-xl font-black leading-6 text-foreground">
          {name}
        </p>
        <Price
          cents={priceCents}
          className="mt-2 block text-2xl font-black text-foreground"
        />
      </div>
      {active && (
        <span className="absolute right-3 top-3 rounded-full bg-primary p-1 text-primary-foreground">
          <CheckCircle2 aria-hidden="true" className="size-5" />
        </span>
      )}
    </button>
  );
}

function decimalToCents(value: string): number {
  return Math.round(Number(value) * 100);
}

function centsToDecimalString(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function modifierPrice(
  groups: ModifierGroup[],
  quantities: ModifierQuantities,
): number {
  return groups.reduce(
    (total, group) =>
      total +
      group.options.reduce(
        (groupTotal, option) =>
          groupTotal +
          decimalToCents(option.priceAdjustment) *
            (quantities[option.id] ?? 0),
        0,
      ),
    0,
  );
}

function modifierTone(actionType: ModifierGroup["actionType"]) {
  if (actionType === "ADD") {
    return {
      badge: "border-emerald-400/70 bg-emerald-500/15 text-emerald-200",
      dot: "bg-emerald-400",
      iconSelected: "border-emerald-400 bg-emerald-500 text-white",
      price: "text-emerald-100",
      selectedChip: "border-emerald-400/70 bg-emerald-500/10 text-emerald-100",
    };
  }

  return {
    badge: "border-destructive/70 bg-destructive/15 text-red-100",
    dot: "bg-destructive",
    iconSelected: "border-destructive bg-destructive text-white",
    price: "text-red-100",
    selectedChip: "border-destructive/70 bg-destructive/10 text-red-100",
  };
}

function resolveOptionImage(imageUrl: string | null, fallbackImage: string): string {
  if (!imageUrl) {
    return fallbackImage;
  }
  if (/^https?:\/\//.test(imageUrl)) {
    return imageUrl;
  }
  return fallbackImage;
}

function toModifierSelections(quantities: ModifierQuantities) {
  return Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([modifierOptionId, quantity]) => ({
      modifierOptionId,
      quantity,
    }));
}
