import { NextResponse, type NextRequest } from "next/server";
import { cardVariantFor, getCategories, getProducts, isDemoCatalog } from "@/lib/api";

const PER_PAGE = 6;

/**
 * GET /api/suggested?category=slug&exclude=ID&phase=cat|all&page=N
 * Primero productos de la misma categoría; al terminarse, el resto del catálogo.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const category = (params.get("category") || "").slice(0, 100);
  const exclude = Number(params.get("exclude"));
  const page = Number(params.get("page") ?? 1);
  const phase = params.get("phase") === "all" || !category ? "all" : "cat";
  if (!Number.isInteger(page) || page < 1 || page > 50) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const [products, categories] = await Promise.all([
    getProducts({ category: phase === "cat" ? category : undefined, perPage: PER_PAGE, page }),
    isDemoCatalog ? Promise.resolve([]) : getCategories(),
  ]);
  const full = products.length === PER_PAGE;
  const items = products
    .filter((p) => p.id !== exclude)
    .filter((p) => phase === "cat" || !p.categories?.some((c) => c.slug === category))
    .map((product) => ({ product, variant: cardVariantFor(product, categories) }));

  const next = full ? { phase, page: page + 1 } : phase === "cat" ? { phase: "all", page: 1 } : null;
  return NextResponse.json({ items, next });
}
