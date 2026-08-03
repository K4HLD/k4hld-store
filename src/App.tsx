import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { supabase, isAdmin, type Product } from '@/lib/supabase';
import { Flame, LogOut, Shield, Store, MessageCircle, Menu, X } from 'lucide-react';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ProductsPage from '@/pages/ProductsPage';
import AdminPage from '@/pages/AdminPage';
import AdminChatPage from '@/pages/AdminChatPage';
import ChatModal from '@/components/ChatModal';

type Route = 'login' | 'signup' | 'forgot' | 'products' | 'admin' | 'admin-chat';
type Page = 'products' | 'admin' | 'admin-chat';

function AppContent() {
  const { user, loading } = useAuth();
  const [authPage, setAuthPage] = useState<'login' | 'signup' | 'forgot'>('login');
  const [page, setPage] = useState<Page>('products');
  const [chatProduct, setChatProduct] = useState<Product | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Flame className="w-12 h-12 text-red-600 animate-pulse" />
      </div>
    );
  }

  // Not logged in - show auth pages
  if (!user) {
    if (authPage === 'login') {
      return <LoginPage onSwitchToSignup={() => setAuthPage('signup')} onSwitchToForgot={() => setAuthPage('forgot')} />;
    }
    if (authPage === 'signup') {
      return <SignupPage onSwitchToLogin={() => setAuthPage('login')} />;
    }
    return <ForgotPasswordPage onSwitchToLogin={() => setAuthPage('login')} />;
  }

  const admin = isAdmin(user.email);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-zinc-950 to-red-950/20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button onClick={() => setPage('products')} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/40">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight hidden sm:block">K4HLD STORE</span>
            </button>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setPage('products')}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                  page === 'products'
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Store className="w-4 h-4" />
                المتجر
              </button>

              {admin && (
                <>
                  <button
                    onClick={() => setPage('admin')}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                      page === 'admin'
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    لوحة التحكم
                  </button>
                  <button
                    onClick={() => setPage('admin-chat')}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                      page === 'admin-chat'
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    المحادثات
                  </button>
                </>
              )}

              <div className="w-px h-8 bg-zinc-800 mx-2" />

              <div className="flex items-center gap-3">
                <span className="text-zinc-400 text-sm max-w-[150px] truncate">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-zinc-400 hover:text-red-500 p-2 rounded-xl hover:bg-zinc-800/50 transition-all"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden text-zinc-400 hover:text-white p-2"
            >
              {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-black/95 border-t border-zinc-800 px-4 py-4 space-y-2">
            <button
              onClick={() => { setPage('products'); setMobileMenu(false); }}
              className={`w-full text-right px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                page === 'products' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800/50'
              }`}
            >
              <Store className="w-4 h-4" />
              المتجر
            </button>
            {admin && (
              <>
                <button
                  onClick={() => { setPage('admin'); setMobileMenu(false); }}
                  className={`w-full text-right px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                    page === 'admin' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800/50'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  لوحة التحكم
                </button>
                <button
                  onClick={() => { setPage('admin-chat'); setMobileMenu(false); }}
                  className={`w-full text-right px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                    page === 'admin-chat' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800/50'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  المحادثات
                </button>
              </>
            )}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-zinc-400 text-xs truncate">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-red-500 p-2 rounded-xl hover:bg-zinc-800/50 transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Page content */}
      <div className="relative">
        {page === 'products' && <ProductsPage onBuy={(p) => setChatProduct(p)} />}
        {page === 'admin' && <AdminPage />}
        {page === 'admin-chat' && <AdminChatPage />}
      </div>

      {/* Chat modal */}
      {chatProduct && <ChatModal product={chatProduct} onClose={() => setChatProduct(null)} />}

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-red-600" />
            <span className="text-white font-bold">K4HLD STORE</span>
          </div>
          <p className="text-zinc-600 text-xs">بيع حسابات Free Fire و eFootball</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
