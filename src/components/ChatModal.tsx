import { useEffect, useRef, useState } from 'react';
import { supabase, type Message, type Conversation, type Product } from '@/lib/supabase';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Props = {
  product: Product;
  onClose: () => void;
};

export default function ChatModal({ product, onClose }: Props) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function initChat() {
    if (!user) return;
    setLoading(true);

    // Try to find an existing conversation for this user
    const { data: existingConv } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingConv) {
      setConversation(existingConv as Conversation);
      await loadMessages((existingConv as Conversation).id);
      subscribeToMessages((existingConv as Conversation).id);
      setLoading(false);
      return;
    }

    // Get admin ID via RPC function
    const { data: adminId } = await supabase.rpc('get_admin_id');

    if (!adminId) {
      setLoading(false);
      return;
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        admin_id: adminId as string,
        product_id: product.id,
        product_title: product.title,
      })
      .select('*')
      .maybeSingle();

    if (!error && newConv) {
      setConversation(newConv as Conversation);
      await loadMessages((newConv as Conversation).id);
      subscribeToMessages((newConv as Conversation).id);

      // Send automatic message
      await supabase.from('chat_messages').insert({
        conversation_id: (newConv as Conversation).id,
        sender_id: user.id,
        content: `يريد شراء: ${product.title}`,
      });
    }

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
      .channel(`chat:${convId}`)
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
    if (!input.trim() || !conversation) return;

    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: conversation.id,
      sender_id: user!.id,
      content: input.trim(),
    });

    if (!error) {
      setInput('');
    }
    setSending(false);
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md h-[85vh] sm:h-[600px] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">محادثة مع البائع</h3>
              <p className="text-zinc-500 text-xs line-clamp-1">{product.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-zinc-600 text-sm py-8">ابدأ المحادثة</div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user!.id;
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
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب رسالتك..."
            disabled={loading || sending}
            className="flex-1 bg-black/50 border border-zinc-800 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || sending || !input.trim()}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold px-4 rounded-xl transition-all shadow-lg shadow-red-900/30 disabled:opacity-50 active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
