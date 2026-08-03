import { useEffect, useState } from 'react';
import { supabase, type Product } from '@/lib/supabase';
import { Plus, Pencil, Trash2, X, Loader2, Package } from 'lucide-react';

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', price: '', image_url: '', description: '' });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }

  function openAddForm() {
    setEditingProduct(null);
    setForm({ title: '', price: '', image_url: '', description: '' });
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setForm({
      title: product.title,
      price: String(product.price),
      image_url: product.image_url,
      description: product.description ?? '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: form.title,
      price: parseFloat(form.price),
      image_url: form.image_url,
      description: form.description || null,
    };

    if (editingProduct) {
      await supabase.from('products').update(payload).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    loadProducts();
  }

  async function handleDelete(product: Product) {
    if (!confirm(`هل أنت متأكد من حذف "${product.title}"؟`)) return;
    await supabase.from('products').delete().eq('id', product.id);
    loadProducts();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">لوحة التحكم</h2>
          <p className="text-zinc-500 text-sm">إدارة منتجات المتجر</p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-900/30 inline-flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          إضافة منتج
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-lg">لا توجد منتجات. أضف أول منتج!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <div className="relative h-44 overflow-hidden">
                <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  درهم {Number(product.price).toFixed(2)}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-bold mb-1 line-clamp-1">{product.title}</h3>
                {product.description && (
                  <p className="text-zinc-500 text-sm mb-4 line-clamp-2">{product.description}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(product)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="flex-1 bg-red-950/60 hover:bg-red-900/60 text-red-400 hover:text-red-300 font-semibold text-sm py-2.5 rounded-xl transition-colors inline-flex items-center justify-center gap-2 border border-red-900/40"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">عنوان الحساب</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: حساب Free Fire VIP"
                  className="w-full bg-black/50 border border-zinc-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">السعر (درهم)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="150.00"
                  className="w-full bg-black/50 border border-zinc-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">رابط الصورة</label>
                <input
                  type="url"
                  required
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-black/50 border border-zinc-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                />
                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt="preview"
                    className="mt-3 w-full h-32 object-cover rounded-xl border border-zinc-800"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">الوصف (اختياري)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="تفاصيل الحساب..."
                  rows={3}
                  className="w-full bg-black/50 border border-zinc-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-900/30 disabled:opacity-50"
                >
                  {saving ? 'جارٍ الحفظ...' : editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
