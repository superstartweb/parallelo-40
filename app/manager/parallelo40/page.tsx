"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Banknote, Utensils, Download, ChevronLeft, ListOrdered, BarChart3 } from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SuperManagerPanel() {
  const [activeTab, setActiveTab] = useState("ordini"); // "ordini" o "stats"
  const [history, setHistory] = useState<any[]>([]);
  const [itemStats, setItemStats] = useState<any[]>([]);
  const [totals, setTotals] = useState({ euro: 0, piatti: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const oggi = new Date().toISOString().split('T')[0];
    const { data: orders } = await supabase
      .from("orders")
      .select(`*, order_items(*)`)
      .eq("status", "pagato")
      .gte("created_at", oggi)
      .order("created_at", { ascending: false });

    if (orders) {
      const euro = orders.reduce((acc, o) => acc + o.total_price, 0);
      let pCount = 0;
      const counts: any = {};

      orders.forEach((o) => {
        o.order_items.forEach((item: any) => {
          pCount += item.quantity;
          counts[item.product_name] = (counts[item.product_name] || 0) + item.quantity;
        });
      });

      const sorted = Object.keys(counts).map(name => ({ name, qty: counts[name] })).sort((a,b) => b.qty - a.qty);
      setHistory(orders);
      setItemStats(sorted);
      setTotals({ euro, piatti: pCount });
    }
  };

  const generaPDF = () => {
    const doc = new jsPDF();
    const oggi = new Date().toLocaleDateString('it-IT');

    // Titolo e Info
    doc.setFontSize(22);
    doc.text("REPORT GIORNALIERO PARALLELO40", 14, 20);
    doc.setFontSize(12);
    doc.text(`Data: ${oggi}`, 14, 30);
    doc.text(`Incasso Totale: EUR ${totals.euro.toFixed(2)}`, 14, 38);
    doc.text(`Piatti Totali: ${totals.piatti}`, 14, 46);

    // Tabella Ordini
    doc.text("DETTAGLIO ORDINI E INCASSI", 14, 60);
    autoTable(doc, {
      startY: 65,
      head: [['Ora', 'Cliente', 'Importo']],
      body: history.map(o => [
        new Date(o.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        `${o.customer_name} ${o.customer_surname}`,
        `€ ${o.total_price.toFixed(2)}`
      ]),
    });

    // Tabella Piatti
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.text("CLASSIFICA PIATTI VENDUTI", 14, finalY);
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Pos.', 'Piatto', 'Quantità']],
      body: itemStats.map((item, i) => [i + 1, item.name, `${item.qty} pezzi`]),
      theme: 'grid',
      headStyles: { fillColor: [0, 192, 244] }
    });

    doc.save(`Report_${oggi.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigazione e Download */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/start" className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-black">
            <ChevronLeft size={24} />
          </Link>
          <button 
            onClick={generaPDF}
            className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Download size={20} /> SCARICA PDF
          </button>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-2">Manager Dashboard</h1>
        <p className="text-gray-400 font-bold mb-8 uppercase tracking-widest text-xs">
            Ristorante & Chiosco Unificati
        </p>

        {/* STATS RAPIDE */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-900 p-6 rounded-[32px] text-white">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Incasso Totale</p>
            <p className="text-3xl font-black text-[#00c0f4]">€ {totals.euro.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Piatti Preparati</p>
            <p className="text-3xl font-black text-gray-900">{totals.piatti}</p>
          </div>
        </div>

        {/* SCHEDE (TABS) */}
        <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
          <button 
            onClick={() => setActiveTab("ordini")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black transition-all ${activeTab === "ordini" ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
          >
            <ListOrdered size={18} /> ORDINI
          </button>
          <button 
            onClick={() => setActiveTab("stats")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black transition-all ${activeTab === "stats" ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
          >
            <BarChart3 size={18} /> STATISTICHE
          </button>
        </div>

        {/* CONTENUTO SCHEDA ORDINI */}
        {activeTab === "ordini" && (
          <div className="space-y-4">
            {history.length === 0 && <p className="text-center py-20 text-gray-300 font-bold italic">Nessun ordine completato oggi.</p>}
            {history.map((order) => (
              <div key={order.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center group">
                <div>
                  <p className="text-xs font-black text-[#00c0f4] mb-1">ORDINE #{order.order_number}</p>
                  <p className="font-black text-gray-900 text-lg uppercase">{order.customer_name} {order.customer_surname}</p>
                  <p className="text-xs text-gray-400 font-bold tracking-tighter">
                    {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • 📞 {order.customer_phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-gray-900">€{order.total_price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTENUTO SCHEDA STATISTICHE */}
        {activeTab === "stats" && (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-6">
            {itemStats.length === 0 && <p className="text-center py-10 text-gray-300">Nessun dato disponibile.</p>}
            {itemStats.map((item, index) => (
              <div key={item.name}>
                <div className="flex justify-between items-end mb-2">
                  <p className="font-black text-gray-800 uppercase text-sm">
                    <span className="text-gray-300 mr-2">#{index + 1}</span>
                    {item.name}
                  </p>
                  <p className="font-black text-[#f2aa39]">{item.qty} <small className="text-gray-400">pz</small></p>
                </div>
                {/* Barra grafica */}
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#f2aa39] h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${(item.qty / totals.piatti) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      
      {/* Footer minimalista nel pannello manager */}
      <p className="text-center mt-20 text-[10px] font-black text-gray-200 tracking-[10px] uppercase">
        SuPeR Terminal
      </p>
    </div>
  );
}