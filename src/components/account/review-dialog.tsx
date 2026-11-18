"use client";

import { useState, type FormEvent } from "react";
import { ImagePlus, Star } from "lucide-react";
import type { MyReview, OrderLine } from "@/types/account";
import { Sheet } from "@/components/ui/sheet";
import { ui } from "@/components/ui/styles";
import { useStore } from "@/components/store/store-provider";
import { accountStore } from "@/lib/account-store";
import { siteConfig } from "@/lib/site-config";

export type ReviewTarget = { orderId: string; line: OrderLine; existing?: MyReview };

/** Calificar un producto de una compra entregada (estrellas + comentario de al menos 20 caracteres). */
export function ReviewDialog({ target, onClose }: { target: ReviewTarget | null; onClose: () => void }) {
  return (
    <Sheet open={!!target} onClose={onClose} title={target?.existing ? "Mi opinión" : "Calificar producto"} side="center">
      {target && <ReviewForm key={`${target.orderId}-${target.line.productId}`} target={target} onDone={onClose} />}
    </Sheet>
  );
}

function ReviewForm({ target, onDone }: { target: ReviewTarget; onDone: () => void }) {
  const { notify } = useStore();
  const min = siteConfig.points.minReviewChars;
  const [rating, setRating] = useState(target.existing?.rating ?? 0);
  const [comment, setComment] = useState(target.existing?.comment ?? "");
  const [photos, setPhotos] = useState<number>(target.existing?.photos ?? 0);
  const [tried, setTried] = useState(false);
  const valid = rating >= 1 && rating <= 5 && comment.trim().length >= min;

  function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    const { line, orderId } = target;
    const earned = accountStore.submitReview({ orderId, productId: line.productId, slug: line.slug, productName: line.name, image: line.image, rating, comment: comment.trim(), photos: photos || undefined });
    notify(earned ? `¡Gracias por tu opinión! Ganaste ${earned} Puntos NUVEX.` : "Tu opinión se actualizó.");
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="text-sm font-semibold">{target.line.name}</p>
      <fieldset>
        <legend className="text-sm font-medium">Tu calificación</legend>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-lg p-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary">
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
              <Star aria-hidden className={`size-8 ${n <= rating ? "fill-star text-star" : "text-pending"}`} />
              <span className="sr-only">{n === 1 ? "1 estrella" : `${n} estrellas`}</span>
            </label>
          ))}
        </div>
        {tried && rating === 0 && <p className="mt-1 text-sm font-medium text-danger">Elige de 1 a 5 estrellas.</p>}
      </fieldset>
      <div>
        <label htmlFor="review-comment" className="text-sm font-medium">
          Comentario
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
          aria-invalid={tried && comment.trim().length < min}
          aria-describedby="review-count"
          className={`${ui.input} py-3`}
          placeholder="¿Qué te pareció el producto?"
        />
        <p id="review-count" className={`mt-1 text-xs ${tried && comment.trim().length < min ? "font-medium text-danger" : "text-muted"}`}>
          {comment.trim().length < min ? `Escribe al menos ${min} caracteres (${comment.trim().length}/${min}).` : `${comment.trim().length} caracteres`}
        </p>
      </div>
      <div>
        <label htmlFor="review-photos" className={`${ui.btnGhost} cursor-pointer`}>
          <ImagePlus aria-hidden className="size-4" /> Agregar fotos (opcional)
        </label>
        <input id="review-photos" type="file" accept="image/jpeg,image/png" multiple className="sr-only" onChange={(e) => setPhotos(Math.min(e.target.files?.length ?? 0, 5))} />
        {photos > 0 && <p className="mt-1 text-xs text-muted">{photos === 1 ? "1 foto seleccionada" : `${photos} fotos seleccionadas`}</p>}
      </div>
      {target.existing && <p className="text-xs text-muted">Editar tu opinión no suma puntos otra vez.</p>}
      <button type="submit" className={`${ui.btnPrimary} w-full`}>
        {target.existing ? "Guardar cambios" : "Enviar opinión"}
      </button>
    </form>
  );
}
