"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Produto {
  id: string;
  nome: string;
  disponivel: boolean;
}

interface ItemPedido {
  id: string;
  quantidade: number;
  produtos: Produto;
}

interface Pedido {
  id: string;
  sala: string;
  comentario_convidado: string | null;
  status: string;
  criado_em: string;
  itens_pedido?: ItemPedido[];
}
// --- Ícones SVG Minimalistas ---
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-gray-400">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-8.2l-3.32 3.32"/>
  </svg>
);

// --- Componente Principal ---
export default function RecepcaoPage() {
  const [activeTab, setActiveTab] = useState<"pedidos" | "produtos">("pedidos");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [novoProdutoNome, setNovoProdutoNome] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);

  // Busca inicial Conjunta
  useEffect(() => {
    const fetchData = async () => {
      // Pedidos
      const { data: pData } = await supabase
        .from("pedidos")
        .select("*, itens_pedido(*, produtos(*))")
        .order("criado_em", { ascending: false });
      if (pData) setPedidos(pData);

      // Produtos
      const { data: prodData } = await supabase
        .from("produtos")
        .select("*")
        .order("nome", { ascending: true });
      if (prodData) setProdutos(prodData);
    };

    fetchData();

    // Inscreve no Realtime apenas para Pedidos (Painel de Monitoramento Dinâmico)
    const channel = supabase
      .channel("realtime_pedidos")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pedidos" },
        (payload) => {
          supabase
            .from("pedidos")
            .select("*, itens_pedido(*, produtos(*))")
            .eq("id", payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setPedidos((prev) => [data, ...prev]);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- Handlers de Administração ---
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoProdutoNome.trim()) return;
    setLoadingAdd(true);
    const { data, error } = await supabase
      .from("produtos")
      .insert([{ nome: novoProdutoNome, disponivel: true }])
      .select()
      .single();

    if (error) {
      alert("Erro ao adicionar: " + error.message);
    } else if (data) {
      setProdutos((prev) => [...prev, data].sort((a,b) => a.nome.localeCompare(b.nome)));
      setNovoProdutoNome("");
    }
    setLoadingAdd(false);
  };

  const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("produtos")
      .update({ disponivel: !currentStatus })
      .eq("id", id);
    if (!error) {
      setProdutos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, disponivel: !currentStatus } : p))
      );
    }
  };

  const handleMarcarEntregue = async (id: string) => {
    const { error } = await supabase
      .from("pedidos")
      .update({ status: 'entregue' })
      .eq("id", id);
    if (!error) {
      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'entregue' } : p))
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header Corporativo Azul Genial */}
      <header className="bg-[#0B1C3B] text-white py-6 px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Recepção</h1>
          
          {/* Navegação por Abas (Tabs) */}
          <div className="flex bg-[#162D5D] rounded-full p-1 mt-6 md:mt-0 shadow-inner">
            <button
              onClick={() => setActiveTab("pedidos")}
              className={`flex items-center px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeTab === "pedidos" ? "bg-white text-[#0B1C3B] shadow-sm transform scale-105" : "text-white/70 hover:text-white"
              }`}
            >
              <BellIcon />
              Pedidos Ao Vivo
            </button>
            <button
              onClick={() => setActiveTab("produtos")}
              className={`flex items-center px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeTab === "produtos" ? "bg-white text-[#0B1C3B] shadow-sm transform scale-105" : "text-white/70 hover:text-white"
              }`}
            >
              <PackageIcon />
              Gestão de Produtos
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        
        {/* ======================================================== */}
        {/* ABA: MONITOR DE PEDIDOS */}
        {/* ======================================================== */}
        {activeTab === "pedidos" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 flex items-center justify-between">
               <h2 className="text-2xl font-bold text-[#0B1C3B]">Últimas Solicitações</h2>
               <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border">Live Update Ativo</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {pedidos.map((p) => (
                <div
                  key={p.id}
                  className="p-6 border border-slate-200 rounded-2xl shadow-sm bg-white hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold bg-[#E8EDFA] text-[#0B1C3B] px-3 py-1 rounded-lg">
                      Sala {p.sala}
                    </h2>
                    <span className="text-xs font-semibold text-slate-400">
                      {new Date(p.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {p.comentario_convidado && (
                    <div className="bg-amber-50/50 border-l-4 border-amber-400 p-3 text-sm italic rounded mb-5 text-slate-600">
                      &quot;{p.comentario_convidado}&quot;
                    </div>
                  )}

                  <div className="mb-6 space-y-2">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Itens Solicitados</h3>
                    {p.itens_pedido && p.itens_pedido.length > 0 ? (
                      <ul className="text-sm space-y-2">
                        {p.itens_pedido.map((item: ItemPedido) => (
                          <li key={item.id} className="flex items-center gap-3">
                            <span className="flex items-center justify-center bg-[#0B1C3B] text-white w-6 h-6 rounded text-xs font-bold">{item.quantidade}x</span>
                            <span className="font-medium text-slate-700">{item.produtos?.nome || "Produto Removido"}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex items-center gap-2"><RefreshIcon /><span className="text-sm text-slate-400">Construindo Itens...</span></div>
                    )}
                  </div>

                  {/* Actions / Status */}
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                        p.status === "pendente"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {p.status}
                    </span>
                    
                    {p.status === 'pendente' && (
                        <button onClick={() => handleMarcarEntregue(p.id)} className="text-sm font-semibold text-[#1875E5] hover:text-[#0B1C3B] transition">
                          Marcar Concluído
                        </button>
                    )}
                  </div>
                </div>
              ))}

              {pedidos.length === 0 && (
                <div className="col-span-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center py-20 text-slate-400">
                  <BellIcon />
                  <p className="mt-2 text-lg">Aguardando solicitações...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA: GERENCIAMENTO DE PRODUTOS */}
        {/* ======================================================== */}
        {activeTab === "produtos" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-8">
              <h2 className="text-xl font-bold text-[#0B1C3B] mb-6 flex items-center">
                <PackageIcon /> Adicionar Novo Item
              </h2>
              <form onSubmit={handleAddProduct} className="flex gap-4">
                <input
                  type="text"
                  placeholder="Ex: Coca-Cola Zero 350ml"
                  value={novoProdutoNome}
                  onChange={(e) => setNovoProdutoNome(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1875E5] focus:border-transparent transition-all"
                  required
                />
                <button
                  type="submit"
                  disabled={loadingAdd}
                  className="bg-[#1875E5] hover:bg-[#0B1C3B] text-white px-8 py-3 rounded-xl font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  <PlusIcon /> {loadingAdd ? "Salvando..." : "Cadastrar"}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-[#0B1C3B]/5 border-b border-slate-200 px-8 py-4">
                 <h2 className="text-lg font-bold text-[#0B1C3B]">Lista de Produtos das Salas</h2>
              </div>
              <ul className="divide-y divide-slate-100">
                {produtos.map((prod) => (
                  <li key={prod.id} className={`flex items-center justify-between p-6 hover:bg-slate-50 transition ${!prod.disponivel ? "opacity-60 grayscale" : ""}`}>
                    <div className="flex flex-col">
                      <span className={`font-bold text-lg ${!prod.disponivel ? "line-through text-slate-400" : "text-[#0B1C3B]"}`}>
                        {prod.nome}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                        Status: {prod.disponivel ? "Ativo nas Salas" : "Oculto"}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleToggleVisibility(prod.id, prod.disponivel)}
                      title={prod.disponivel ? "Ocultar produto das salas" : "Exibir produto nas salas"}
                      className={`p-3 rounded-full border transition flex items-center gap-2 text-sm font-semibold ${
                        prod.disponivel 
                        ? "border-[#0B1C3B]/20 text-[#0B1C3B] hover:bg-[#0B1C3B] hover:text-white" 
                        : "border-emerald-500/20 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                      }`}
                    >
                      {prod.disponivel ? <><EyeOffIcon /> Ocultar</> : <><EyeIcon /> Ativar</>}
                    </button>
                  </li>
                ))}
                
                {produtos.length === 0 && (
                   <li className="p-10 text-center text-slate-400">Nenhum produto cadastrado no banco.</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
