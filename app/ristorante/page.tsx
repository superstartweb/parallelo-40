"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { ChefHat, CheckCircle, Volume2, Clock, PowerOff, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function RistoranteDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [turnoIniziato, setTurnoIniziato] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ordiniPrecedenti = useRef<number>(0);

  useEffect(() => {
    const turnoSalvato = localStorage.getItem("turno_ristorante");
    if (turnoSalvato === "attivo") setTurnoIniziato(true);
    setIsLoaded(true);
  }, []);

  const playBeep = () => {
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.play();
    } catch (e) { console.log(e); }
  };

  const avviaTurno = () => {
    playBeep();
    setTurnoIniziato(true);
    localStorage.setItem("turno_ristorante", "attivo");
  };

  const chiudiTurno = () => {
    if(confirm("Sicuro di voler chiudere il turno?")) {
      setTurnoIniziato(false);
      localStorage.removeItem("turno_ristorante");
    }
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select(`*, order_items (*)`).in("status", ["nuovo", "in_preparazione"]).order("created_at", { ascending: true });
    if (data) {
      const nuoviOrdini = data.filter(o => o.status === "nuovo").length;
      if (nuoviOrdini > ordiniPrecedenti.current && turnoIniziato) playBeep();
      ordiniPrecedenti.current = nuoviOrdini;
      setOrders(data);
    }
  };

  useEffect(() => {
    if (turnoIniziato) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [turnoIniziato]);

  const aggiornaStato = async (orderId: string, nuovoStato: string, customerPhone?: string, orderNumber?: number) => {
    await supabase.from("orders").update({ status: nuovoStato }).eq("id", orderId);
    if (nuovoStato === "in_consegna" && customerPhone) {
      const msg = `Ciao! Il tuo ordine N°${orderNumber} è in arrivo al Parallelo40! 🏖️`;
      window.open(`https://wa.me/${customerPhone.replace(/\s+/g, '')}?text=${encodeURIComponent(msg)}`, "_blank");
    }
    fetchOrders();
  };

  if (!isLoaded) return null;

  if (!turnoIniziato) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
        <img src="https://www.piazzagaribaldi.net/wp-content/uploads/logo-piazza-garibaldi-porto-torres-300x188.png" className="h-24 mb-12" />
        <div className="bg-white p-8 rounded-[40px] text-center max-w-md w-full shadow-2xl">
          <Volume2 size={48} className="mx-auto text-[#f2aa39] mb-4" />
          <h1 className="text-2xl font-black text-gray-800 mb-2 leading-tight">Pronto per il Servizio?</h1>
          <p className="text-gray-500 mb-8 px-4">Avvia il turno per ricevere gli ordini e attivare le notifiche sonore.</p>
          <button onClick={avviaTurno} className="w-full bg-[#f2aa39] text-white font-black py-5 rounded-2xl shadow-lg active:scale-95 transition-all text-xl">
            INIZIA TURNO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-24">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border-l-4 border-[#f2aa39]">
        <div>
          <h1 className="text-xl font-black text-gray-800 tracking-tighter uppercase">Cucina Garibaldi</h1>
          <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">● Sistema Online</p>
        </div>
        <div className="flex items-center gap-2">
          {/* TASTO STATISTICHE */}
          <Link href="/manager/parallelo40" className="bg-blue-50 text-blue-600 p-3 rounded-xl hover:bg-blue-100">
            <BarChart3 size={22} />
          </Link>
          <button onClick={chiudiTurno} className="bg-red-50 text-red-600 p-3 rounded-xl hover:bg-red-100">
            <PowerOff size={22} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <div key={order.id} className={`bg-white rounded-3xl p-6 shadow-md border-t-8 ${order.status === 'nuovo' ? 'border-red-500' : 'border-[#f2aa39]'}`}>
            <div className="flex justify-between items-start mb-4 border-b pb-3">
              <div>
                <h2 className="text-3xl font-black text-gray-900">#{order.order_number}</h2>
                <p className="font-bold text-gray-500 uppercase text-xs">{order.customer_name} {order.customer_surname}</p>
              </div>
              <div className="flex items-center text-gray-400 text-xs font-bold bg-gray-50 px-2 py-1 rounded-lg">
                <Clock size={12} className="mr-1" /> {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
            <div className="space-y-2 mb-6">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between font-bold bg-gray-50 p-3 rounded-xl text-gray-800">
                  <span><span className="text-[#f2aa39] mr-2">{item.quantity}x</span> {item.product_name}</span>
                </div>
              ))}
            </div>
            <button onClick={() => aggiornaStato(order.id, order.status === "nuovo" ? "in_preparazione" : "in_consegna", order.customer_phone, order.order_number)}
              className={`w-full py-4 rounded-2xl font-black text-white shadow-lg flex justify-center items-center gap-2 transition-all ${order.status === "nuovo" ? "bg-gray-900" : "bg-green-500"}`}>
              {order.status === "nuovo" ? <><ChefHat size={20}/> PREPARA</> : <><CheckCircle size={20}/> PRONTO</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}