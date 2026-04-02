import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0B1C3B] text-white">
      
      <div className="mb-14 flex flex-col items-center justify-center">
         <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-1">
           Genial Invest.
         </h1>
         <h2 className="text-2xl font-bold text-[#1875E5] tracking-tight">
           Pedidos
         </h2>
      </div>
      
      <div className="flex gap-6">
        <Link href="/recepcao" className="px-8 py-4 bg-white/10 border border-white/20 shadow-md text-xl font-bold rounded-2xl hover:bg-white/20 hover:scale-105 transition text-white">
          Recepção
        </Link>
        <Link href="/sala" className="px-8 py-4 bg-[#1875E5] text-white shadow-md text-xl font-bold rounded-2xl hover:bg-[#1564C0] hover:scale-105 transition border border-[#1875E5]/50">
          Sala
        </Link>
      </div>
    </div>
  );
}
