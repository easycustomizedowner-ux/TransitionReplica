import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Minimize2, Maximize2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ChatWindow from "./ChatWindow";

export default function VendorChatPopup({ vendorEmail }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false);

  // Fetch all quotes for this vendor to get customer conversations
  const { data: allQuotes = [] } = useQuery({
    queryKey: ['vendor-chat-quotes', vendorEmail],
    queryFn: async () => {
      const quotes = await base44.entities.Quote.list('-created_date');
      return quotes.filter(q => q.vendor_email === vendorEmail);
    },
    enabled: !!vendorEmail,
    refetchInterval: 3000, // Poll every 3 seconds for real-time updates
  });

  // Fetch all chat messages
  const { data: allMessages = [] } = useQuery({
    queryKey: ['vendor-chat-messages', vendorEmail],
    queryFn: () => base44.entities.ChatMessage.list('-created_date'),
    enabled: !!vendorEmail,
    refetchInterval: 3000, // Real-time polling
  });

  // Group chats by customer and post
  const chatThreads = React.useMemo(() => {
    const threads = new Map();
    
    allQuotes.forEach(quote => {
      const key = `${quote.customer_email}-${quote.post_id}`;
      if (!threads.has(key)) {
        const threadMessages = allMessages.filter(
          msg => 
            msg.post_id === quote.post_id &&
            ((msg.sender_email === vendorEmail && msg.receiver_email === quote.customer_email) ||
             (msg.sender_email === quote.customer_email && msg.receiver_email === vendorEmail))
        );
        
        const lastMessage = threadMessages[0];
        const unreadCount = threadMessages.filter(
          msg => msg.sender_email === quote.customer_email
        ).length;

        threads.set(key, {
          customer_email: quote.customer_email,
          customer_name: quote.customer_name,
          post_id: quote.post_id,
          post_title: quote.post_title,
          lastMessage: lastMessage?.message || "No messages yet",
          lastMessageTime: lastMessage?.created_date || quote.created_date,
          unreadCount,
        });
      }
    });

    return Array.from(threads.values()).sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
  }, [allQuotes, allMessages, vendorEmail]);

  const handleChatClick = (thread) => {
    setSelectedChat({
      post_id: thread.post_id,
      post_title: thread.post_title,
      otherUserEmail: thread.customer_email,
      otherUserName: thread.customer_name
    });
    setIsChatWindowOpen(true);
  };

  const totalUnread = chatThreads.reduce((sum, thread) => sum + thread.unreadCount, 0);

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 glow-button rounded-full flex items-center justify-center shadow-2xl"
      >
        <MessageCircle className="w-6 h-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </motion.button>

      {/* Chat Popup Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] glass-card rounded-2xl overflow-hidden shadow-2xl border-2 border-[#CEFF00]/30"
          >
            {/* Header */}
            <div className="bg-[#CEFF00] text-[#0D0D0D] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-bold">Customer Chats</h3>
                {totalUnread > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="hover:bg-[#0D0D0D]/10 p-1 rounded transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-[#0D0D0D]/10 p-1 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat List */}
            {!isMinimized && (
              <div className="max-h-96 overflow-y-auto">
                {chatThreads.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No customer chats yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {chatThreads.map((thread, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleChatClick(thread)}
                        className="p-4 hover:bg-white/5 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-[#CEFF00]/20 flex items-center justify-center flex-shrink-0 text-[#CEFF00] font-bold">
                            {thread.customer_name.charAt(0).toUpperCase()}
                          </div>

                          {/* Chat Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-white text-sm group-hover:text-[#CEFF00] transition-colors truncate">
                                {thread.customer_name}
                              </h4>
                              {thread.unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                                  {thread.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#CEFF00]/80 mb-1 truncate">{thread.post_title}</p>
                            <p className="text-xs text-gray-400 truncate">{thread.lastMessage}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <ChatWindow
        isOpen={isChatWindowOpen}
        onClose={() => {
          setIsChatWindowOpen(false);
          setSelectedChat(null);
        }}
        conversation={selectedChat}
        currentUserEmail={vendorEmail}
      />
    </>
  );
}