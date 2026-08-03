import { useEffect, useState } from 'react';
import { supabase, type Conversation, type Message } from '@/lib/supabase';
import { MessageCircle, Send, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
      subscribeToMessages(selectedConv.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConv]);

  async function loadConversations() {
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('created_at', { ascending: false });

    setConversations((data as Conversation[]) ?? []);
    setLoading(false);
  }

  async function loadMessages(convId: string) {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    setMessages((data as Message[]) ?? []);
  }

  function subscribeToMessages(convId: string) {
    supabase
      .channel(`admin_chat:${convId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${convId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !selectedConv || !user) return;

    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: selectedConv.id,
      sender_id: user.id,
      content: input.trim(),
    });

    if (!error) {
      setInput('');
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">محادثات العملاء</h2>
        <p className="text-zinc-500 text-sm">الرد على طلبات الشراء</p>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-20">
          <MessageCircle className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-lg">لا توجد محادثات بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
          {/* Conversations list */}
          <div className="lg:col-span-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-white font-bold text-sm">المحادثات ({conversations.length})</h3>
            </div>
            <div className="overflow-y-auto max-h-[540px]">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full text-right p-4 border-b border-zinc-800/50 transition-colors flex items-center gap-3 ${
                    selectedConv?.id === conv.id ? 'bg-red-950/30 border-r-2 border-r-red-600' : 'hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{conv.product_title}</p>
                    <p className="text-zinc-500 text-xs">
                      {new Date(conv.created_at).toLocaleDateString('ar-MA')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col">
            {selectedConv ? (
              <>
                <div className="p-4 border-b border-zinc-800">
                  <h3 className="text-white font-bold text-sm">{selectedConv.product_title}</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                            isMe
                              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-bl-sm'
                              : 'bg-zinc-800 text-zinc-100 rounded-br-sm'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800 flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="اكتب ردك..."
                    disabled={sending}
                    className="flex-1 bg-black/50 border border-zinc-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold px-4 rounded-xl transition-all disabled:opacity-50 active:scale-95"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-600">
                <div className="text-center">
                  <ArrowRight className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">اختر محادثة للرد عليها</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
