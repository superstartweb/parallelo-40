"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { ChefHat, CheckCircle, Volume2, Clock, PowerOff } from "lucide-react";

export default function RistoranteDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [turnoIniziato, setTurnoIniziato] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // Serve per evitare problemi di caricamento
  
  const ordiniPrecedenti = useRef<number>(0);

  // Al primo caricamento, controlla se c'era un turno salvato in memoria
  useEffect(() => {
    const turnoSalvato = localStorage.getItem("turno_ristorante");
    if (turnoSalvato === "attivo") {
      setTurnoIniziato(true);
    }
    setIsLoaded(true);
  }, []);

  const playBeep = () => {
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.play();
    } catch (e) {
      console.log("Audio non riprodotto", e);
    }
  };

  const avviaTurno = () => {
    playBeep();
    setTurnoIniziato(true);
    localStorage.setItem("turno_ristorante", "attivo"); // Salva nella memoria del browser!
  };

  const chiudiTurno = () => {
    if(confirm("Sicuro di voler chiudere il turno? Non riceverai più notifiche sonore.")) {
      setTurnoIniziato(false);
      localStorage.removeItem("turno_ristorante"); // Cancella dalla memoria
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .in("status", ["nuovo", "in_preparazione"])
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Errore recupero ordini", error);
      return;
    }

    if (data) {
      const nuoviOrdini = data.filter(o => o.status === "nuovo").length;
      if (nuoviOrdini > ordiniPrecedenti.current && turnoIniziato) {
        playBeep();
      }
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
    
    // Se è in consegna e ha il telefono, apriamo la chat Whatsapp con il numero esatto!
    if (nuovoStato === "in_consegna" && customerPhone) {
      // Puliamo il numero (togliamo spazi) per sicurezza
      const numeroPulito = customerPhone.replace(/\s+/g, '');
      const messaggio = `Ciao! Il tuo ordine N°${orderNumber} è in arrivo al Parallelo40! 🏖️ Preparati a gustarlo!`;
      const waUrl = `https://wa.me/${numeroPulito}?text=${encodeURIComponent(messaggio)}`;
      
      window.open(waUrl, "_blank");
    } else if (nuovoStato === "in_consegna") {
      // Se per qualche assurdo motivo non c'è il numero, apre WA generico
      const messaggio = `Ciao! L'ordine N°${orderNumber} è in arrivo al Parallelo40!`;
      window.open(`https://wa.me/?text=${encodeURIComponent(messaggio)}`, "_blank");
    }

    fetchOrders();
  };

  // Finché non carica la memoria, non mostrare nulla (evita sfarfallii)
  if (!isLoaded) return null;

  if (!turnoIniziato) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <img src="https://www.piazzagaribaldi.net/wp-content/uploads/logo-piazza-garibaldi-porto-torres-300x188.png" alt="Piazza Garibaldi" className="h-24 mb-12 object-contain" />
        <div className="bg-white p-8 rounded-3xl text-center max-w-md w-full shadow-2xl">
          <Volume2 size={48} className="mx-auto text-ristorante mb-4" />
          <h1 className="text-2xl font-black text-gray-800 mb-2">Pronto per il Servizio?</h1>
          <p className="text-gray-500 mb-8">Avvia il turno per ricevere gli ordini e attivare le notifiche sonore.</p>
          <button 
            onClick={avviaTurno}
            className="w-full bg-ristorante text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            INIZIA TURNO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans pb-24">
      {/* Header Ristorante con Tasto Spegni */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border-l-4 border-ristorante">
        <div>
          <h1 className="text-xl font-black text-gray-800">Ordini Parallelo40</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Sistema Attivo
          </p>
        </div>
        <div className="flex items-center gap-4">
          <img src="https://www.piazzagaribaldi.net/wp-content/uploads/logo-piazza-garibaldi-porto-torres-300x188.png" alt="Piazza Garibaldi" className="h-10 object-contain hidden sm:block" />
          {/* Tasto Chiudi Turno */}
          <button 
            onClick={chiudiTurno}
            className="bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 transition-colors"
            title="Chiudi Turno"
          >
            <PowerOff size={20} />
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center mt-20 text-gray-400">
          <ChefHat size={64} className="mx-auto mb-4 opacity-50" />
          <p className="font-bold text-xl">Nessun ordine in coda</p>
          <p>La cucina è tranquilla...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className={`bg-white rounded-2xl p-5 shadow-md border-t-4 transition-all
                ${order.status === 'nuovo' ? 'border-red-500 shadow-red-100' : 'border-blue-500 shadow-blue-100'}`}
            >
              <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                    ${order.status === 'nuovo' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {order.status === 'nuovo' ? 'DA PREPARARE' : 'IN COTTURA'}
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 mt-2">Ordine #{order.order_number}</h2>
                  <p className="text-sm text-gray-500">{order.customer_name} {order.customer_surname}</p>
                  <p className="text-xs text-gray-400 mt-1">📞 {order.customer_phone}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-gray-400 text-sm gap-1">
                    <Clock size={14} />
                    {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-gray-800 font-medium bg-gray-50 p-2 rounded-lg">
                    <span><strong className="text-ristorante">{item.quantity}x</strong> {item.product_name}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                {order.status === "nuovo" ? (
                  <button 
                    onClick={() => aggiornaStato(order.id, "in_preparazione")}
                    className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-transform"
                  >
                    <ChefHat size={20} /> METTI IN PREPARAZIONE
                  </button>
                ) : (
                  <button 
                    onClick={() => aggiornaStato(order.id, "in_consegna", order.customer_phone, order.order_number)}
                    className="w-full bg-green-500 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-green-200"
                  >
                    <CheckCircle size={20} /> PRONTO! IN CONSEGNA
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