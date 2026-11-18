"use client";

import Link from "next/link";
import { saveCategoryAction } from "@/app/admin/actions";
import { Alert, Field, SubmitButton, describedBy, inputClass, useFormAction } from "@/components/admin/fields";
import type { WcAdminCategory } from "@/types/admin";

export function CategoryForm({ category, categories, mediaEnabled }: { category?: WcAdminCategory; categories: WcAdminCategory[]; mediaEnabled: boolean }) {
  const { state, pending, onSubmit } = useFormAction(saveCategoryAction);
  const errors = state?.fieldErrors ?? {};
  const parents = categories.filter((c) => c.id !== category?.id);

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      {state?.error && <Alert>{state.error}</Alert>}
      {category && <input type="hidden" name="id" value={category.id} />}

      <section className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:p-6">
        <Field name="name" label="Nombre" required error={errors.name}>
          <input {...describedBy("name", false, errors.name)} defaultValue={category?.name} required maxLength={120} className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="slug" label="Slug (URL)" hint="Opcional; se genera del nombre. Cambiarlo rompe enlaces existentes y el menú de la tienda." error={errors.slug}>
            <input {...describedBy("slug", true, errors.slug)} defaultValue={category?.slug} maxLength={120} placeholder="fundas-iphone" className={inputClass} />
          </Field>
          <Field name="parent" label="Categoría superior" error={errors.parent}>
            <select {...describedBy("parent", false, errors.parent)} defaultValue={category?.parent ?? 0} className={inputClass}>
              <option value={0}>Ninguna (principal)</option>
              {parents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <Field name="description" label="Descripción" hint='La tienda lee aquí el estilo de tarjeta (p. ej. "tarjeta: 2"). Consérvalo si ya existe.'>
          <textarea {...describedBy("description", true)} defaultValue={category?.description} rows={4} maxLength={2000} className={inputClass} />
        </Field>
      </section>

      <fieldset className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:p-6">
        <legend className="px-1 text-base font-semibold">Imagen</legend>
        {category?.image ? (
          <div className="flex items-center gap-4">
            <div className="size-20 overflow-hidden rounded-full bg-image-well">
              <img src={category.image.src} alt={category.image.alt || `Imagen de ${category.name}`} width={80} height={80} loading="lazy" className="size-full object-cover" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="remove_image" className="size-4 accent-primary-strong" />
              Quitar imagen
            </label>
          </div>
        ) : (
          <p className="text-sm text-muted">Sin imagen. La tienda muestra un ícono de respaldo.</p>
        )}
        <Field
          name="image"
          label={category?.image ? "Reemplazar imagen" : "Subir imagen"}
          hint={mediaEnabled ? "JPG, PNG o WebP, máximo 4 MB. Se recomienda cuadrada." : "Configura WP_API_USER y WP_APPLICATION_PASSWORD en el servidor para subir imágenes."}
          error={errors.image}
        >
          <input {...describedBy("image", true, errors.image)} type="file" accept="image/jpeg,image/png,image/webp" disabled={!mediaEnabled} className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-strong" />
        </Field>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pending={pending}>{category ? "Guardar cambios" : "Crear categoría"}</SubmitButton>
        <Link href="/admin/categorias" className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-muted hover:text-foreground">Cancelar</Link>
      </div>
    </form>
  );
}
