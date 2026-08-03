import { useEffect, useState } from 'react';
import { supabase, type Product } from '@/lib/supabase';
import { ShoppingBag, Tag, Loader2, Maximize2, X } from 'lucide-react';

type Props = {
  onBuy: (product: Product) => void;
};

export default function ProductsPage({ onBuy }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <p className="text-zinc-500 text-lg">لا توجد منتجات حالياً</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">المنتجات المتاحة</h2>
        <p className="text-zinc-500 text-sm">اختر حسابك المفضل واضغط على "شراء الآن" للتواصل مع البائع</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="group bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl overflow-hidden hover:border-red-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-900/20 hover:-translate-y-1"
          >
            {/* Image */}
            <div className="relative h-52 overflow-hidden">
              <img
                src={product.image_url}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                درهم {Number(product.price).toFixed(2)}
              </div>
              <button
                onClick={() => setZoomImage(product.image_url)}
                className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white p-2 rounded-xl hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 duration-300"
                title="عرض الصورة بالكامل"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">{product.title}</h3>
              {product.description && (
                <p className="text-zinc-400 text-sm mb-4 line-clamp-2 leading-relaxed">{product.description}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                  <Tag className="w-4 h-4" />
                  <span>حساب رقمي</span>
                </div>
                <button
                  onClick={() => onBuy(product)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-900/30 hover:shadow-red-700/40 active:scale-95"
                >
                  شراء الآن
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full-screen image viewer */}
      {zoomImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <button
            onClick={() => setZoomImage(null)}
            className="absolute top-4 left-4 text-white p-2 rounded-xl bg-zinc-900/80 hover:bg-red-600 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={zoomImage}
            alt="عرض كامل"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
