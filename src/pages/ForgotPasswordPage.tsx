import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Flame, Mail, ArrowRight, CheckCircle } from 'lucide-react';

type Props = {
  onSwitchToLogin: () => void;
};

export default function ForgotPasswordPage({ onSwitchToLogin }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    setLoading(false);

    if (error) {
      setError('حدث خطأ، تأكد من صحة البريد الإلكتروني');
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-red-950/30" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-800/10 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 mb-4 shadow-lg shadow-red-900/50">
            <Flame className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">K4HLD STORE</h1>
          <p className="text-zinc-500 text-sm mt-1">استعادة كلمة المرور</p>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <p className="text-white font-semibold mb-2">تم إرسال رابط الاستعادة</p>
              <p className="text-zinc-400 text-sm mb-6">
                تحقق من بريدك الإلكتروني واتبع التعليمات لإعادة تعيين كلمة المرور
              </p>
              <button
                onClick={onSwitchToLogin}
                className="text-sm text-red-500 hover:text-red-400 font-semibold"
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          ) : (
            <>
              <p className="text-zinc-400 text-sm mb-6">
                أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="w-full bg-black/50 border border-zinc-800 text-white rounded-xl py-3 pr-11 pl-4 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-950/50 border border-red-800/50 text-red-400 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'جارٍ الإرسال...' : 'إرسال رابط الاستعادة'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={onSwitchToLogin}
                  className="text-sm text-zinc-400 hover:text-red-500 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowRight className="w-4 h-4" />
                  العودة لتسجيل الدخول
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
