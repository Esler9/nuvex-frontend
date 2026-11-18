import { NextResponse, type NextRequest } from "next/server";
import { cardVariantFor, getCategories, getComplementaryProducts, isDemoCatalog } from "@/lib/api";

/** GET /api/complementary?ids=1,2,3 — complementarios de los productos del carrito. */
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") || "")
    .split(",")
    .slice(0, 30)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  const [products, categories] = await Promise.all([getComplementaryProducts(ids), isDemoCatalog ? Promise.resolve([]) : getCategories()]);
  return NextResponse.json({ items: products.map((product) => ({ product, variant: cardVariantFor(product, categories) })) });
}
