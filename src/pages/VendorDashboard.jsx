import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, DollarSign, TrendingUp, MessageCircle, Plus,
  Search, Filter, X, ChevronRight, Star, Settings, LogOut,
  ShoppingBag, Edit, Trash2, Upload, Loader2
} from "lucide-react";
import ChatWindow from "../components/ChatWindow";
import ProtectedRoute from "../components/ProtectedRoute";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

function VendorDashboard() {
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ price: "", delivery_days: "", message: "" });
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [chatConversation, setChatConversation] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [userId, setUserId] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        // First try to get from localStorage (set by Auth.jsx)
        const storedEmail = localStorage.getItem('userEmail');
        const storedName = localStorage.getItem('userName');

        // Then get session from Supabase
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUserId(session.user.id);
          setUserEmail(storedEmail || session.user.email);
          setUserName(storedName || "Vendor");
        } else {
          console.error("No session found");
          // If no session, clear localStorage and redirect will happen via ProtectedRoute
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setUserLoading(false);
      }
    };

    getUser();
  }, []);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS

  // Fetch all customer posts (ads)
  const { data: allPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['all-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          customer:created_by (display_name)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(post => ({
        ...post,
        budget: post.budget_min, // Map for frontend compatibility
        customer_name: post.customer?.display_name || 'Customer'
      }));
    },
  });

  // Fetch vendor's quotes
  const { data: myQuotes = [] } = useQuery({
    queryKey: ['vendor-quotes', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customer:customer_id (display_name, email)
        `)
        .eq('vendor_id', userId);

      if (error) throw error;
      return data.map(q => ({
        ...q,
        customer_name: q.customer?.display_name,
        customer_email: q.customer?.email
      }));
    },
    enabled: !!userId,
  });

  // Fetch vendor's inventory
  const { data: myInventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['vendor-inventory', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('vendor_inventory')
        .select('*')
        .eq('vendor_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const submitQuoteMutation = useMutation({
    mutationFn: async (quoteData) => {
      const { data, error } = await supabase.from('quotes').insert({
        ad_id: quoteData.ad_id,
        vendor_id: userId,
        customer_id: quoteData.customer_id,
        price_total: quoteData.price,
        delivery_days: quoteData.delivery_days,
        message: quoteData.message,
        status: 'pending'
      }).select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-quotes'] });
      setSelectedPost(null);
      setQuoteForm({ price: "", delivery_days: "", message: "" });
      toast.success("Quote submitted successfully");
    },
    onError: (error) => {
      toast.error("Failed to submit quote: " + error.message);
    }
  });

  const createInventoryMutation = useMutation({
    mutationFn: async (itemData) => {
      const { data, error } = await supabase.from('vendor_inventory').insert({
        vendor_id: userId,
        product_name: itemData.product_name,
        description: itemData.description,
        price: itemData.price,
        category: itemData.category,
        images: itemData.images || [],
        stock: itemData.stock,
        status: 'active'
      }).select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-inventory'] });
      setIsInventoryModalOpen(false);
      toast.success("Item added to inventory");
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from('vendor_inventory').update({
        product_name: data.product_name,
        description: data.description,
        price: data.price,
        category: data.category,
        images: data.images,
        stock: data.stock
      }).eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-inventory'] });
      setIsInventoryModalOpen(false);
      setEditingItem(null);
      toast.success("Inventory updated");
    },
  });

  const deleteInventoryMutation = useMutation({
    mutationFn: async (itemId) => {
      const { error } = await supabase.from('vendor_inventory').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-inventory'] });
      toast.success("Item removed from inventory");
    },
  });

  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    if (!selectedPost) return;

    submitQuoteMutation.mutate({
      ad_id: selectedPost.id,
      customer_id: selectedPost.created_by,
      ...quoteForm
    });
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('vendor-inventory')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('vendor-inventory')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleInventorySubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const imageFile = formData.get('image');

    let imageUrls = editingItem?.images || [];

    if (imageFile && imageFile.size > 0) {
      try {
        setUploadingImage(true);
        const url = await uploadImage(imageFile);
        imageUrls = [url]; // Replace existing image for now, or append if supporting multiple
      } catch (error) {
        toast.error("Failed to upload image: " + error.message);
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    } else if (!imageUrls.length) {
      imageUrls = ['https://via.placeholder.com/400?text=Product'];
    }

    const data = {
      product_name: formData.get('product_name'),
      description: formData.get('description'),
      price: Number(formData.get('price')),
      category: formData.get('category'),
      stock: Number(formData.get('stock')),
      images: imageUrls
    };

    if (editingItem) {
      updateInventoryMutation.mutate({ id: editingItem.id, data });
    } else {
      createInventoryMutation.mutate(data);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsInventoryModalOpen(true);
  };

  const handleDeleteItem = (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteInventoryMutation.mutate(itemId);
    }
  };

  const handleOpenChat = async (quote) => {
    // We need customer details. 
    // The quote object from 'vendor-quotes' query might not have customer details joined yet.
    // Let's check the query.
    // It is: supabase.from('quotes').select('*').eq('vendor_id', userId);
    // We need to fetch customer name/email or join it in the query.

    // For now, let's update the query to fetch customer details too.
    // But to avoid breaking changes right now, we can just open the chat with available info.
    // ChatWindow needs: quote_id, otherUserEmail, otherUserName, vendor_id, customer_id.

    // We have quote_id, vendor_id, customer_id.
    // We lack otherUserEmail (customer email) and otherUserName.

    // Let's fetch the customer profile quickly or update the main query.
    // Updating the main query is better.

    setChatConversation({
      quote_id: quote.id,
      vendor_id: userId,
      customer_id: quote.customer_id,
      otherUserName: quote.customer_name || 'Customer',
      otherUserEmail: quote.customer_email,
      post_title: `Quote for Request`
    });
    setIsChatOpen(true);
  };

  const hasQuoted = (postId) => {
    return myQuotes.some(q => q.ad_id === postId);
  };

  // Analytics
  const totalRevenue = myQuotes
    .filter(q => q.status === 'accepted')
    .reduce((acc, curr) => acc + (Number(curr.price_total) || 0), 0);

  const activeQuotes = myQuotes.filter(q => q.status === 'pending').length;

  // Calculate demand by category
  const demandByCategory = allPosts.reduce((acc, post) => {
    acc[post.category] = (acc[post.category] || 0) + 1;
    return acc;
  }, {});

  const topCategories = Object.entries(demandByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const filteredPosts = allPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    "Fashion & Apparel",
    "Jewelry & Accessories",
    "Furniture & Décor",
    "Footwear",
    "Gifting & Art",
    "Automotive",
    "Tech & Gadgets",
    "Corporate & Branding",
    "Other Custom Requests"
  ];


  // Check if still loading user data
  if (userLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="vendor">
      <div className="min-h-screen bg-white px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Vendor Dashboard <span className="text-indigo-600">.</span>
              </h1>
              <p className="text-gray-600">Welcome back, {userName}</p>
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsInventoryModalOpen(true);
                }}
                className="glow-button px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Inventory
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-card p-6 rounded-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-600 text-sm">Total Revenue</p>
                  <h3 className="text-3xl font-bold mt-1">₹{totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-black/10 rounded-xl">
                  <DollarSign className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div className="flex items-center text-sm text-green-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+12.5% from last month</span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-card p-6 rounded-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-600 text-sm">Active Quotes</p>
                  <h3 className="text-3xl font-bold mt-1">{activeQuotes}</h3>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <MessageCircle className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {myQuotes.length} total quotes submitted
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-card p-6 rounded-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-600 text-sm">Inventory Items</p>
                  <h3 className="text-3xl font-bold mt-1">{myInventory.length}</h3>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Package className="w-6 h-6 text-purple-500" />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {myInventory.filter(i => i.stock < 5).length} low stock items
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Market Feed */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Market Feed</h2>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-white border border-gray-200 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-600 outline-none"
                  >
                    <option value="all" className="bg-white">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-white">{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input
                  type="text"
                  placeholder="Search requirements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:border-indigo-600 outline-none transition-colors"
                />
              </div>

              {/* Feed Items */}
              <div className="space-y-4">
                {postsLoading ? (
                  <div className="text-center py-12 text-gray-600">Loading opportunities...</div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">No requirements found matching your criteria</div>
                ) : (
                  filteredPosts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-6 rounded-2xl hover:border-black/30 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-gray-200 text-black text-xs rounded-full">
                              {post.category}
                            </span>
                            <span className="text-gray-600 text-xs">• Posted by {post.customer_name}</span>
                          </div>
                          <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2">{post.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Budget</p>
                          <p className="text-xl font-bold text-indigo-600">₹{post.budget}</p>
                        </div>
                      </div>

                      {post.images && post.images.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                          {post.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Requirement ${idx + 1}`}
                              className="w-24 h-24 object-cover rounded-lg bg-white border border-gray-200"
                              onError={(e) => e.target.src = 'https://via.placeholder.com/96?text=Image'}
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          {hasQuoted(post.id) && (
                            <span className="flex items-center text-green-400">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Quote Sent
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedPost(post)}
                          disabled={hasQuoted(post.id)}
                          className={`px-6 py-2 rounded-lg font-semibold transition-all ${hasQuoted(post.id)
                            ? 'bg-white border border-gray-200 text-gray-600 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-800'
                            }`}
                        >
                          {hasQuoted(post.id) ? 'Quoted' : 'Send Quote'}
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* My Quotes / Active Chats */}
              <h2 className="text-2xl font-bold">My Active Quotes</h2>
              <div className="space-y-4">
                {myQuotes.length === 0 ? (
                  <div className="text-center py-12 text-gray-600 glass-card rounded-2xl">
                    No active quotes. Start sending quotes to requests in the Market Feed!
                  </div>
                ) : (
                  myQuotes.map((quote) => (
                    <motion.div
                      key={quote.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-6 rounded-2xl hover:border-black/30 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold mb-1">Quote for Request #{quote.ad_id.slice(0, 8)}...</h3>
                          <p className="text-sm text-gray-600">Status: <span className={`font-semibold ${quote.status === 'accepted' ? 'text-green-400' :
                            quote.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                            }`}>{quote.status.toUpperCase()}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-indigo-600">₹{quote.price_total}</p>
                          <p className="text-sm text-gray-600">{quote.delivery_days} days delivery</p>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-4 bg-white border border-gray-200 p-3 rounded-lg">
                        "{quote.message}"
                      </p>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleOpenChat(quote)}
                          className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat with Customer
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* High Demand Categories */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  High Demand
                </h3>
                <div className="space-y-4">
                  {topCategories.map(([category, count], idx) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-gray-700">{category}</span>
                      </div>
                      <span className="text-xs text-indigo-600 font-bold">{count} requests</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* My Inventory Preview */}
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-indigo-600" />
                    My Inventory
                  </h3>
                  <button
                    onClick={() => setIsInventoryModalOpen(true)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Manage
                  </button>
                </div>
                <div className="space-y-3">
                  {myInventory.slice(0, 3).map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white border border-gray-200 transition-colors group">
                      <img
                        src={item.images?.[0] || 'https://via.placeholder.com/40?text=Prod'}
                        alt={item.product_name}
                        className="w-10 h-10 rounded-md object-cover bg-white border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-600">Stock: {item.stock}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-1 hover:text-black"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {myInventory.length === 0 && (
                    <p className="text-sm text-gray-600 text-center py-4">No items in inventory</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quote Modal */}
          <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
            <DialogContent className="bg-white border-gray-200 text-gray-900">
              <DialogHeader>
                <DialogTitle>Submit Quote for "{selectedPost?.title}"</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleQuoteSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Your Price (₹)</label>
                  <Input
                    type="number"
                    required
                    value={quoteForm.price}
                    onChange={e => setQuoteForm({ ...quoteForm, price: e.target.value })}
                    className="bg-white border border-gray-200 border-gray-200"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Delivery Time (Days)</label>
                  <Input
                    type="number"
                    required
                    value={quoteForm.delivery_days}
                    onChange={e => setQuoteForm({ ...quoteForm, delivery_days: e.target.value })}
                    className="bg-white border border-gray-200 border-gray-200"
                    placeholder="e.g. 7"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Message to Customer</label>
                  <Textarea
                    required
                    value={quoteForm.message}
                    onChange={e => setQuoteForm({ ...quoteForm, message: e.target.value })}
                    className="bg-white border border-gray-200 border-gray-200 h-32"
                    placeholder="Describe your offer..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitQuoteMutation.isPending}
                  className="w-full glow-button py-3 rounded-xl font-bold mt-4"
                >
                  {submitQuoteMutation.isPending ? 'Sending...' : 'Send Quote'}
                </button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Inventory Modal */}
          <Dialog open={isInventoryModalOpen} onOpenChange={setIsInventoryModalOpen}>
            <DialogContent className="bg-white border-gray-200 text-gray-900">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInventorySubmit} className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Product Name</label>
                  <Input
                    name="product_name"
                    defaultValue={editingItem?.product_name}
                    required
                    className="bg-white border border-gray-200 border-gray-200"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Description</label>
                  <Textarea
                    name="description"
                    defaultValue={editingItem?.description}
                    required
                    className="bg-white border border-gray-200 border-gray-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Price (₹)</label>
                    <Input
                      name="price"
                      type="number"
                      defaultValue={editingItem?.price}
                      required
                      className="bg-white border border-gray-200 border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Stock</label>
                    <Input
                      name="stock"
                      type="number"
                      defaultValue={editingItem?.stock}
                      required
                      className="bg-white border border-gray-200 border-gray-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Category</label>
                  <select
                    name="category"
                    defaultValue={editingItem?.category || categories[0]}
                    className="w-full bg-white border border-gray-200 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:border-indigo-600 outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-white">{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Product Image</label>
                  <Input
                    type="file"
                    name="image"
                    accept="image/*"
                    className="bg-white border border-gray-200 border-gray-200 cursor-pointer"
                  />
                  {editingItem?.images?.[0] && (
                    <p className="text-xs text-gray-600 mt-1">
                      Current: <a href={editingItem.images[0]} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">View Image</a>
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={createInventoryMutation.isPending || updateInventoryMutation.isPending || uploadingImage}
                  className="w-full glow-button py-3 rounded-xl font-bold mt-4 flex items-center justify-center gap-2"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (createInventoryMutation.isPending || updateInventoryMutation.isPending) ? 'Saving...' : 'Save Item'}
                </button>
              </form>
            </DialogContent>
          </Dialog>

          <ChatWindow
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            conversation={chatConversation}
            currentUserEmail={userEmail}
          />
        </div>
      </div>
    </ProtectedRoute >
  );
}

export default VendorDashboard;