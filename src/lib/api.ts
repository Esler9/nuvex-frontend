import type { Article, Product } from "@/types/content";
const wordpress=(process.env.WORDPRESS_URL||"").replace(/\/$/,"");
const commerce=(process.env.WOOCOMMERCE_URL||wordpress).replace(/\/$/,"");
async function request<T>(url:string):Promise<T|null>{
  if(!url.startsWith("https://")&&!url.startsWith("http://"))return null;
  try{const response=await fetch(url,{next:{revalidate:300},headers:{Accept:"application/json"}});
  if(!response.ok){console.error("Headless API status",response.status);return null}
  return await response.json() as T;}catch{console.error("Headless API unavailable");return null}
}
export async function getProducts():Promise<Product[]>{return await request<Product[]>(commerce+"/wp-json/wc/store/v1/products?per_page=12")??[]}
export async function getProduct(slug:string):Promise<Product|null>{const items=await request<Product[]>(commerce+"/wp-json/wc/store/v1/products?slug="+encodeURIComponent(slug));return items?.[0]??null}
export async function getArticles():Promise<Article[]>{return await request<Article[]>(wordpress+"/wp-json/wp/v2/posts?per_page=6&_fields=id,slug,date,title,excerpt,content")??[]}
export async function getArticle(slug:string):Promise<Article|null>{const items=await request<Article[]>(wordpress+"/wp-json/wp/v2/posts?slug="+encodeURIComponent(slug)+"&_fields=id,slug,date,title,excerpt,content");return items?.[0]??null}
export function money(p:Product){if(!p.prices)return "Consultar";const v=Number(p.prices.price)/10**p.prices.currency_minor_unit;return new Intl.NumberFormat("es-GT",{style:"currency",currency:p.prices.currency_code||"GTQ"}).format(v)}
