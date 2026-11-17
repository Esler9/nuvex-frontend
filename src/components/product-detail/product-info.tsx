import type { ProductInfo } from "@/types/content";

/** 9. Información del producto: características, especificaciones, contenido y garantía. */
export function ProductInfoSection({ info }: { info: ProductInfo }) {
  const hasContent = info.introHtml || info.features.length || info.specs.length || info.box.length || info.warranty;
  if (!hasContent) return null;

  return (
    <section aria-labelledby="info-producto" className="space-y-6">
      <h2 id="info-producto" className="text-xl font-bold">
        Información del producto
      </h2>
      {info.introHtml && <div className="prose-content text-sm" dangerouslySetInnerHTML={{ __html: info.introHtml }} />}
      {info.features.length > 0 && (
        <div>
          <h3 className="font-semibold">Características</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted marker:text-primary">
            {info.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {info.specs.length > 0 && (
        <div>
          <h3 className="font-semibold">Especificaciones</h3>
          <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <tbody>
                {info.specs.map(([key, value]) => (
                  <tr key={key} className="border-b border-border last:border-0">
                    <th scope="row" className="w-2/5 px-4 py-3 text-left font-medium text-muted">
                      {key}
                    </th>
                    <td className="px-4 py-3">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {info.box.length > 0 && (
        <div>
          <h3 className="font-semibold">Contenido de la caja</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted marker:text-primary">
            {info.box.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}
      {info.warranty && (
        <div>
          <h3 className="font-semibold">Garantía</h3>
          <p className="mt-2 text-sm text-muted">{info.warranty}</p>
        </div>
      )}
    </section>
  );
}
