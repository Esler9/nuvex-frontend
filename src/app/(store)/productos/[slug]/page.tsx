import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { notFound } from "next/navigation";
import { getCardVariantForProduct, getProduct, getProductOptions, getProductReviews, money } from "@/lib/api";
import { brandName, deliveryEstimate, parseProductInfo, ratingInfo } from "@/lib/product-meta";
import { stripTags } from "@/lib/format";
import { ProductView } from "@/components/product-detail/product-view";
import { ProductInfoSection } from "@/components/product-detail/product-info";
import { ReviewsAndQuestions } from "@/components/product-detail/reviews-questions";
import { RecentlyViewed } from "@/components/product-detail/recently-viewed";
import { SuggestedProducts } from "@/components/product-detail/suggested-products";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return { title: "Producto no encontrado" };
  const description = stripTags(p.short_description || "").slice(0, 160) || `${p.name} — ${money(p)}. Envíos a todo Guatemala.`;
  const image = p.images?.[0]?.src;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/productos/${p.slug}` },
    openGraph: { title: p.name, description, images: image?.startsWith("http") ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  const [options, style, reviews] = await Promise.all([getProductOptions(product), getCardVariantForProduct(product), getProductReviews(product.id, 0, 2)]);
  const info = parseProductInfo(product.description || "", product.attributes ?? []);
  const rating = ratingInfo(product);

  // Datos estructurados con información real de WooCommerce.
  const brand = brandName(product);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku || undefined,
    image: product.images?.map((i) => i.src).filter((src) => src.startsWith("http")),
    brand: brand ? { "@type": "Brand", name: brand } : undefined,
    offers: product.prices
      ? {
          "@type": "Offer",
          price: (Number(product.prices.price) / 10 ** product.prices.currency_minor_unit).toFixed(product.prices.currency_minor_unit),
          priceCurrency: product.prices.currency_code || "GTQ",
          availability: product.is_in_stock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        }
      : undefined,
    aggregateRating: rating ? { "@type": "AggregateRating", ratingValue: rating.value, reviewCount: rating.count } : undefined,
  };

  return (
    <PageTransition kind="detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ProductView product={product} options={options} style={style} video={info.video} delivery={deliveryEstimate()}>
        <ProductInfoSection info={info} />
        <hr className="border-divider" />
        <ReviewsAndQuestions productId={product.id} slug={product.slug} rating={rating} faqs={info.faqs} initialReviews={reviews} />
        <RecentlyViewed current={product} />
        <SuggestedProducts productId={product.id} category={product.categories?.[0]?.slug} />
      </ProductView>
    </PageTransition>
  );
}
