"use client";

import { useState } from "react";
import Link from "next/link";
import { saveProductAction } from "@/app/admin/actions";
import { Alert, Field, SubmitButton, describedBy, inputClass, useFormAction } from "@/components/admin/fields";
import type { WcAdminCategory, WcAdminProduct } from "@/types/admin";

const statusOptions = [
  { value: "publish", label: "Publicado" },
  { value: "draft", label: "Borrador" },
  { value: "pending", label: "Pendiente de revisión" },
  { value: "private", label: "Privado" },
];

const stockOptions = [
  { value: "instock", label: "En existencia" },
  { value: "outofstock", label: "Agotado" },
  { value: "onbackorder", label: "Bajo pedido" },
];

export function ProductForm({ product, categories, mediaEnabled }: { product?: WcAdminProduct; categories: WcAdminCategory[]; mediaEnabled: boolean }) {
  const { state, pending, onSubmit } = useFormAction(saveProductAction);
  const [manageStock, setManageStock] = useState(product?.manage_stock ?? false);
  const errors = state?.fieldErrors ?? {};
  const isSimple = !product || product.type === "simple";
  const selected = new Set(product?.categories.map((c) => c.id));

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      {state?.error && <Alert>{state.error}</Alert>}
      {product && <input type="hidden" name="id" value={product.id} />}

      <section className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:p-6" aria-labelledby="general">
        <h2 id="general" className="text-base font-semibold">General</h2>
        <Field name="name" label="Nombre" required error={errors.name}>
          <input {...describedBy("name", undefined, errors.name)} defaultValue={product?.name} required maxLength={200} className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="status" label="Estado" hint="Solo los publicados aparecen en la tienda.">
            <select {...describedBy("status", true)} defaultValue={product?.status ?? "draft"} className={inputClass}>
              {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field name="sku" label="SKU" hint="Opcional. Debe ser único en la tienda.">
            <input {...describedBy("sku", true)} defaultValue={product?.sku} maxLength={100} className={inputClass} />
          </Field>
        </div>
        <Field name="short_description" label="Descripción corta" hint="Se admite HTML básico.">
          <textarea {...describedBy("short_description", true)} defaultValue={product?.short_description} rows={3} className={inputClass} />
        </Field>
        <Field name="description" label="Descripción" hint="Se admite HTML. La ficha del producto extrae características, especificaciones y preguntas de aquí.">
          <textarea {...describedBy("description", true)} defaultValue={product?.description} rows={10} className={`${inputClass} font-mono text-xs`} />
        </Field>
      </section>

      <section className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:p-6" aria-labelledby="precio">
        <h2 id="precio" className="text-base font-semibold">Precio y existencias</h2>
        {isSimple ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="regular_price" label="Precio regular (Q)" error={errors.regular_price}>
                <input {...describedBy("regular_price", undefined, errors.regular_price)} defaultValue={product?.regular_price} inputMode="decimal" placeholder="149.99" className={inputClass} />
              </Field>
              <Field name="sale_price" label="Precio de oferta (Q)" hint="Déjalo vacío si no hay oferta real." error={errors.sale_price}>
                <input {...describedBy("sale_price", true, errors.sale_price)} defaultValue={product?.sale_price} inputMode="decimal" placeholder="Opcional" className={inputClass} />
              </Field>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="manage_stock" checked={manageStock} onChange={(e) => setManageStock(e.target.checked)} className="size-4 accent-primary-strong" />
              Controlar inventario por cantidad
            </label>
            {manageStock ? (
              <Field name="stock_quantity" label="Cantidad en existencia" error={errors.stock_quantity}>
                <input {...describedBy("stock_quantity", undefined, errors.stock_quantity)} type="number" min={0} step={1} defaultValue={product?.stock_quantity ?? 0} className={`${inputClass} sm:max-w-48`} />
              </Field>
            ) : (
              <Field name="stock_status" label="Disponibilidad">
                <select id="stock_status" name="stock_status" defaultValue={product?.stock_status ?? "instock"} className={`${inputClass} sm:max-w-64`}>
                  {stockOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            )}
          </>
        ) : (
          <Alert tone="info">
            Este es un producto <strong>{product?.type === "variable" ? "variable" : product?.type}</strong>. El precio y las existencias de cada variación se gestionan desde WooCommerce (wp-admin).
          </Alert>
        )}
      </section>

      <fieldset className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:p-6">
        <legend className="px-1 text-base font-semibold">Categorías</legend>
        {categories.length ? (
          <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-surface">
                <input type="checkbox" name="categories" value={c.id} defaultChecked={selected.has(c.id)} className="size-4 accent-primary-strong" />
                <span>{c.parent ? "— " : ""}{c.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Aún no hay categorías. <Link href="/admin/categorias/nueva" className="font-medium text-primary-strong underline">Crea una</Link>.</p>
        )}
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:p-6">
        <legend className="px-1 text-base font-semibold">Imágenes</legend>
        {product?.images.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {product.images.map((img, i) => (
              <li key={img.id} className="grid gap-2 rounded-lg border border-border p-2">
                <div className="aspect-square overflow-hidden rounded-md bg-image-well">
                  <img src={img.src} alt={img.alt || `Imagen ${i + 1} de ${product.name}`} width={160} height={160} loading="lazy" className="size-full object-contain" />
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" name="keep_images" value={img.id} defaultChecked className="size-4 accent-primary-strong" />
                  {i === 0 ? "Conservar (principal)" : "Conservar"}
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Este producto aún no tiene imágenes.</p>
        )}
        <Field
          name="images"
          label="Agregar imágenes"
          hint={mediaEnabled ? "JPG, PNG o WebP, máximo 4 MB cada una y hasta 4 por vez. Se agregan al final; la primera imagen es la principal." : "Configura WP_API_USER y WP_APPLICATION_PASSWORD en el servidor para subir imágenes."}
          error={errors.images}
        >
          <input {...describedBy("images", true, errors.images)} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={!mediaEnabled} className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-strong" />
        </Field>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pending={pending}>{product ? "Guardar cambios" : "Crear producto"}</SubmitButton>
        <Link href="/admin/productos" className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-muted hover:text-foreground">Cancelar</Link>
      </div>
    </form>
  );
}
