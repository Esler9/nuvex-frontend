import type {Metadata} from "next";
import {getProducts} from "@/lib/api";
import {ProductCard} from "@/components/product-card";
import {EmptyState} from "@/components/empty-state";
export const metadata:Metadata={title:"Productos",description:"Explora el catálogo de Nuvex."};
export default async function ProductsPage(){const products=await getProducts();return <section className="container-shell py-20"><p className="mb-3 text-sm font-semibold uppercase tracking-[.2em] text-primary">Catálogo</p><h1 className="mb-10 text-5xl font-bold">Nuestros productos</h1>{products.length?<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<EmptyState kind="productos"/>}</section>}
