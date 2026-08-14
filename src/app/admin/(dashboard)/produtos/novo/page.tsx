import Link from "next/link"
import { createProduct } from "../../../actions"
import ProductForm from "@/components/admin/ProductForm"

export default function NewProductPage() {
  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-8 px-2">
        <Link href="/admin/produtos" className="text-zinc-400 hover:text-black transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Adicionar nova peça</h2>
      </div>
      
      <ProductForm action={createProduct} />
    </div>
  )
}
