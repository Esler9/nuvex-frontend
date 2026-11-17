import { NextResponse, type NextRequest } from "next/server";
import { getProductReviews } from "@/lib/api";

/** GET /api/reviews?product=ID&offset=N — más reseñas para "Ver más". */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const product = Number(params.get("product"));
  const offset = Number(params.get("offset") ?? 0);
  if (!Number.isInteger(product) || product <= 0 || !Number.isFinite(offset) || offset < 0) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }
  const limit = 10;
  const reviews = await getProductReviews(product, offset, limit);
  return NextResponse.json({ reviews, hasMore: reviews.length === limit });
}
