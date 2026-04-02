"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// --- Ícones SVG Minimalistas Genial ---
const MinusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

interface Produto {
  id: string;
  nome: string;
  disponivel: boolean;
}

export default function SalaPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase
      .from("produtos")
      .select("*")
      .eq("disponivel", true)
      .then(({ data }) => {
        if (data) setProdutos(data);
      });
  }, []);

  const handleChange = (id: string, amount: number) => {
    setCarrinho((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + amount),
    }));
  };

  const fazerPedido = async () => {
    const itens = Object.entries(carrinho).filter((entry) => entry[1] > 0);
    if (!itens.length) return alert("Por favor, selecione ao menos 1 item.");
    
    setEnviando(true);

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .insert([
        {
          sala: "Principal",
          comentario_convidado: comentario,
          status: "pendente",
        },
      ])
      .select()
      .single();

    if (error || !pedido) {
      alert("Falha de conexão. Tente novamente.");
      setEnviando(false);
      return;
    }

    const insertItens = itens.map(([produto_id, quantidade]) => ({
      pedido_id: pedido.id,
      produto_id,
      quantidade,
    }));

    await supabase.from("itens_pedido").insert(insertItens);

    alert("Pedido enviado para a recepção!");
    setCarrinho({});
    setComentario("");
    setEnviando(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F4FA] font-sans">
      
      {/* Header Mobile Genial */}
      <header className="bg-[#0B1C3B] pt-12 pb-6 px-6 shadow-md rounded-b-[40px] mb-8">
        <h1 className="text-3xl font-bold text-center text-white tracking-tight">
          Sala Principal
        </h1>
        <p className="text-[#1875E5] text-center text-sm font-semibold mt-1">Portal da Sala</p>
      </header>

      <main className="p-6 max-w-lg mx-auto">
        <div className="space-y-4 mb-8">
          {produtos.map((p) => (
            <div key={p.id} className="flex justify-between items-center p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
              <span className="font-bold text-lg text-[#0B1C3B]">{p.nome}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleChange(p.id, -1)}
                  className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <MinusIcon />
                </button>
                <span className="w-6 text-center font-bold text-xl text-[#0B1C3B]">{carrinho[p.id] || 0}</span>
                <button
                  onClick={() => handleChange(p.id, 1)}
                  className="w-10 h-10 flex items-center justify-center bg-[#1875E5]/10 text-[#1875E5] rounded-full hover:bg-[#1875E5]/20 transition"
                >
                  <PlusIcon />
                </button>
              </div>
            </div>
          ))}
          
          {produtos.length === 0 && (
             <div className="text-center p-8 text-slate-400 font-medium">Carregando catálogo...</div>
          )}
        </div>

        <div className="mb-6">
           <textarea
             className="w-full border-0 bg-white rounded-3xl p-5 shadow-sm placeholder:text-slate-400 focus:ring-2 focus:ring-[#1875E5] focus:outline-none transition-all resize-none text-[#0B1C3B]"
             placeholder="Adicionar observações?"
             rows={3}
             value={comentario}
             onChange={(e) => setComentario(e.target.value)}
           />
        </div>

        <button
          onClick={fazerPedido}
          disabled={enviando}
          className="w-full flex justify-center items-center bg-[#1875E5] hover:bg-[#0B1C3B] text-white rounded-[24px] py-4 text-xl font-bold shadow-lg transition disabled:opacity-50"
        >
          {enviando ? "Processando Segurança..." : <><SendIcon /> Concluir Pedido</>}
        </button>
      </main>
    </div>
  );
}
