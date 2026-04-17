"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Sun, CheckCircle, Volume2, Clock, PowerOff, Banknote, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function Parallelo40Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [turnoIniziato, setTurnoIniziato] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ordiniPrecedenti = useRef<number>(0);

  useEffect(() => {
    const turnoSalvato = localStorage.getItem("turno_parallelo");
    if (turnoSalvato === "attivo") setTurnoIniziato(true);
    setIsLoaded(true);
  }, []);

  const playBeep = () => {
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
      audio.play();
    } catch (e) { console.log(e); }
  };

  const avviaTurno = () => {
    playBeep();
    setTurnoIniziato(true);
    localStorage.setItem("turno_parallelo", "attivo");
  };

  const chiudiTurno = () => {
    if(confirm("Chiudere il turno del Banco?")) {
      setTurnoIniziato(false);
      localStorage.removeItem("turno_parallelo");
    }
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select(`*, order_items (*)`).in("status", ["in_consegna", "consegnato_chiosco"]).order("created_at", { ascending: true });
    if (data) {
      const ordiniInArrivo = data.filter(o => o.status === "in_consegna").length;
      if (ordiniInArrivo > ordiniPrecedenti.current && turnoIniziato) playBeep();
      ordiniPrecedenti.current = ordiniInArrivo;
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

  const aggiornaStato = async (orderId: string, nuovoStato: string, phone?: string, num?: number, name?: string) => {
    await supabase.from("orders").update({ status: nuovoStato }).eq("id", orderId);
    if (nuovoStato === "consegnato_chiosco" && phone) {
      const msg = `Ciao ${name}! Il tuo ordine N°${num} è pronto al Banco Parallelo40! 🍹`;
      window.open(`https://wa.me/${phone.replace(/\s+/g, '')}?text=${encodeURIComponent(msg)}`, "_blank");
    }
    fetchOrders();
  };

  if (!isLoaded) return null;

  if (!turnoIniziato) {
    return (
      <div className="min-h-screen bg-[#00c0f4] flex flex-col items-center justify-center p-4">
        <img src="https://www.superstart.it/wp-content/uploads/2026/04/ParalleloQuaranta_nero.png" className="h-16 mb-12 invert brightness-0" />
        <div className="bg-white p-8 rounded-[40px] text-center max-w-md w-full shadow-2xl">
          <Sun size={48} className="mx-auto text-[#00c0f4] mb-4" />
          <h1 className="text-2xl font-black text-gray-800 mb-2">Point Parallelo40</h1>
          <p className="text-gray-500 mb-8 px-4">Avvia il turno per monitorare gli arrivi dalla cucina.</p>
          <button onClick={avviaTurno} className="w-full bg-[#00c0f4] text-white font-black py-5 rounded-2xl shadow-lg active:scale-95 transition-all text-xl">
            AVVIA RADAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border-l-4 border-[#00c0f4]">
        <div>
          <h1 className="text-xl font-black text-gray-800 tracking-tighter uppercase">Banco Parallelo</h1>
          <p className="text-[10px] text-[#00c0f4] font-bold uppercase tracking-widest">● Radar Attivo</p>
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
          <div key={order.id} className={`bg-white rounded-3xl p-6 shadow-md border-t-8 ${order.status === 'in_consegna' ? 'border-orange-400' : 'border-green-500'}`}>
            <div className="flex justify-between items-start mb-4 border-b pb-3">
              <div>
                <h2 className="text-3xl font-black text-gray-900">#{order.order_number}</h2>
                <p className="font-bold text-gray-700 uppercase text-xs">{order.customer_name} {order.customer_surname}</p>
              </div>
              <div className="text-right">
                 <p className="font-black text-xl text-gray-900">€{order.total_price.toFixed(2)}</p>
                 <div className="flex items-center text-gray-400 text-[10px] font-bold">
                    <Clock size={10} className="mr-1" /> {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </div>
              </div>
            </div>
            <div className="space-y-1 mb-6">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm font-medium bg-gray-50 p-2 rounded-lg">
                  <span>{item.quantity}x {item.product_name}</span>
                </div>
              ))}
            </div>
            <button onClick={() => aggiornaStato(order.id, order.status === "in_consegna" ? "consegnato_chiosco" : "pagato", order.customer_phone, order.order_number, order.customer_name)}
              className={`w-full py-4 rounded-2xl font-black shadow-lg flex justify-center items-center gap-2 transition-all ${order.status === "in_consegna" ? "bg-[#00c0f4] text-white" : "bg-gray-900 text-white"}`}>
              {order.status === "in_consegna" ? <><CheckCircle size={20}/> ARRIVATO</> : <><Banknote size={20}/> PAGATO</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}