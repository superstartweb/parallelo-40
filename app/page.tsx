"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ShoppingCart, X, Plus, Minus } from "lucide-react";

export default function MenuCliente() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function fetchData() {
      const { data: catData } = await supabase.from("categories").select("*").order("position");
      const { data: prodData } = await supabase.from("products").select("*").eq("is_available", true);
      
      if (catData) setCategories(catData);
      if (prodData) setProducts(prodData);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const addToCart = (product: any) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    const existing = cart.find((item) => item.id === productId);
    if (existing.quantity === 1) {
      setCart(cart.filter((item) => item.id !== productId));
    } else {
      setCart(cart.map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item)));
    }
  };

  const totalCart = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const inviaOrdine = async () => {
    if (!nome || !cognome || !telefono) {
      alert("Per favore, compila Nome, Cognome e un Numero di Telefono!");
      return;
    }
    setIsLoading(true);
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([{ customer_name: nome, customer_surname: cognome, customer_phone: telefono, customer_email: email, total_price: totalCart }])
      .select().single();

    if (orderError) {
      alert("Errore durante l'invio. Riprova!");
      setIsLoading(false); return;
    }

    const orderItems = cart.map((item) => ({
      order_id: orderData.id, product_id: item.id, product_name: item.name, quantity: item.quantity, price_at_time: item.price,
    }));

    await supabase.from("order_items").insert(orderItems);
    setCart([]); setIsCartOpen(false); setNome(""); setCognome(""); setTelefono(""); setEmail(""); setIsLoading(false);
    alert(`🎉 Ordine n°${orderData.order_number} inviato con successo!\nRiceverai un messaggio WhatsApp appena è pronto.`);
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center font-bold text-[#00c0f4] animate-pulse">Caricamento Menù...</div>;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative pb-28 shadow-2xl">
      <div className="bg-white sticky top-0 z-10 shadow-sm px-4 py-4 flex justify-center items-center rounded-b-2xl">
        <img src="https://www.superstart.it/wp-content/uploads/2026/04/ParalleloQuaranta_nero.png" alt="Parallelo40" className="h-12 object-contain" />
      </div>

      <div className="px-4 py-6 space-y-8">
        {categories.map((category) => {
          const categoryProducts = products.filter((p) => p.category_id === category.id);
          if (categoryProducts.length === 0) return null;
          return (
            <div key={category.id} className="scroll-mt-20">
              <h2 className="text-2xl font-black text-gray-800 mb-4 border-b-2 border-[#00c0f4] pb-1 inline-block">{category.name}</h2>
              <div className="space-y-4">
                {categoryProducts.map((product) => {
                  const cartItem = cart.find((i) => i.id === product.id);
                  return (
                    <div key={product.id} className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center shadow-sm border border-gray-100">
                      <div className="flex-1 pr-4">
                        <h3 className="font-bold text-gray-900 leading-tight mb-1">{product.name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                        <p className="font-black text-[#f2aa39] mt-2">€{product.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-white rounded-full shadow-sm p-1 border border-gray-100">
                        {cartItem ? (
                          <>
                            <button onClick={() => removeFromCart(product.id)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 active:bg-gray-200"><Minus size={16} /></button>
                            <span className="font-bold w-4 text-center">{cartItem.quantity}</span>
                            <button onClick={() => addToCart(product)} className="w-8 h-8 flex items-center justify-center bg-[#00c0f4] text-white rounded-full active:bg-blue-500"><Plus size={16} /></button>
                          </>
                        ) : (
                          <button onClick={() => addToCart(product)} className="w-10 h-10 flex items-center justify-center bg-[#00c0f4] text-white rounded-full shadow-md active:scale-95 transition-transform"><Plus size={20} /></button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* NUOVO BOTTONE CARRELLO: AZZURRO E BEN VISIBILE */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-40 max-w-md mx-auto">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#00c0f4] border-2 border-white text-gray-900 rounded-full p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,192,244,0.4)] active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="bg-gray-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-black">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </div>
              <span className="font-black tracking-wide text-lg">COMPLETA ORDINE</span>
            </div>
            <span className="font-black text-xl">€{totalCart.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Modale Check-out */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom">
            <div className="p-4 bg-gray-50 flex justify-between items-center border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900">Il tuo Ordine</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-200 rounded-full text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                  <div><span className="font-bold text-gray-800">{item.quantity}x</span> {item.name}</div>
                  <div className="font-bold text-gray-900">€{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
              <div className="flex justify-between items-center text-lg mt-4 pt-4 border-t-2 border-gray-100">
                <span className="font-bold">Totale:</span>
                <span className="font-black text-[#f2aa39] text-2xl">€{totalCart.toFixed(2)}</span>
              </div>
              <div className="mt-6 space-y-4 bg-gray-50 p-4 rounded-2xl">
                <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider">I tuoi dati</h3>
                <input type="text" placeholder="Nome *" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#00c0f4] focus:ring-2 focus:ring-[#00c0f4]/20" />
                <input type="text" placeholder="Cognome *" value={cognome} onChange={(e) => setCognome(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#00c0f4] focus:ring-2 focus:ring-[#00c0f4]/20" />
                <input type="tel" placeholder="Cellulare (WhatsApp) *" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#00c0f4] focus:ring-2 focus:ring-[#00c0f4]/20" />
                <input type="email" placeholder="Email (Facoltativa)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#00c0f4] focus:ring-2 focus:ring-[#00c0f4]/20" />
              </div>
            </div>
            <div className="p-4 bg-white border-t border-gray-100">
              <button onClick={inviaOrdine} disabled={!nome || !cognome || !telefono}
                className={`w-full py-4 rounded-xl font-black text-lg text-white shadow-lg flex justify-center items-center gap-2 transition-all duration-300
                  ${(!nome || !cognome || !telefono) ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 active:scale-95'}`}>
                <ShoppingCart size={24} /> CONFERMA ORDINE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}