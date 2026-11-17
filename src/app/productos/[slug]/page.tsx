import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import { getProduct, money } from "@/lib/api";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { FavoriteButton } from "@/components/favorite-button";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return { title: "Producto no encontrado" };
  return { title: p.name, description: `${p.name} — ${money(p)}. Envíos a todo Guatemala.`, alternates: { canonical: `/productos/${p.slug}` } };
}

export default async function ProductPage({ params }: Props) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const img = p.images?.[0];
  return (
    <section className="container-shell py-8 sm:py-16">
      <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-strong hover:underline" href="/productos">
        ← Todos los productos
      </Link>
      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="flex aspect-square items-center justify-center rounded-xl bg-surface">
          {img ? (
            <img className="h-full w-full object-contain p-8" src={img.src} alt={img.alt || p.name} width={600} height={600} fetchPriority="high" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted">
              <Smartphone aria-hidden className="size-16 text-primary/50" strokeWidth={1.25} />
              <span className="text-sm">Imagen próximamente</span>
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{p.name}</h1>
          <p className="mt-4 text-3xl font-black text-foreground">{money(p)}</p>
          <p className="mt-2 text-sm text-muted">{p.is_in_stock === false ? "Agotado" : "Disponible"}</p>
          <div className="mt-8 flex max-w-sm items-center gap-3">
            <div className="flex-1"><AddToCartButton product={p} /></div>
            <FavoriteButton product={p} className="shrink-0 border border-border" />
          </div>
        </div>
      </div>
    </section>
  );
}
