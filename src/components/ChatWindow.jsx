import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Send, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useChatContext } from "./ChatContext";
import { Dialog } from "@/components/ui/dialog"; // Added Dialog import

export default function ChatWindow({ isOpen, onClose, conversation, currentUserEmail }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const { sendMessage, getMessagesForPost } = useChatContext();

  const messages = conversation ? getMessagesForPost(
    conversation.post_id,
    currentUserEmail,
    conversation.otherUserEmail
  ) : [];

  const handleSend = () => {
    if (!message.trim() || !conversation) return;

    sendMessage({
      postId: conversation.post_id,
      senderEmail: currentUserEmail,
      senderName: localStorage.getItem('userName'),
      receiverEmail: conversation.otherUserEmail,
      receiverName: conversation.otherUserName,
      text: message.trim()
    });

    setMessage("");
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
              <h3 className="text-base sm:text-lg lg:text-xl font-bold truncate">{conversation.otherUserName}</h3>
              <p className="text-xs sm:text-sm text-gray-400 truncate">{conversation.post_title}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-12">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.senderEmail === currentUserEmail ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${msg.senderEmail === currentUserEmail ? 'order-2' : 'order-1'}`}>
                    <div className={`rounded-2xl p-4 ${
                      msg.senderEmail === currentUserEmail
                        ? 'bg-[#CEFF00] text-[#0D0D0D]'
                        : 'glass-card'
                    }`}>
                      <p>{msg.text}</p>
                      <p className={`text-xs mt-2 ${
                        msg.senderEmail === currentUserEmail ? 'text-[#0D0D0D]/60' : 'text-gray-400'
                      }`}>
                        {format(new Date(msg.timestamp), 'p')}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-end mx-2 ${msg.senderEmail === currentUserEmail ? 'order-1' : 'order-2'}`}>
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