import type {Metadata} from "next";
import Link from "next/link";
import {getArticles} from "@/lib/api";
import {EmptyState} from "@/components/empty-state";
export const metadata:Metadata={title:"Blog",description:"Noticias y artículos de Nuvex"};
export default async function BlogPage(){const posts=await getArticles();return <section className="container-shell py-20"><h1 className="mb-10 text-5xl font-bold">Blog</h1>{posts.length?<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{posts.map(p=><article key={p.id} className="rounded-xl border border-border p-7"><h2 className="text-xl font-bold">{p.title.rendered.replace(/<[^>]*>/g,"")}</h2><p className="mt-4 text-sm text-muted">{new Date(p.date).toLocaleDateString("es-GT")}</p><Link className="mt-5 inline-block text-sm font-semibold text-primary-strong hover:underline" href={"/blog/"+encodeURIComponent(p.slug)}>Leer artículo →</Link></article>)}</div>:<EmptyState kind="artículos"/>}</section>}
