import type {Metadata} from "next";
import {notFound} from "next/navigation";
import Link from "next/link";
import {getArticle} from "@/lib/api";
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const p=await getArticle((await params).slug);return {title:p?.title.rendered.replace(/<[^>]*>/g,"")||"Artículo"}}
export default async function ArticlePage({params}:Props){const p=await getArticle((await params).slug);if(!p)notFound();return <article className="container-shell max-w-3xl py-20"><Link className="text-sm text-primary hover:underline" href="/blog">← Blog</Link><h1 className="mt-8 text-4xl font-bold">{p.title.rendered.replace(/<[^>]*>/g,"")}</h1><p className="mt-5 text-sm text-muted">{new Date(p.date).toLocaleDateString("es-GT")}</p><div className="prose-content mt-10" dangerouslySetInnerHTML={{__html:p.content.rendered}}/></article>}
