import type {
  FeaturedBanner,
  FeaturedMenuContent,
  MenuCategory,
  Product,
  QuickFilterLabel,
} from "../types/menu.types";
import { ProductCard } from "./ProductCard";
import { focusRing } from "../../../shared/components/IconButton";

interface ProductGridProps {
  activeCategory: MenuCategory;
  featuredContent: FeaturedMenuContent;
  products: Product[];
  searchTerm: string;
  onAddToCart: (product: Product) => void;
  onViewProductDetails: (product: Product) => void;
}

export function ProductGrid({
  activeCategory,
  featuredContent,
  products,
  searchTerm,
  onAddToCart,
  onViewProductDetails,
}: ProductGridProps) {
  if (activeCategory.id === "featured" && !searchTerm.trim()) {
    return (
      <FeaturedProductGrid
        content={featuredContent}
        onAddToCart={onAddToCart}
        onViewProductDetails={onViewProductDetails}
      />
    );
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto pb-48">
      <CategoryBanner category={activeCategory} />

      <section
        aria-labelledby="product-grid-heading"
        className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
      >
        <h2 id="product-grid-heading" className="sr-only">
          {activeCategory.label} products
        </h2>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onViewDetails={onViewProductDetails}
          />
        ))}
      </section>

      {products.length === 0 && (
        <div className="mx-4 mb-48 rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground">
          <p className="text-xl font-semibold text-foreground">
            No products found
          </p>
          <p className="mt-2">
            {searchTerm.trim()
              ? `No ${activeCategory.label.toLowerCase()} items match "${searchTerm}".`
              : `No ${activeCategory.label.toLowerCase()} items are available yet.`}
          </p>
        </div>
      )}
    </main>
  );
}

interface FeaturedProductGridProps {
  content: FeaturedMenuContent;
  onAddToCart: (product: Product) => void;
  onViewProductDetails: (product: Product) => void;
}

function FeaturedProductGrid({
  content,
  onAddToCart,
  onViewProductDetails,
}: FeaturedProductGridProps) {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto pb-48">
      <div className="space-y-6 p-4 sm:p-6">
        <FeaturedHeroBanner banner={content.heroBanner} />

        <section
          aria-label="Featured menu highlights"
          className="grid gap-4 lg:grid-cols-2"
        >
          {content.secondaryBanners.map((banner) => (
            <FeaturedSmallBanner key={banner.id} banner={banner} />
          ))}
        </section>

        <QuickFilterRow filters={content.quickFilters} />

        <FeaturedProductSection
          title="New this week"
          products={content.newProducts}
          onAddToCart={onAddToCart}
          onViewProductDetails={onViewProductDetails}
        />

        <FeaturedProductSection
          title="Best recommendations for you"
          products={content.recommendedProducts}
          onAddToCart={onAddToCart}
          onViewProductDetails={onViewProductDetails}
        />
      </div>
    </main>
  );
}

interface FeaturedBannerProps {
  banner: FeaturedBanner;
}

function FeaturedHeroBanner({ banner }: FeaturedBannerProps) {
  return (
    <section className="image-banner relative isolate min-h-72 overflow-hidden rounded-3xl bg-background">
      <img
        src={banner.image}
        alt=""
        aria-hidden="true"
        className="absolute -inset-px size-[calc(100%+2px)] max-w-none object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/20" />
      <div className="relative max-w-2xl p-7 sm:p-10">
        
        <h2 className="text-5xl font-bold leading-tight text-foreground">
          {banner.title}
        </h2>
        <p className="mt-4 text-xl text-white">
          {banner.description}
        </p>
      </div>
    </section>
  );
}

function FeaturedSmallBanner({ banner }: FeaturedBannerProps) {
  return (
    <article className="image-banner relative isolate min-h-44 overflow-hidden rounded-3xl bg-background">
      <img
        src={banner.image}
        alt=""
        aria-hidden="true"
        className="absolute -inset-px size-[calc(100%+2px)] max-w-none object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/10" />
      <div className="relative p-6">
        
        <h3 className="text-3xl font-bold text-foreground">{banner.title}</h3>
        <p className="mt-2 max-w-md text-base text-white">
          {banner.description}
        </p>
      </div>
    </article>
  );
}

interface QuickFilterRowProps {
  filters: QuickFilterLabel[];
}

function QuickFilterRow({ filters }: QuickFilterRowProps) {
  return (
    <section aria-label="Fast menu filters" className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Explore quickly</h2>
        <p className="mt-1 text-base text-muted-foreground  text-white">
          Jump to common preferences and dietary options.
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`min-h-12 shrink-0 rounded-2xl border border-border bg-card px-4 text-base font-bold text-foreground transition hover:border-primary/60 hover:text-primary active:scale-95 ${focusRing}`}
          >
            {filter}
          </button>
        ))}
      </div>
    </section>
  );
}

interface FeaturedProductSectionProps {
  products: Product[];
  title: string;
  onAddToCart: (product: Product) => void;
  onViewProductDetails: (product: Product) => void;
}

function FeaturedProductSection({
  products,
  title,
  onAddToCart,
  onViewProductDetails,
}: FeaturedProductSectionProps) {
  const headingId = `${title.toLowerCase().replaceAll(" ", "-")}-heading`;

  return (
    <section className="space-y-4" aria-labelledby={headingId}>
      <div>
        <h2 id={headingId} className="text-3xl font-bold text-foreground">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onViewDetails={onViewProductDetails}
          />
        ))}
      </div>
    </section>
  );
}

interface CategoryBannerProps {
  category: MenuCategory;
}

function CategoryBanner({ category }: CategoryBannerProps) {
  if (!category.banner) {
    return (
      <div className="border-b border-border px-4 py-6 sm:px-6">
        <h2 className="text-3xl font-bold text-foreground">{category.label}</h2>
        <p className="mt-1 text-base text-muted-foreground">
          Customer favorites and quick picks
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-44 overflow-hidden border-b border-border sm:h-52">
      <img
        src={category.banner}
        alt=""
        aria-hidden="true"
        className="size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <h2 className="text-4xl font-bold text-foreground">
          {category.label}
        </h2>
        {category.bannerTagline && (
          <p className="mt-1 text-base text-muted-foreground">
            {category.bannerTagline}
          </p>
        )}
      </div>
    </div>
  );
}
