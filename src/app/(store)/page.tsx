import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { getDiscoverCategories, getHomeSections, isDemoCatalog } from "@/lib/api";
import { DiscoverCategories } from "@/components/discover-categories";
import { siteConfig } from "@/lib/site-config";
import { HeroCarousel } from "@/components/hero-carousel";
import { ProductRail } from "@/components/product-rail";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [sections, discover] = await Promise.all([getHomeSections(), getDiscoverCategories()]);
  return (
    <PageTransition>
      <h1 className="sr-only">{siteConfig.name}: accesorios para celulares en Guatemala</h1>
      <HeroCarousel slides={siteConfig.slides} />

      <section aria-labelledby="categorias" className="container-shell py-10 sm:py-14">
        <h2 id="categorias" className="text-2xl font-black tracking-tight sm:text-3xl">
          Categorías
        </h2>
        {isDemoCatalog && (
          <p className="mt-3 rounded-xl bg-primary-soft px-4 py-3 text-sm text-foreground">
            Productos de ejemplo: conecta WooCommerce para mostrar tu catálogo real.
          </p>
        )}
        <div className="mt-8 space-y-10 sm:space-y-12">
          {sections.map((section) => (
            <ProductRail key={section.slug} section={section} />
          ))}
        </div>
        <div className="mt-12">
          <DiscoverCategories title={siteConfig.discover.title} subtitle={siteConfig.discover.subtitle} categories={discover} />
        </div>
      </section>
    </PageTransition>
  );
}
