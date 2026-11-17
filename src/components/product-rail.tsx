import Link from "next/link";
import type { HomeSection } from "@/types/content";
import { ProductCard } from "@/components/product-card";

/** Tira horizontal deslizable de productos de una categoría. En móvil: 2 tarjetas y parte de la tercera. */
export function ProductRail({ section }: { section: HomeSection }) {
  const headingId = `rail-${section.slug}`;
  const fitsOnDesktop = section.products.length <= 5;

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-3 flex items-end justify-between gap-4">
        <h3 id={headingId} className="text-xl font-bold sm:text-2xl">
          {section.title}
        </h3>
        <Link href={`/productos?categoria=${encodeURIComponent(section.slug)}`} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-primary-strong hover:underline">
          Ver todo<span className="sr-only"> en {section.title}</span>
        </Link>
      </div>

      {section.products.length ? (
        <>
          <ul className="rail -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-3 sm:gap-4">
            {section.products.map((product) => (
              <li key={product.id} className="w-[42%] shrink-0 snap-start sm:w-[30%] lg:w-[calc((100%-4rem)/5)]">
                <ProductCard product={product} variant={section.cardVariant} headingLevel={4} />
              </li>
            ))}
          </ul>
          <p className={`text-xs text-muted ${fitsOnDesktop ? "lg:hidden" : ""}`} aria-hidden>
            Desliza para ver más →
          </p>
        </>
      ) : (
        <p className="rounded-xl bg-card p-6 text-sm text-muted">Pronto agregaremos productos en esta categoría.</p>
      )}
    </section>
  );
}
