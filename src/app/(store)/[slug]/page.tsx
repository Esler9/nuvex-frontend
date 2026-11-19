import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/api";
import { stripTags } from "@/lib/format";

/** Páginas informativas administradas en WordPress (términos, privacidad, garantía, ayuda...). */
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Página no encontrada" };
  return {
    title: stripTags(page.title.rendered),
    description: stripTags(page.excerpt.rendered).slice(0, 160) || undefined,
    alternates: { canonical: `/${page.slug}` },
  };
}

export default async function WordPressPage({ params }: Props) {
  const page = await getPage((await params).slug);
  if (!page) notFound();
  return (
    <PageTransition>
    <article className="container-shell max-w-3xl py-12 sm:py-20">
      <h1 className="text-3xl font-bold sm:text-4xl">{stripTags(page.title.rendered)}</h1>
      <div className="prose-content mt-8" dangerouslySetInnerHTML={{ __html: page.content.rendered }} />
    </article>
    </PageTransition>
  );
}
