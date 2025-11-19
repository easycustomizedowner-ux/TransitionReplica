import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Send, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Dialog } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function ChatWindow({ isOpen, onClose, conversation, currentUserEmail }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [threadId, setThreadId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getSession();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, []);

  // Fetch thread and messages when conversation opens
  useEffect(() => {
    if (!isOpen || !conversation || !currentUserId) return;

    const fetchThreadAndMessages = async () => {
      setIsLoading(true);
      try {
        // 1. Find the thread
        let tid = null;

        // Try to find by quote_id first
        if (conversation.quote_id) {
          const { data: thread } = await supabase
            .from('chat_threads')
            .select('id')
            .eq('quote_id', conversation.quote_id)
            .single();
          if (thread) tid = thread.id;
        }

        // If not found, try to find by participants (optional, if we support direct chats without quotes)
        // For now, assume quote_id is key.

        // If no thread exists, we might need to create one on the first message, 
        // OR we just show empty.

        if (tid) {
          setThreadId(tid);

          // 2. Fetch messages
          const { data: msgs, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('thread_id', tid)
            .order('created_at', { ascending: true });

          if (error) throw error;
          setMessages(msgs || []);
        } else {
          setThreadId(null);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error fetching chat:", error);
        toast.error("Failed to load chat history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreadAndMessages();
  }, [isOpen, conversation, currentUserId]);

  // Realtime subscription
  useEffect(() => {
    if (!isOpen || !threadId) return;

    const channel = supabase
      .channel(`thread:${threadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `thread_id=eq.${threadId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, threadId]);

  const handleSend = async () => {
    if (!message.trim() || !currentUserId) return;

    const text = message.trim();
    setMessage(""); // Optimistic clear

    try {
      let targetThreadId = threadId;

      // Create thread if it doesn't exist
      if (!targetThreadId) {
        // We need vendor_id and customer_id.
        // Conversation object has them?
        // CustomerDashboard sets: quote_id, vendor_id, customer_id.
        // VendorDashboard sets: quote_id, vendor_id, customer_id (we need to ensure this).

        if (!conversation.vendor_id || !conversation.customer_id) {
          throw new Error("Missing participant info");
        }

        const { data: newThread, error: createError } = await supabase
          .from('chat_threads')
          .insert({
            quote_id: conversation.quote_id,
            customer_id: conversation.customer_id,
            vendor_id: conversation.vendor_id
          })
          .select()
          .single();

        if (createError) throw createError;
        targetThreadId = newThread.id;
        setThreadId(targetThreadId);
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: targetThreadId,
          sender_id: currentUserId,
          content: text
        });

      if (error) throw error;

    } catch (error) {
      console.error("Send error:", error);
      toast.error("Failed to send message");
      setMessage(text); // Restore message on error
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen || !conversation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card rounded-3xl w-full max-w-4xl h-[80vh] sm:h-[600px] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#CEFF00]/20">
            <div className="flex-1 min-w-0 pr-4">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold truncate">
                {conversation.otherUserName || 'Chat'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 truncate">
                {conversation.post_title || 'Conversation'}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 text-[#CEFF00] animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-12">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${msg.sender_id === currentUserId ? 'order-2' : 'order-1'}`}>
                    <div className={`rounded-2xl p-4 ${msg.sender_id === currentUserId
                        ? 'bg-[#CEFF00] text-[#0D0D0D]'
                        : 'glass-card'
                      }`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-2 ${msg.sender_id === currentUserId ? 'text-[#0D0D0D]/60' : 'text-gray-400'
                        }`}>
                        {format(new Date(msg.created_at), 'p')}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-end mx-2 ${msg.sender_id === currentUserId ? 'order-1' : 'order-2'}`}>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 sm:p-6 border-t border-[#CEFF00]/20">
            <div className="flex gap-2 sm:gap-3">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-white/5 border-[#CEFF00]/20 text-white text-sm sm:text-base"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="glow-button px-4 sm:px-6 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </Dialog>
  );
}