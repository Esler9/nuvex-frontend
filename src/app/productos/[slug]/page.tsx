import type {Metadata} from "next";
import {notFound} from "next/navigation";
import Link from "next/link";
import {getProduct,money} from "@/lib/api";
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const p=await getProduct((await params).slug);return {title:p?.name||"Producto",description:p?.name||"Producto Nuvex"}}
export default async function ProductPage({params}:Props){const p=await getProduct((await params).slug);if(!p)notFound();const img=p.images?.[0];return <section className="container-shell py-16"><Link className="text-sm text-[var(--accent)]" href="/productos">← Todos los productos</Link><div className="mt-10 grid gap-12 md:grid-cols-2"><div className="flex aspect-square items-center justify-center rounded-3xl bg-white/5">{img?<img className="h-full w-full object-contain p-8" src={img.src} alt={img.alt||p.name}/>:<span>Imagen no disponible</span>}</div><div><h1 className="text-4xl font-bold">{p.name}</h1><p className="mt-5 text-3xl font-black text-[var(--accent)]">{money(p)}</p><p className="mt-4 text-sm text-slate-400">{p.is_in_stock?"Disponible":"Consultar disponibilidad"}</p><p className="mt-8 text-sm text-slate-300">Carrito y pagos se integrarán mediante WooCommerce Store API y la pasarela validada.</p></div></div></section>}
