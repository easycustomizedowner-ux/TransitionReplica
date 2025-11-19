import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageCircle, Package, Loader2, TrendingUp, BarChart3, Filter, X, Plus, Edit, Trash2, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VendorInventoryForm from "../components/VendorInventoryForm";
import VendorChatPopup from "../components/VendorChatPopup";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ChatWindow from "../components/ChatWindow";
import ProtectedRoute from "../components/ProtectedRoute";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const NEON_COLOR = '#CEFF00';
const CHART_COLORS = ['#CEFF00', '#00D9FF', '#FF00E5', '#FFD700', '#00FF9F'];

function VendorDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("available");
  const [selectedPost, setSelectedPost] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ price: "", delivery_days: "", message: "" });
  const [chatConversation, setChatConversation] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItemConfirm, setDeleteItemConfirm] = useState(null);

  const userEmail = localStorage.getItem('userEmail');
  const userName = localStorage.getItem('userName');

  const { data: allPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['all-posts'],
    queryFn: () => base44.entities.CustomerPost.list('-created_date'),
    enabled: !!userEmail,
  });

  const { data: myQuotes = [] } = useQuery({
    queryKey: ['vendor-quotes', userEmail],
    queryFn: async () => {
      const allQuotes = await base44.entities.Quote.list('-created_date');
      return allQuotes.filter(quote => quote.vendor_email === userEmail);
    },
    enabled: !!userEmail,
  });

  const { data: myInventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['vendor-inventory', userEmail],
    queryFn: async () => {
      const allItems = await base44.entities.VendorInventory.list('-created_date');
      return allItems.filter(item => item.vendor_email === userEmail);
    },
    enabled: !!userEmail,
  });

  const { data: itemRequests = [] } = useQuery({
    queryKey: ['item-requests', userEmail],
    queryFn: async () => {
      const allRequests = await base44.entities.ItemRequest.list('-created_date');
      return allRequests.filter(req => req.vendor_email === userEmail);
    },
    enabled: !!userEmail,
  });

  const { data: allCustomerPosts = [] } = useQuery({
    queryKey: ['all-customer-posts'],
    queryFn: () => base44.entities.CustomerPost.list('-created_date'),
    enabled: !!userEmail,
  });

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!allPosts.length) return { topProducts: [], topCategories: [] };

    // Count products by title
    const productCounts = {};
    allPosts.forEach(post => {
      if (post.title) {
        productCounts[post.title] = (productCounts[post.title] || 0) + 1;
      }
    });

    // Count categories
    const categoryCounts = {};
    allPosts.forEach(post => {
      if (post.category) {
        categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
      }
    });

    // Get top 5 products
    const topProducts = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count], index) => ({
        name: name.length > 25 ? name.substring(0, 25) + '...' : name,
        fullName: name,
        count,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }));

    // Get top 5 categories
    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count], index) => ({
        name,
        count,
        value: count,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }));

    return { topProducts, topCategories };
  }, [allPosts]);

  const submitQuoteMutation = useMutation({
    mutationFn: (quoteData) => base44.entities.Quote.create(quoteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-quotes'] });
      setSelectedPost(null);
      setQuoteForm({ price: "", delivery_days: "", message: "" });
    },
  });

  const createInventoryMutation = useMutation({
    mutationFn: (itemData) => base44.entities.VendorInventory.create({
      ...itemData,
      vendor_email: userEmail,
      vendor_name: userName
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-inventory'] });
      setIsInventoryFormOpen(false);
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VendorInventory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-inventory'] });
      setIsInventoryFormOpen(false);
      setEditingItem(null);
    },
  });

  const deleteInventoryMutation = useMutation({
    mutationFn: (id) => base44.entities.VendorInventory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-inventory'] });
      setDeleteItemConfirm(null);
    },
  });

  const handleSubmitQuote = () => {
    submitQuoteMutation.mutate({
      post_id: selectedPost.id,
      post_title: selectedPost.title,
      customer_email: selectedPost.customer_email,
      customer_name: selectedPost.customer_name,
      vendor_email: userEmail,
      vendor_name: userName,
      price: parseFloat(quoteForm.price),
      delivery_days: parseInt(quoteForm.delivery_days),
      message: quoteForm.message
    });
  };

  const handleOpenChat = (quote) => {
    setChatConversation({
      post_id: quote.post_id,
      post_title: quote.post_title,
      otherUserEmail: quote.customer_email,
      otherUserName: quote.customer_name
    });
    setIsChatOpen(true);
  };

  const handleInventorySubmit = (formData) => {
    if (editingItem) {
      updateInventoryMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createInventoryMutation.mutate(formData);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsInventoryFormOpen(true);
  };

  const handleDeleteItem = (item) => {
    setDeleteItemConfirm(item);
  };

  const confirmDeleteItem = () => {
    if (deleteItemConfirm) {
      deleteInventoryMutation.mutate(deleteItemConfirm.id);
    }
  };

  const hasQuotedPost = (postId) => {
    return myQuotes.some(quote => quote.post_id === postId);
  };

  // Filter posts based on category
  const filteredPosts = categoryFilter 
    ? allPosts.filter(post => post.category === categoryFilter)
    : allPosts;

  const availablePosts = filteredPosts.filter(post => !hasQuotedPost(post.id));

  const handleCategoryClick = (categoryName) => {
    setCategoryFilter(categoryName);
    setActiveTab("available");
  };

  const clearFilter = () => {
    setCategoryFilter(null);
  };

  return (
    <ProtectedRoute requiredRole="vendor">
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">
              Welcome, <span className="neon-text">{userName}</span>
            </h1>
            <p className="text-gray-400">Browse requests and submit quotes to win business</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Available Requests</p>
                  <p className="text-3xl font-bold">{availablePosts.length}</p>
                </div>
                <Search className="w-12 h-12 text-[#CEFF00]" />
              </div>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Quotes Submitted</p>
                  <p className="text-3xl font-bold">{myQuotes.length}</p>
                </div>
                <Package className="w-12 h-12 text-[#CEFF00]" />
              </div>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Active Chats</p>
                  <p className="text-3xl font-bold">
                    {new Set(myQuotes.map(q => q.customer_email)).size}
                  </p>
                </div>
                <MessageCircle className="w-12 h-12 text-[#CEFF00]" />
              </div>
            </div>
          </div>

          {/* Product Demand Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-[#CEFF00]" />
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                  Product Demand <span className="neon-text">Analytics</span>
                </h2>
              </div>
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-[#CEFF00] animate-pulse" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Top Trending Products */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="glass-card p-6 rounded-2xl"
              >
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center space-x-2">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-[#CEFF00]" />
                  <span>Top 5 Trending Products</span>
                </h3>
                {analytics.topProducts.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No data available yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics.topProducts.map((product, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="relative group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                              style={{ backgroundColor: product.color + '20', color: product.color }}
                            >
                              {index + 1}
                            </div>
                            <span 
                              className="font-semibold text-white group-hover:text-[#CEFF00] transition-colors cursor-help"
                              title={product.fullName}
                            >
                              {product.name}
                            </span>
                          </div>
                          <span className="text-[#CEFF00] font-bold">{product.count} requests</span>
                        </div>
                        <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(product.count / analytics.topProducts[0].count) * 100}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className="absolute h-full rounded-full"
                            style={{ 
                              backgroundColor: product.color,
                              boxShadow: `0 0 20px ${product.color}50`
                            }}
                          />
                        </div>
                        {/* Tooltip on hover */}
                        <div className="absolute left-0 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="glass-card px-3 py-2 rounded-lg text-sm whitespace-nowrap">
                            {product.fullName}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Top Categories with Pie Chart */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass-card p-6 rounded-2xl"
              >
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center space-x-2">
                  <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-[#CEFF00]" />
                  <span>Top 5 Categories in Demand</span>
                </h3>
                {analytics.topCategories.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No data available yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Pie Chart */}
                    <div className="flex justify-center">
                      <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
                        <PieChart>
                          <Pie
                            data={analytics.topCategories}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analytics.topCategories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(26, 26, 26, 0.95)', 
                              border: '1px solid rgba(206, 255, 0, 0.3)',
                              borderRadius: '12px',
                              color: '#fff'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Category List with Click to Filter */}
                    <div className="space-y-3">
                      {analytics.topCategories.map((category, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleCategoryClick(category.name)}
                          className="w-full glass-card p-4 rounded-xl hover:border-[#CEFF00] transition-all group cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="font-semibold group-hover:text-[#CEFF00] transition-colors">
                                {category.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[#CEFF00] font-bold">{category.count}</span>
                              <Search className="w-4 h-4 text-gray-400 group-hover:text-[#CEFF00] transition-colors" />
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    <p className="text-sm text-gray-400 text-center mt-4">
                      💡 Click any category to filter marketplace
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-white/5">
                <TabsTrigger value="available">Available Jobs</TabsTrigger>
                <TabsTrigger value="quoted">My Quotes</TabsTrigger>
                <TabsTrigger value="inventory">My Inventory</TabsTrigger>
              </TabsList>

              {/* Category Filter Badge */}
              <AnimatePresence>
                {categoryFilter && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center space-x-2 glass-card px-4 py-2 rounded-xl border-[#CEFF00]"
                  >
                    <Filter className="w-4 h-4 text-[#CEFF00]" />
                    <span className="text-sm">Filtering: <span className="text-[#CEFF00] font-semibold">{categoryFilter}</span></span>
                    <button
                      onClick={clearFilter}
                      className="text-gray-400 hover:text-[#CEFF00] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <TabsContent value="available">
              {postsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-[#CEFF00] animate-spin mx-auto" />
                </div>
              ) : availablePosts.length === 0 ? (
                <div className="glass-card p-12 rounded-2xl text-center">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-4">
                    {categoryFilter 
                      ? `No available requests in "${categoryFilter}" category`
                      : "No available requests at the moment"
                    }
                  </p>
                  {categoryFilter && (
                    <button
                      onClick={clearFilter}
                      className="glow-button px-6 py-2 rounded-xl font-semibold"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availablePosts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-6 rounded-2xl hover:border-[#CEFF00]/50 transition-all"
                    >
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold line-clamp-2 flex-1 pr-2">{post.title}</h3>
                          <span className="px-2 py-1 bg-[#CEFF00]/20 text-[#CEFF00] text-xs rounded-full flex-shrink-0">
                            {post.category}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-3">{post.description}</p>
                        {post.images && post.images.length > 0 && (
                          <div className="flex gap-2 mb-3 overflow-x-auto">
                            {post.images.slice(0, 3).map((img, idx) => (
                              <img 
                                key={idx} 
                                src={img} 
                                alt={`${post.title} ${idx + 1}`}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                onError={(e) => e.target.src = 'https://via.placeholder.com/64?text=Image'}
                              />
                            ))}
                            {post.images.length > 3 && (
                              <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center text-xs text-gray-400">
                                +{post.images.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="mb-4">
                        <p className="text-2xl font-bold text-[#CEFF00]">Budget: ₹{post.budget}</p>
                        <p className="text-sm text-gray-400 mt-1">by {post.customer_name}</p>
                      </div>
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="w-full py-2 glow-button rounded-lg font-semibold"
                      >
                        Submit Quote
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="quoted">
              {myQuotes.length === 0 ? (
                <div className="glass-card p-12 rounded-2xl text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">You haven't submitted any quotes yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myQuotes.map((quote) => {
                    const post = allCustomerPosts.find(p => p.id === quote.post_id);

                    return (
                      <motion.div
                        key={quote.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-2xl overflow-hidden hover:border-[#CEFF00]/50 transition-all"
                      >
                        {/* Product Image */}
                        {post?.images && post.images.length > 0 && (
                          <div className="relative h-48 bg-black/20">
                            <img
                              src={post.images[0]}
                              alt={quote.post_title}
                              className="w-full h-full object-cover"
                              onError={(e) => e.target.src = 'https://via.placeholder.com/400?text=Product'}
                            />
                            <div className="absolute top-2 right-2">
                              <span className={`px-3 py-1 text-xs rounded-full ${
                                quote.status === 'accepted' ? 'bg-green-500 text-white' :
                                quote.status === 'rejected' ? 'bg-red-500 text-white' :
                                'bg-yellow-500 text-[#0D0D0D]'
                              } font-semibold`}>
                                {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="p-6">
                          {/* Product Name */}
                          <h3 className="text-xl font-bold mb-3 line-clamp-2">{quote.post_title}</h3>

                          {/* Product Description */}
                          {post?.description && (
                            <p className="text-sm text-gray-400 line-clamp-3 mb-4">{post.description}</p>
                          )}

                          {/* Customer Info */}
                          <div className="glass-card p-3 rounded-lg mb-4">
                            <p className="text-xs text-gray-400 mb-1">Customer</p>
                            <p className="text-sm font-semibold">{quote.customer_name}</p>
                          </div>

                          {/* Quote Details */}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-xs text-gray-400">Your Quote</p>
                              <p className="text-2xl font-bold text-[#CEFF00]">₹{quote.price}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Delivery</p>
                              <p className="text-sm font-semibold">{quote.delivery_days} days</p>
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => handleOpenChat(quote)}
                            className="w-full py-3 bg-[#CEFF00]/10 border border-[#CEFF00]/30 rounded-lg font-semibold hover:bg-[#CEFF00]/20 transition-colors flex items-center justify-center space-x-2"
                          >
                            <MessageCircle className="w-5 h-5" />
                            <span>Chat with Customer</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="inventory">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Inventory</h2>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsInventoryFormOpen(true);
                  }}
                  className="glow-button px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Item
                </button>
              </div>

              {inventoryLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-[#CEFF00] animate-spin mx-auto" />
                </div>
              ) : myInventory.length === 0 ? (
                <div className="glass-card p-12 rounded-2xl text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-4">No items in inventory yet</p>
                  <button
                    onClick={() => setIsInventoryFormOpen(true)}
                    className="glow-button px-6 py-2 rounded-xl font-semibold"
                  >
                    Add Your First Item
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myInventory.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-2xl overflow-hidden hover:border-[#CEFF00]/50 transition-all group"
                    >
                      <div className="relative h-48 bg-black/20">
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={item.images[0]}
                            alt={item.product_name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/400?text=Product'}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-gray-600" />
                          </div>
                        )}
                        {item.is_featured && (
                          <div className="absolute top-2 right-2 bg-[#CEFF00] text-[#0D0D0D] px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-semibold">
                            <Star className="w-3 h-3 fill-[#0D0D0D]" />
                            Featured
                          </div>
                        )}
                        {item.stock === 0 && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <span className="text-red-400 font-bold text-lg">Out of Stock</span>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold line-clamp-1 group-hover:text-[#CEFF00] transition-colors">
                              {item.product_name}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">{item.category}</p>
                          </div>
                        </div>

                        <p className="text-sm text-gray-400 line-clamp-2 mb-4">{item.description}</p>

                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-2xl font-bold text-[#CEFF00]">₹{item.price}</p>
                            <p className="text-xs text-gray-400">Stock: {item.stock}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg font-semibold hover:bg-blue-500/20 transition-colors flex items-center justify-center space-x-1 text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="py-2 bg-red-500/10 border border-red-500/30 rounded-lg font-semibold hover:bg-red-500/20 transition-colors flex items-center justify-center space-x-1 text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
            </Tabs>

          {/* Quote Submission Modal */}
          <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
            <DialogContent className="bg-[#1A1A1A] border-[#CEFF00]/20 max-w-2xl text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Submit Quote</DialogTitle>
              </DialogHeader>
              {selectedPost && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">{selectedPost.title}</h3>
                    <p className="text-gray-400 mb-2">{selectedPost.description}</p>
                    <p className="text-sm text-gray-400">Budget: ₹{selectedPost.budget}</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="price">Your Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="Enter your price"
                        value={quoteForm.price}
                        onChange={(e) => setQuoteForm({...quoteForm, price: e.target.value})}
                        className="bg-white/5 border-[#CEFF00]/20 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="delivery">Delivery Time (days)</Label>
                      <Input
                        id="delivery"
                        type="number"
                        placeholder="Estimated delivery in days"
                        value={quoteForm.delivery_days}
                        onChange={(e) => setQuoteForm({...quoteForm, delivery_days: e.target.value})}
                        className="bg-white/5 border-[#CEFF00]/20 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message to Customer</Label>
                      <Textarea
                        id="message"
                        placeholder="Explain why you're the best choice..."
                        value={quoteForm.message}
                        onChange={(e) => setQuoteForm({...quoteForm, message: e.target.value})}
                        className="bg-white/5 border-[#CEFF00]/20 text-white mt-2 h-32"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => setSelectedPost(null)}
                      className="flex-1 py-3 glass-card rounded-xl font-semibold hover:border-[#CEFF00]/50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitQuote}
                      disabled={!quoteForm.price || !quoteForm.delivery_days || !quoteForm.message}
                      className="flex-1 py-3 glow-button rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Quote
                    </button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <VendorInventoryForm
            isOpen={isInventoryFormOpen}
            onClose={() => {
              setIsInventoryFormOpen(false);
              setEditingItem(null);
            }}
            item={editingItem}
            onSubmit={handleInventorySubmit}
          />

          <AnimatePresence>
            {deleteItemConfirm && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card rounded-2xl p-6 max-w-md w-full"
                >
                  <h3 className="text-xl font-bold mb-4">Delete Item?</h3>
                  <p className="text-gray-400 mb-6">
                    Are you sure you want to delete "{deleteItemConfirm.product_name}"? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteItemConfirm(null)}
                      className="flex-1 py-2 glass-card rounded-lg font-semibold hover:border-[#CEFF00]/50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteItem}
                      className="flex-1 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <ChatWindow
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            conversation={chatConversation}
            currentUserEmail={userEmail}
            />

            <VendorChatPopup vendorEmail={userEmail} />
            </div>
            </div>
            </ProtectedRoute>
            );
            }

export default VendorDashboard;