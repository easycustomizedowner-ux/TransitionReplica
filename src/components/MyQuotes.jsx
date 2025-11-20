import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Loader2, MessageCircle, Check, X, Eye, Package } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function MyQuotes({ userId, userRole, onOpenChat }) {
    const queryClient = useQueryClient();
    const [selectedQuote, setSelectedQuote] = useState(null);

    console.log("MyQuotes - userId:", userId, "userRole:", userRole);

    // Fetch quotes based on role
    const { data: quotes = [], isLoading, error } = useQuery({
        queryKey: ['my-quotes', userId, userRole],
        queryFn: async () => {
            if (!userId) return [];

            let query = supabase
                .from('quotes')
                .select(`
          *,
          ad:ad_id (
            id,
            title,
            description,
            budget_min,
            created_by,
            images
          ),
          vendor:vendor_id (display_name, email),
          customer:customer_id (display_name, email)
        `)
                .order('created_at', { ascending: false });

            // Filter by role
            if (userRole === 'customer') {
                query = query.eq('customer_id', userId);
            } else {
                query = query.eq('vendor_id', userId);
            }

            const { data, error } = await query;
            if (error) {
                console.error("MyQuotes query error:", error);
                throw error;
            }

            console.log("MyQuotes - fetched data:", data);

            return data.map(quote => ({
                ...quote,
                vendor_name: quote.vendor?.display_name,
                vendor_email: quote.vendor?.email,
                customer_name: quote.customer?.display_name,
                customer_email: quote.customer?.email,
                ad_title: quote.ad?.title,
                ad_budget: quote.ad?.budget_min
            }));
        },
        enabled: !!userId,
        refetchInterval: 5000, // Real-time updates every 5 seconds
    });

    // Accept quote mutation
    const acceptQuoteMutation = useMutation({
        mutationFn: async (quote) => {
            const { data, error } = await supabase.functions.invoke('accept_quote', {
                body: { quote_id: quote.id, customer_id: userId }
            });
            if (error) throw error;
            return data;
        },
        onSuccess: (data, quote) => {
            toast.success("Quote accepted! Chat thread created.");
            queryClient.invalidateQueries({ queryKey: ['my-quotes'] });
            queryClient.invalidateQueries({ queryKey: ['customer-quotes'] });

            // Auto-open chat if thread was created
            if (data?.thread_id && onOpenChat) {
                onOpenChat({
                    quote_id: quote.id,
                    otherUserEmail: quote.vendor_email,
                    otherUserName: quote.vendor_name,
                    vendor_id: quote.vendor_id,
                    customer_id: quote.customer_id
                });
            }
        },
        onError: (error) => {
            toast.error("Failed to accept quote: " + error.message);
        }
    });

    // Reject quote mutation
    const rejectQuoteMutation = useMutation({
        mutationFn: async (quoteId) => {
            const { error } = await supabase
                .from('quotes')
                .update({ status: 'rejected' })
                .eq('id', quoteId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Quote rejected");
            queryClient.invalidateQueries({ queryKey: ['my-quotes'] });
            queryClient.invalidateQueries({ queryKey: ['customer-quotes'] });
            setSelectedQuote(null);
        },
        onError: (error) => {
            toast.error("Failed to reject quote: " + error.message);
        }
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted': return 'bg-green-100 text-green-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Show error if any
    if (error) {
        return (
            <div className="glass-card p-12 rounded-2xl text-center">
                <Package className="w-16 h-16 text-red-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Quotes</h3>
                <p className="text-gray-600">{error.message}</p>
            </div>
        );
    }

    // Show message if userId is not available yet
    if (!userId) {
        return (
            <div className="glass-card p-12 rounded-2xl text-center">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading user information...</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (quotes.length === 0) {
        return (
            <div className="glass-card p-12 rounded-2xl text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quotes Yet</h3>
                <p className="text-gray-600">
                    {userRole === 'customer'
                        ? "You haven't received any quotes yet. Post a requirement to get started!"
                        : "You haven't submitted any quotes yet. Browse customer requirements to get started!"}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    {userRole === 'customer' ? 'Quotes Received' : 'Quotes Submitted'}
                </h2>
                <span className="text-sm text-gray-600">{quotes.length} total</span>
            </div>

            <div className="grid gap-4">
                {quotes.map((quote) => (
                    <motion.div
                        key={quote.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6 rounded-xl hover:shadow-md transition-shadow"
                    >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            {/* Quote Details */}
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                            {quote.ad_title || 'Untitled Ad'}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {userRole === 'customer'
                                                ? `From: ${quote.vendor_name || 'Unknown Vendor'}`
                                                : `For: ${quote.customer_name || 'Unknown Customer'}`}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                                        {quote.status.toUpperCase()}
                                    </span>
                                </div>

                                {quote.message && (
                                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">{quote.message}</p>
                                )}

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-600">Price:</span>
                                        <span className="ml-2 font-semibold text-indigo-600">₹{quote.price_total}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Delivery:</span>
                                        <span className="ml-2 font-semibold">{quote.delivery_days} days</span>
                                    </div>
                                    {quote.ad_budget && (
                                        <div>
                                            <span className="text-gray-600">Budget:</span>
                                            <span className="ml-2 font-semibold">₹{quote.ad_budget}</span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-gray-600">Submitted:</span>
                                        <span className="ml-2">{new Date(quote.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 min-w-[140px]">
                                {userRole === 'customer' && quote.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => acceptQuoteMutation.mutate(quote)}
                                            disabled={acceptQuoteMutation.isPending}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            <Check className="w-4 h-4" />
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => rejectQuoteMutation.mutate(quote.id)}
                                            disabled={rejectQuoteMutation.isPending}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                        >
                                            <X className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </>
                                )}

                                {quote.status === 'accepted' && onOpenChat && (
                                    <button
                                        onClick={() => onOpenChat({
                                            quote_id: quote.id,
                                            otherUserEmail: userRole === 'customer' ? quote.vendor_email : quote.customer_email,
                                            otherUserName: userRole === 'customer' ? quote.vendor_name : quote.customer_name,
                                            vendor_id: quote.vendor_id,
                                            customer_id: quote.customer_id
                                        })}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Open Chat
                                    </button>
                                )}

                                <button
                                    onClick={() => setSelectedQuote(selectedQuote?.id === quote.id ? null : quote)}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    {selectedQuote?.id === quote.id ? 'Hide' : 'Details'}
                                </button>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {selectedQuote?.id === quote.id && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-4 pt-4 border-t border-gray-200"
                            >
                                <h4 className="font-semibold mb-2">Full Message:</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.message || 'No message provided'}</p>

                                {quote.ad?.images && quote.ad.images.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="font-semibold mb-2">Ad Images:</h4>
                                        <div className="flex gap-2 overflow-x-auto">
                                            {quote.ad.images.map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={img}
                                                    alt={`Ad ${idx + 1}`}
                                                    className="w-24 h-24 object-cover rounded-lg"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
