import React, { createContext, useContext, useState, useEffect } from 'react';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatMessages');
    return saved ? JSON.parse(saved) : [];
  });

  const [posts, setPosts] = useState(() => {
    const saved = localStorage.getItem('customerPosts');
    return saved ? JSON.parse(saved) : [];
  });

  const [quotes, setQuotes] = useState(() => {
    const saved = localStorage.getItem('vendorQuotes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('customerPosts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('vendorQuotes', JSON.stringify(quotes));
  }, [quotes]);

  const sendMessage = (messageData) => {
    const newMessage = {
      id: Date.now().toString(),
      ...messageData,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const getMessagesForPost = (postId, userEmail, otherUserEmail) => {
    return messages.filter(msg => 
      msg.postId === postId &&
      ((msg.senderEmail === userEmail && msg.receiverEmail === otherUserEmail) ||
       (msg.senderEmail === otherUserEmail && msg.receiverEmail === userEmail))
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  const addPost = (post) => {
    const newPost = {
      id: Date.now().toString(),
      ...post,
      created_date: new Date().toISOString(),
      status: 'open',
      quote_count: 0
    };
    setPosts(prev => [...prev, newPost]);
    return newPost;
  };

  const addQuote = (quote) => {
    const newQuote = {
      id: Date.now().toString(),
      ...quote,
      created_date: new Date().toISOString(),
      status: 'pending'
    };
    setQuotes(prev => [...prev, newQuote]);
    return newQuote;
  };

  const getPostsByCustomer = (customerEmail) => {
    return posts.filter(post => post.customer_email === customerEmail)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  };

  const getQuotesByVendor = (vendorEmail) => {
    return quotes.filter(quote => quote.vendor_email === vendorEmail)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  };

  const getQuotesForPost = (postId) => {
    return quotes.filter(quote => quote.post_id === postId);
  };

  const value = {
    messages,
    posts,
    quotes,
    sendMessage,
    getMessagesForPost,
    addPost,
    addQuote,
    getPostsByCustomer,
    getQuotesByVendor,
    getQuotesForPost
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;