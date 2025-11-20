import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageCircle, Eye, Package, Loader2, Edit, Trash2, ShoppingBag, Search, Star, Filter as FilterIcon } from "lucide-react";
import PostRequirementModal from "../components/PostRequirementModal";
import EditPostModal from "../components/EditPostModal";
import ItemDetailsModal from "../components/ItemDetailsModal";
import ChatWindow from "../components/ChatWindow";
import ProtectedRoute from "../components/ProtectedRoute";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

function CustomerDashboard() {
  const queryClient = useQueryClient();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [chatConversation, setChatConversation] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isItemDetailsOpen, setIsItemDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [userLoading, setUserLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      console.log("CustomerDashboard: Starting getUser...");
      try {
        // First try to get from localStorage (set by Auth.jsx)
        const storedEmail = localStorage.getItem('userEmail');
        const storedName = localStorage.getItem('userName');
        console.log("CustomerDashboard: localStorage values:", { storedEmail, storedName });

        // Then get session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        console.log("CustomerDashboard: Supabase session:", session?.user?.id);

        if (session?.user) {
          setUserId(session.user.id);
          setUserEmail(storedEmail || session.user.email);
          setUserName(storedName || "User");
          console.log("CustomerDashboard: User set successfully");
        } else {
          console.error("CustomerDashboard: No session found");
          // If no session, clear localStorage and redirect will happen via ProtectedRoute
        }
      } catch (error) {
        console.error("CustomerDashboard: Error fetching user:", error);
      } finally {
        console.log("CustomerDashboard: Setting userLoading to false");
        setUserLoading(false);
      }
    };

    getUser();
  }, []);

  console.log("CustomerDashboard: Render - userLoading:", userLoading, "userId:", userId);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['customer-posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(post => ({
        ...post,
        budget: post.budget_min // Map for frontend compatibility
      }));
    },
    enabled: !!userId,
  });

  const { data: allQuotes = [] } = useQuery({
    queryKey: ['customer-quotes', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          vendor:vendor_id (display_name, email),
          ad:ad_id (created_by)
        `)
        .eq('ad.created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(quote => ({
        ...quote,
        vendor_name: quote.vendor?.display_name,
        vendor_email: quote.vendor?.email
      }));
    },
    enabled: !!userId,
  });

  const { data: vendorInventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['vendor-inventory-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_inventory')
        .select(`
          *,
          vendor:vendor_id (display_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(item => ({
        ...item,
        vendor_name: item.vendor?.display_name
      }));
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      const { data, error } = await supabase.from('ads').insert({
        created_by: userId,
        title: postData.title,
        description: postData.description,
        budget_min: postData.budget,
        budget_max: postData.budget, // Simplified for now
        category: postData.category,
        images: postData.images || [],
        status: 'open'
      }).select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-posts'] });
      setIsPostModalOpen(false);
      toast.success("Requirement posted successfully");
    },
    onError: (error) => {
      toast.error("Failed to post requirement: " + error.message);
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from('ads').update({
        title: data.title,
        description: data.description,
        budget_min: data.budget,
        budget_max: data.budget,
        category: data.category,
        images: data.images
      }).eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-posts'] });
      setIsEditModalOpen(false);
      setEditingPost(null);
      toast.success("Requirement updated");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
      const { error } = await supabase.from('ads').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-posts'] });
      queryClient.invalidateQueries({ queryKey: ['customer-quotes'] });
      setDeleteConfirm(null);
      toast.success("Requirement deleted");
    },
  });

  // Simplified Item Request - just start a chat for now
  const createItemRequestMutation = useMutation({
    mutationFn: async (item) => {
      // Check if thread exists
      const { data: existingThreads } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('customer_id', userId)
        .eq('vendor_id', item.vendor_id);

      let threadId;

      if (existingThreads && existingThreads.length > 0) {
        threadId = existingThreads[0].id;
      } else {
        // Create new thread (requires a quote_id usually, but we might need to relax that or create a dummy quote? 
        // For now, let's assume we need a quote. 
        // Actually, let's just create a thread without quote_id if possible, or make quote_id nullable in schema.
        // I'll assume quote_id is nullable for general chats or item requests.
        // Wait, my schema said quote_id is NOT NULL.
        // I should probably create a 'pending' quote for this item request automatically.

        const { data: quote, error: quoteError } = await supabase.from('quotes').insert({
          ad_id: null, // This is an item request, not an ad response. Schema issue?
          // My schema links quotes to ads. 
          // Maybe I should create a dummy ad for "Item Request: Product Name"?
          // Or better, relax the schema constraint.
          // Since I can't change schema easily now without migration, I'll create a dummy ad.

          // Actually, let's look at the schema again.
          // quotes.ad_id references ads.id.

          // Alternative: Just use a direct message if I can.
          // But chat_threads references quotes.

          // Workaround: Create a "Direct Inquiry" Ad automatically.
        }).select();

        // This is getting complicated. 
        // Let's just notify the user that this feature is "Coming Soon" or simplified.
        // Or, I can just create a thread if I make quote_id nullable.
        // I'll try to insert with null quote_id and see if it fails (it will).

        // Let's skip the item request logic for now and focus on the main flow.
        // Or I'll just log it.

        throw new Error("Item request feature requires schema update");
      }
    },
    onSuccess: (data) => {
      // ...
    },
  });

  const acceptQuoteMutation = useMutation({
    mutationFn: async (quote) => {
      const { data, error } = await supabase.functions.invoke('accept_quote', {
        body: { quote_id: quote.id, customer_id: userId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Quote accepted!");
      queryClient.invalidateQueries({ queryKey: ['customer-quotes'] });
      // Optionally open chat here if we get a thread_id
      if (data?.thread_id) {
        // We need to fetch the thread details or just open the chat window with the right context
        // For now, just closing the modal and letting them click 'Chat' is fine, or we can auto-open.
        // Let's auto-open if we have the quote details still.
        // But selectedPost might be null if we close it.
      }
    },
    onError: (error) => {
      toast.error("Failed to accept quote: " + error.message);
    }
  });

  const handlePostSubmit = (formData) => {
    createPostMutation.mutate(formData);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (postId, data) => {
    updatePostMutation.mutate({ id: postId, data });
  };

  const handleDelete = (post) => {
    setDeleteConfirm(post);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deletePostMutation.mutate(deleteConfirm.id);
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setIsItemDetailsOpen(true);
  };

  const handleItemRequest = (requestData) => {
    // createItemRequestMutation.mutate(requestData);
    toast.info("Direct item requests coming soon! Please post a requirement instead.");
    setIsItemDetailsOpen(false);
  };

  const filteredInventory = vendorInventory
    .filter(item => {
      const matchesSearch = item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
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

  const handleViewQuotes = (post) => {
    setSelectedPost(post);
  };

  const handleOpenChat = (quote) => {
    setChatConversation({
      quote_id: quote.id,
      otherUserEmail: quote.vendor_email,
      otherUserName: quote.vendor_name,
      vendor_id: quote.vendor_id,
      customer_id: quote.customer_id
    });
    setIsChatOpen(true);
  };

  const getQuotesForPost = (postId) => {
    return allQuotes.filter(quote => quote.ad_id === postId);
  };

  const postQuotes = selectedPost ? getQuotesForPost(selectedPost.id) : [];

  return (
    <ProtectedRoute requiredRole="customer">
      <div className="min-h-screen bg-white px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome, <span className="text-indigo-600">{userName}</span>
              </h1>
              <p className="text-gray-600">Manage your product requests and quotes</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPostModalOpen(true)}
              className="glow-button px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 mt-4 md:mt-0"
            >
              <Plus className="w-5 h-5" />
              <span>Post New Requirement</span>
            </motion.button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Requests</p>
                  <p className="text-3xl font-bold">{posts.length}</p>
                </div>
                <Package className="w-12 h-12 text-indigo-600" />
              </div>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Quotes</p>
                  <p className="text-3xl font-bold">{allQuotes.length}</p>
                </div>
                <Eye className="w-12 h-12 text-indigo-600" />
              </div>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Active Chats</p>
                  <p className="text-3xl font-bold">
                    {new Set(allQuotes.map(q => q.vendor_email)).size}
                  </p>
                </div>
                <MessageCircle className="w-12 h-12 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Browse Vendor Inventory */}
          <div className="mb-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <ShoppingBag className="w-8 h-8 text-indigo-600" />
                  Browse Vendor Inventory
                </h2>
                <p className="text-gray-600">Discover pre-listed items from vendors</p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="glass-card p-4 rounded-2xl mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border border-gray-200 border-gray-200 text-gray-900 pl-11"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-10 bg-white border border-gray-200 border border-gray-200 text-gray-900 rounded-lg px-4 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="all" className="bg-white">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-white">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inventory Grid */}
            {inventoryLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="glass-card p-12 rounded-2xl text-center">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'No items match your search'
                    : 'No items available yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredInventory.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => handleItemClick(item)}
                    className="glass-card rounded-2xl overflow-hidden hover:border-black transition-all cursor-pointer group"
                  >
                    <div className="relative h-40 bg-gray-200">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.product_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => e.target.src = 'https://via.placeholder.com/400?text=Product'}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                      {item.is_featured && (
                        <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-semibold">
                          <Star className="w-3 h-3 fillbg-gray-50" />
                        </div>
                      )}
                      {item.stock === 0 && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <span className="text-red-400 font-bold">Out of Stock</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-1 group-hover:text-black transition-colors mb-1">
                        {item.product_name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2">{item.category}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-indigo-600">₹{item.price}</p>
                        <p className="text-xs text-gray-600">by {item.vendor_name}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* My Requests */}
          <div>
            <h2 className="text-2xl font-bold mb-6">My Custom Requests</h2>
            {postsLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
              </div>
            ) : posts.length === 0 ? (
              <div className="glass-card p-12 rounded-2xl text-center">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-4">You haven't posted any requests yet</p>
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="glow-button px-6 py-3 rounded-xl font-semibold"
                >
                  Post Your First Request
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => {
                  const quotesCount = getQuotesForPost(post.id).length;
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-6 rounded-2xl hover:border-black/50 transition-all"
                    >
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold line-clamp-2 flex-1 pr-2">{post.title}</h3>
                          <span className="px-2 py-1 bg-gray-200 text-black text-xs rounded-full flex-shrink-0">
                            {post.category}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.description}</p>
                        {post.images && post.images.length > 0 && (
                          <div className="flex gap-2 mb-3 overflow-x-auto">
                            {post.images.slice(0, 3).map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`${post.title} ${idx + 1}`}
                                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                                onError={(e) => e.target.src = 'https://via.placeholder.com/96?text=Image'}
                              />
                            ))}
                            {post.images.length > 3 && (
                              <div className="w-24 h-24 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-600">
                                +{post.images.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-indigo-600">₹{post.budget}</span>
                        <span className="text-sm text-gray-600">{quotesCount} quotes</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <button
                          onClick={() => handleEdit(post)}
                          className="py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg font-semibold hover:bg-blue-500/20 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          className="py-2 bg-red-500/10 border border-red-500/30 rounded-lg font-semibold hover:bg-red-500/20 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                      <button
                        onClick={() => handleViewQuotes(post)}
                        className="w-full py-2 bg-black/10 border border-indigo-200/30 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Quotes</span>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modals */}
          <PostRequirementModal
            isOpen={isPostModalOpen}
            onClose={() => setIsPostModalOpen(false)}
            onSubmit={handlePostSubmit}
          />

          <EditPostModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingPost(null);
            }}
            post={editingPost}
            onUpdate={handleUpdate}
          />

          {/* Delete Confirmation Dialog */}
          <AnimatePresence>
            {deleteConfirm && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card rounded-2xl p-6 max-w-md w-full"
                >
                  <h3 className="text-xl font-bold mb-4">Delete Requirement?</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 py-2 glass-card rounded-lg font-semibold hover:border-black/50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Quotes Dialog */}
          <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
            <DialogContent className="bg-white border-gray-200 max-w-3xl text-gray-900">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  Quotes for "{selectedPost?.title}"
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {postQuotes.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No quotes yet</p>
                ) : (
                  postQuotes.map((quote) => (
                    <div key={quote.id} className="glass-card p-6 rounded-2xl">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold">{quote.vendor_name}</h4>
                          <p className="text-sm text-gray-600">{quote.vendor_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600">₹{quote.price_total}</p>
                          <p className="text-sm text-gray-600">{quote.delivery_days} days</p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4">{quote.message}</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedPost(null);
                            handleOpenChat(quote);
                          }}
                          className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Chat</span>
                        </button>
                        {quote.status !== 'accepted' && (
                          <button
                            onClick={() => acceptQuoteMutation.mutate(quote)}
                            disabled={acceptQuoteMutation.isPending}
                            className="flex-1 py-2 glow-button rounded-lg font-semibold flex items-center justify-center space-x-2"
                          >
                            {acceptQuoteMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <span>Accept Quote</span>
                            )}
                          </button>
                        )}
                        {quote.status === 'accepted' && (
                          <div className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg font-semibold flex items-center justify-center">
                            Accepted
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          <ItemDetailsModal
            isOpen={isItemDetailsOpen}
            onClose={() => {
              setIsItemDetailsOpen(false);
              setSelectedItem(null);
            }}
            item={selectedItem}
            onRequest={handleItemRequest}
          />

          <ChatWindow
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            conversation={chatConversation}
            currentUserEmail={userEmail}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default CustomerDashboard;