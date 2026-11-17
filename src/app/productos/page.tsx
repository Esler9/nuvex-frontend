import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getProducts, isDemoCatalog } from "@/lib/api";
import { siteConfig } from "@/lib/site-config";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";

type Props = { searchParams: Promise<{ q?: string | string[]; categoria?: string | string[] }> };

const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 100) || "";

export const metadata: Metadata = {
  title: "Productos",
  description: "Explora accesorios para iPhone y Samsung, adaptadores y memorias.",
  alternates: { canonical: "/productos" },
};

async function categoryName(slug: string) {
  const fromConfig = [...siteConfig.menuCategories.map((c) => ({ name: c.label, slug: c.slug })), ...siteConfig.homeSections.map((s) => ({ name: s.title, slug: s.slug })), ...siteConfig.discover.categories.map((c) => ({ name: c.label, slug: c.slug }))].find((c) => c.slug === slug);
  if (isDemoCatalog || fromConfig) return fromConfig?.name;
  return (await getCategories()).find((c) => c.slug === slug)?.name;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = first(params.q);
  const categoria = first(params.categoria);
  const [products, catName] = await Promise.all([getProducts({ search: q, category: categoria || undefined, perPage: 24 }), categoria ? categoryName(categoria) : undefined]);

  const title = q ? `Resultados para “${q}”` : catName || "Nuestros productos";

  return (
    <section className="container-shell py-10 sm:py-16">
      <p className="mb-2 text-sm font-semibold uppercase tracking-[.2em] text-primary-strong">Catálogo</p>
      <h1 className="mb-3 text-3xl font-bold sm:text-5xl">{title}</h1>
      {(q || categoria) && (
        <Link href="/productos" className="mb-8 inline-flex min-h-11 items-center text-sm font-semibold text-primary-strong hover:underline">
          ← Ver todos los productos
        </Link>
      )}
      {products.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState kind={q ? "resultados para tu búsqueda" : "productos"} />
        </div>
      )}
    </section>
  );
}
