"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Sun, CheckCircle, Volume2, Clock, PowerOff, Banknote } from "lucide-react";

export default function Parallelo40Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [turnoIniziato, setTurnoIniziato] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const ordiniPrecedenti = useRef<number>(0);

  useEffect(() => {
    const turnoSalvato = localStorage.getItem("turno_parallelo");
    if (turnoSalvato === "attivo") {
      setTurnoIniziato(true);
    }
    setIsLoaded(true);
  }, []);

  const playBeep = () => {
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
      audio.play();
    } catch (e) {
      console.log("Audio non riprodotto", e);
    }
  };

  const avviaTurno = () => {
    playBeep();
    setTurnoIniziato(true);
    localStorage.setItem("turno_parallelo", "attivo");
  };

  const chiudiTurno = () => {
    if(confirm("Sicuro di voler chiudere il turno? Non riceverai più notifiche.")) {
      setTurnoIniziato(false);
      localStorage.removeItem("turno_parallelo");
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`*, order_items (*)`)
      .in("status", ["in_consegna", "consegnato_chiosco"])
      .order("created_at", { ascending: true });

    if (error) return;

    if (data) {
      const ordiniInArrivo = data.filter(o => o.status === "in_consegna").length;
      if (ordiniInArrivo > ordiniPrecedenti.current && turnoIniziato) {
        playBeep();
      }
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

  const aggiornaStato = async (orderId: string, nuovoStato: string, customerPhone?: string, orderNumber?: number, customerName?: string) => {
    await supabase.from("orders").update({ status: nuovoStato }).eq("id", orderId);
    
    if (nuovoStato === "consegnato_chiosco" && customerPhone) {
      const numeroPulito = customerPhone.replace(/\s+/g, '');
      const messaggio = `Ciao ${customerName}! Il tuo ordine N°${orderNumber} è pronto al banco del Parallelo40! 🍹 Vieni a ritirarlo!`;
      window.open(`https://wa.me/${numeroPulito}?text=${encodeURIComponent(messaggio)}`, "_blank");
    }
    fetchOrders();
  };

  if (!isLoaded) return null;

  if (!turnoIniziato) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <img src="https://www.superstart.it/wp-content/uploads/2026/04/ParalleloQuaranta_nero.png" alt="Parallelo40" className="h-16 mb-12 object-contain invert brightness-0" />
        <div className="bg-white p-8 rounded-3xl text-center max-w-md w-full shadow-2xl">
          <Sun size={48} className="mx-auto text-[#00c0f4] mb-4" />
          <h1 className="text-2xl font-black text-gray-800 mb-2">Pannello Parallelo40</h1>
          <p className="text-gray-500 mb-8">Avvia il turno per ricevere gli avvisi dalla cucina.</p>
          <button onClick={avviaTurno} className="w-full bg-[#00c0f4] text-gray-900 font-black py-4 rounded-xl shadow-lg active:scale-95 transition-transform">
            INIZIA TURNO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans pb-24">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border-l-4 border-[#00c0f4]">
        <div>
          <h1 className="text-xl font-black text-gray-800">Parallelo40 Point</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00c0f4] animate-pulse"></span> Radar Attivo
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={chiudiTurno} className="bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 transition-colors" title="Chiudi Turno">
            <PowerOff size={20} />
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center mt-20 text-gray-400">
          <Sun size={64} className="mx-auto mb-4 opacity-50 text-[#00c0f4]" />
          <p className="font-bold text-xl">Nessun ordine in arrivo</p>
          <p>Goditi il sole! ☀️</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div key={order.id} className={`bg-white rounded-2xl p-5 shadow-md border-t-4 transition-all ${order.status === 'in_consegna' ? 'border-orange-400 shadow-orange-100' : 'border-green-500 shadow-green-100'}`}>
              <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${order.status === 'in_consegna' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                    {order.status === 'in_consegna' ? 'IN ARRIVO DA CUCINA' : 'DA INCASSARE'}
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 mt-2">Ordine #{order.order_number}</h2>
                  <p className="text-sm font-bold text-gray-700">{order.customer_name} {order.customer_surname}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div className="flex items-center text-gray-400 text-sm gap-1">
                    <Clock size={14} />
                    {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="font-black text-xl text-gray-800">€{order.total_price.toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-gray-800 text-sm bg-gray-50 p-2 rounded-lg">
                    <span><strong className="text-[#00c0f4]">{item.quantity}x</strong> {item.product_name}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                {order.status === "in_consegna" ? (
                  // IL BOTTONE PROBLEMATICO ORA E' UN AZZURRO FORTE CON TESTO SCURO!
                  <button 
                    onClick={() => aggiornaStato(order.id, "consegnato_chiosco", order.customer_phone, order.order_number, order.customer_name)}
                    className="w-full bg-[#00c0f4] text-gray-900 font-black py-4 rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-transform shadow-[0_4px_15px_rgba(0,192,244,0.4)]"
                  >
                    <CheckCircle size={22} /> AVVISA CLIENTE ORA
                  </button>
                ) : (
                  <button 
                    onClick={() => aggiornaStato(order.id, "pagato")}
                    className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-transform shadow-lg"
                  >
                    <Banknote size={20} /> CONFERMA PAGAMENTO
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}