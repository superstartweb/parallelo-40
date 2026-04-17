"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Plus, Trash2, Edit2, Save, X, ArrowUp, ArrowDown, LayoutGrid, Check } from "lucide-react";

export default function SuperAdminMenu() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  
  // Stato per il prodotto (sia nuovo che in modifica)
  const [prodForm, setProdForm] = useState({ id: "", name: "", description: "", price: "", category_id: "" });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    const { data: catData } = await supabase.from("categories").select("*").order("position");
    // Ora ordiniamo i prodotti per posizione!
    const { data: prodData } = await supabase.from("products").select("*").order("position", { ascending: true });
    if (catData) setCategories(catData);
    if (prodData) setProducts(prodData);
  };

  // --- GESTIONE CATEGORIE ---
  const addCategory = async () => {
    if (!newCatName) return;
    const nextPos = categories.length + 1;
    await supabase.from("categories").insert([{ name: newCatName, position: nextPos }]);
    setNewCatName(""); setIsAddingCat(false); fetchMenuData();
  };

  const deleteCategory = async (id: string) => {
    if (confirm("Attenzione! Cancellando la categoria cancellerai tutti i piatti contenuti. Procedo?")) {
      await supabase.from("categories").delete().eq("id", id);
      fetchMenuData();
    }
  };

  const moveCategory = async (index: number, direction: "up" | "down") => {
    const newCategories = [...categories];
    const item = newCategories[index];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCategories.length) return;
    const targetItem = newCategories[targetIndex];
    await supabase.from("categories").update({ position: targetItem.position }).eq("id", item.id);
    await supabase.from("categories").update({ position: item.position }).eq("id", targetItem.id);
    fetchMenuData();
  };

  // --- GESTIONE PRODOTTI ---
  const saveProduct = async () => {
    if (!prodForm.name || !prodForm.price || !prodForm.category_id) return;

    if (isEditing) {
      // MODIFICA
      await supabase.from("products").update({
        name: prodForm.name,
        description: prodForm.description,
        price: parseFloat(prodForm.price),
        category_id: prodForm.category_id
      }).eq("id", prodForm.id);
    } else {
      // NUOVO
      const nextPos = products.filter(p => p.category_id === prodForm.category_id).length + 1;
      await supabase.from("products").insert([{
        name: prodForm.name,
        description: prodForm.description,
        price: parseFloat(prodForm.price),
        category_id: prodForm.category_id,
        position: nextPos
      }]);
    }

    setProdForm({ id: "", name: "", description: "", price: "", category_id: "" });
    setIsEditing(false);
    fetchMenuData();
  };

  const startEdit = (prod: any) => {
    setProdForm({ 
      id: prod.id, 
      name: prod.name, 
      description: prod.description || "", 
      price: prod.price.toString(), 
      category_id: prod.category_id 
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = async (id: string) => {
    if (confirm("Vuoi eliminare questo piatto?")) {
      await supabase.from("products").delete().eq("id", id);
      fetchMenuData();
    }
  };

  const moveProduct = async (prodId: string, currentPos: number, direction: "up" | "down", catId: string) => {
    const catProducts = products.filter(p => p.category_id === catId).sort((a,b) => a.position - b.position);
    const index = catProducts.findIndex(p => p.id === prodId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= catProducts.length) return;

    const item = catProducts[index];
    const targetItem = catProducts[targetIndex];

    await supabase.from("products").update({ position: targetItem.position }).eq("id", item.id);
    await supabase.from("products").update({ position: item.position }).eq("id", targetItem.id);
    fetchMenuData();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
            <LayoutGrid className="text-[#00c0f4]" /> SuPeR Admin
          </h1>
          <button onClick={() => setIsAddingCat(true)} className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
            <Plus size={18} /> NUOVA SEZIONE
          </button>
        </div>

        {/* MODALE CATEGORIA */}
        {isAddingCat && (
          <div className="bg-white p-6 rounded-2xl shadow-xl mb-8 border-2 border-[#00c0f4]">
            <h2 className="font-black text-lg mb-4">Aggiungi Nuova Sezione</h2>
            <div className="flex gap-4">
              <input type="text" placeholder="Nome Sezione..." className="flex-1 p-3 border rounded-xl" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
              <button onClick={addCategory} className="bg-green-500 text-white px-6 rounded-xl font-bold text-sm">SALVA</button>
              <button onClick={() => setIsAddingCat(false)} className="bg-gray-200 text-gray-600 px-4 rounded-xl font-bold"><X /></button>
            </div>
          </div>
        )}

        {/* FORM PRODOTTO (MODIFICA O AGGIUNGI) */}
        <div className={`p-6 rounded-2xl shadow-md mb-8 transition-all duration-500 ${isEditing ? 'bg-orange-50 border-2 border-orange-400' : 'bg-white'}`}>
          <h2 className="font-black text-lg mb-4 flex items-center gap-2">
            {isEditing ? <><Edit2 className="text-orange-500"/> MODIFICA PIATTO</> : <><Plus className="text-[#00c0f4]"/> AGGIUNGI NUOVO PIATTO</>}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Nome Piatto" className="p-3 border rounded-xl" value={prodForm.name} onChange={(e) => setProdForm({...prodForm, name: e.target.value})} />
            <input type="number" placeholder="Prezzo (€)" className="p-3 border rounded-xl" value={prodForm.price} onChange={(e) => setProdForm({...prodForm, price: e.target.value})} />
            <textarea placeholder="Descrizione / Ingredienti" className="p-3 border rounded-xl md:col-span-2" value={prodForm.description} onChange={(e) => setProdForm({...prodForm, description: e.target.value})} />
            <select className="p-3 border rounded-xl bg-white" value={prodForm.category_id} onChange={(e) => setProdForm({...prodForm, category_id: e.target.value})}>
              <option value="">Seleziona Categoria...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2">
               <button onClick={saveProduct} className={`flex-1 font-black py-3 rounded-xl text-white ${isEditing ? 'bg-orange-500' : 'bg-[#00c0f4]'}`}>
                {isEditing ? "AGGIORNA PIATTO" : "PUBBLICA PIATTO"}
              </button>
              {isEditing && (
                <button onClick={() => {setIsEditing(false); setProdForm({id:"", name:"", description:"", price:"", category_id:""})}} className="bg-gray-200 text-gray-600 px-4 rounded-xl font-bold">ANNULLA</button>
              )}
            </div>
          </div>
        </div>

        {/* LISTA MENU */}
        <div className="space-y-6">
          {categories.map((cat, index) => (
            <div key={cat.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200">
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveCategory(index, "up")} className="text-gray-400 hover:text-[#00c0f4]"><ArrowUp size={14}/></button>
                    <button onClick={() => moveCategory(index, "down")} className="text-gray-400 hover:text-[#00c0f4]"><ArrowDown size={14}/></button>
                  </div>
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">{cat.name}</h3>
                </div>
                <button onClick={() => deleteCategory(cat.id)} className="text-red-300 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
              
              <div className="p-2">
                {products.filter(p => p.category_id === cat.id).sort((a,b) => a.position - b.position).map((prod, pIndex) => (
                  <div key={prod.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-2xl group transition-all">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveProduct(prod.id, prod.position, "up", cat.id)} className="text-gray-300 hover:text-[#f2aa39]"><ArrowUp size={12}/></button>
                        <button onClick={() => moveProduct(prod.id, prod.position, "down", cat.id)} className="text-gray-300 hover:text-[#f2aa39]"><ArrowDown size={12}/></button>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{prod.name} <span className="text-[#f2aa39] ml-2">€{prod.price.toFixed(2)}</span></p>
                        <p className="text-xs text-gray-400 line-clamp-1">{prod.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(prod)} className="p-2 text-blue-400 hover:bg-blue-50 rounded-full"><Edit2 size={16} /></button>
                      <button onClick={() => deleteProduct(prod.id)} className="p-2 text-red-300 hover:bg-red-50 rounded-full"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}