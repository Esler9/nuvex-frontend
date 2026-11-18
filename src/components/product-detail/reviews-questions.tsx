"use client";

import { useState, type FormEvent } from "react";
import { ArrowUp, Check } from "lucide-react";
import type { ProductReview } from "@/types/content";
import { useStore } from "@/components/store/store-provider";
import { Sheet } from "@/components/ui/sheet";
import { Stars } from "@/components/stars";
import { stripTags } from "@/lib/format";
import { useAccount } from "@/lib/account-store";

type Props = {
  productId: number;
  slug: string;
  rating: { value: string; count: number; raw: number } | null;
  faqs: Array<{ q: string; a: string }>;
  initialReviews: ProductReview[];
};

/** Fecha de WooCommerce ("2026-10-07T15:00:00") como "7 de octubre", sin depender de la zona horaria. */
function reviewDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const sameYear = y === new Date().getUTCFullYear();
  return new Intl.DateTimeFormat("es-GT", { day: "numeric", month: "long", year: sameYear ? undefined : "numeric", timeZone: "UTC" }).format(date);
}

/** 10. Calificaciones y preguntas. */
export function ReviewsAndQuestions({ productId, slug, rating, faqs, initialReviews }: Props) {
  const { customer, openPanel } = useStore();
  const account = useAccount();
  const [question, setQuestion] = useState("");
  const [reviews, setReviews] = useState(initialReviews);
  const [hasMore, setHasMore] = useState(initialReviews.length >= 2 && (rating?.count ?? 0) > initialReviews.length);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<{ src: string; alt: string } | null>(null);

  // Opiniones del cliente en este dispositivo (compra verificada) antes de las de la tienda.
  const mine: ProductReview[] = (account?.reviews ?? [])
    .filter((r) => r.slug === slug)
    .map((r, i) => ({ id: -(i + 1), reviewer: account?.customer.name ?? "Tú", review: r.comment, rating: r.rating, verified: true, date_created: r.date }));
  const shown = [...mine, ...reviews];

  function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;
    // Las preguntas requieren sesión de cliente; el envío se conectará cuando las cuentas estén activas.
    if (!customer) openPanel("account");
  }

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?product=${productId}&offset=${reviews.length}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { reviews: ProductReview[]; hasMore: boolean };
      setReviews((prev) => [...prev, ...data.reviews.filter((r) => !prev.some((p) => p.id === r.id))]);
      setHasMore(data.hasMore);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="resenas" aria-labelledby="calificaciones" className="scroll-mt-44 space-y-8">
      <h2 id="calificaciones" className="text-xl font-bold">
        Calificaciones y preguntas
      </h2>

      <div>
        <h3 className="font-semibold">Preguntas</h3>
        <form onSubmit={askQuestion} className="relative mt-3">
          <label htmlFor="pregunta" className="sr-only">
            Escribe tu pregunta
          </label>
          <input
            id="pregunta"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={300}
            placeholder="Haznos saber tus dudas"
            className="min-h-12 w-full rounded-full border border-border bg-card pl-4 pr-14 text-base placeholder:text-muted focus:border-primary"
          />
          <button type="submit" aria-label="Enviar pregunta" className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-primary-strong text-white hover:bg-navy">
            <ArrowUp aria-hidden className="size-5" />
          </button>
        </form>
        {!customer && <p className="mt-2 text-xs text-muted">Necesitas iniciar sesión para enviar tu pregunta.</p>}
        {faqs.length > 0 && (
          <ul className="mt-4 space-y-3">
            {faqs.map((f) => (
              <li key={f.q} className="rounded-xl bg-card p-4">
                <p className="text-sm font-semibold">{f.q}</p>
                <p className="mt-1 text-sm text-muted">
                  <span className="font-semibold text-primary-strong">Respuesta de la tienda: </span>
                  {f.a}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="font-semibold">Reseñas</h3>
        {rating ? (
          <div className="mt-3 flex items-center gap-4">
            <p className="text-5xl font-black">{rating.value}</p>
            <div>
              <Stars value={rating.raw} className="size-5" />
              <p className="mt-1 text-sm text-muted">
                {rating.count} {rating.count === 1 ? "opinión" : "opiniones"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">Este producto aún no tiene opiniones.</p>
        )}

        {shown.length > 0 && (
          <ul className="mt-6 space-y-6">
            {shown.map((r) => {
              const name = r.reviewer?.trim() || "Anónimo";
              return (
                <li key={r.id} className="flex gap-3">
                  <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft font-bold text-primary-strong">
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="text-sm font-semibold">{name}</p>
                      {r.verified && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                          <Check aria-hidden className="size-3.5" /> Compra verificada
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                      <Stars value={r.rating} className="size-3.5" />
                      <span className="sr-only">{r.rating} de 5 estrellas,</span>
                      <time dateTime={r.date_created.slice(0, 10)}>{reviewDate(r.date_created)}</time>
                    </div>
                    <p className="mt-2 text-sm">{stripTags(r.review)}</p>
                    {r.images && r.images.length > 0 && (
                      <ul className="mt-2 flex gap-2">
                        {r.images.map((img, i) => (
                          <li key={i}>
                            <button type="button" onClick={() => setPhoto(img)} aria-label="Ver foto del cliente en grande" className="size-16 overflow-hidden rounded-lg bg-image-well">
                              <img src={img.src} alt="" width={64} height={64} loading="lazy" className="size-full object-cover" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {hasMore && (
          <>
            <hr className="mt-6 border-divider" />
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={loadMore} disabled={loading} className="min-h-11 rounded-lg border border-primary px-5 text-sm font-semibold text-primary-strong hover:bg-primary-soft disabled:opacity-60">
                {loading ? "Cargando…" : "Ver más"}
              </button>
            </div>
          </>
        )}
      </div>

      <Sheet open={!!photo} onClose={() => setPhoto(null)} title="Foto del cliente" side="center">
        {photo && <img src={photo.src} alt={photo.alt} className="w-full rounded-lg object-contain" />}
      </Sheet>
    </section>
  );
}
