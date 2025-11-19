import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, MessageCircle, Star, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ItemDetailsModal({ isOpen, onClose, item, onRequest }) {
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  const handleRequest = () => {
    if (quantity < 1) {
      alert("Please enter a valid quantity");
      return;
    }
    onRequest({
      item_id: item.id,
      item_name: item.product_name,
      vendor_email: item.vendor_email,
      vendor_name: item.vendor_name,
      quantity,
      message
    });
    setQuantity(1);
    setMessage("");
  };

  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto">
        <div className="min-h-screen flex items-start justify-center p-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-card rounded-3xl p-4 sm:p-6 lg:p-8 max-w-5xl w-full"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold">{item.product_name}</h2>
                {item.is_featured && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-[#CEFF00]/20 text-[#CEFF00] rounded-full text-xs">
                    <Star className="w-3 h-3 fill-[#CEFF00]" />
                    Featured
                  </span>
                )}
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-[#CEFF00] transition-colors p-2 hover:bg-white/5 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Images Section */}
              <div>
                {item.images && item.images.length > 0 ? (
                  <>
                    <div className="relative rounded-2xl overflow-hidden mb-4 aspect-square bg-black/20">
                      <img
                        src={item.images[selectedImage]}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.src = 'https://via.placeholder.com/400?text=Product'}
                      />
                    </div>
                    {item.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {item.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImage(idx)}
                            className={`rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImage === idx 
                                ? 'border-[#CEFF00]' 
                                : 'border-transparent hover:border-[#CEFF00]/50'
                            }`}
                          >
                            <img
                              src={img}
                              alt={`View ${idx + 1}`}
                              className="w-full h-20 object-cover"
                              onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=Img'}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl bg-black/20 aspect-square flex items-center justify-center">
                    <Package className="w-24 h-24 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-4xl font-bold text-[#CEFF00]">₹{item.price}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {item.stock > 0 ? (
                          <span className="text-green-400">In Stock ({item.stock} available)</span>
                        ) : (
                          <span className="text-red-400">Out of Stock</span>
                        )}
                      </p>
                    </div>
                    <span className="px-4 py-2 bg-[#CEFF00]/20 text-[#CEFF00] rounded-xl text-sm">
                      {item.category}
                    </span>
                  </div>

                  <div className="glass-card p-4 rounded-xl mb-4">
                    <p className="text-sm text-gray-400 mb-1">Sold by</p>
                    <p className="text-lg font-semibold">{item.vendor_name}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-300 leading-relaxed">{item.description}</p>
                </div>

                {/* Request Form */}
                <div className="glass-card p-5 rounded-2xl space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-[#CEFF00]" />
                    Request this Item
                  </h3>

                  <div>
                    <Label className="text-white mb-2 block">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      max={item.stock}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="bg-white/5 border-[#CEFF00]/20 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Message (Optional)</Label>
                    <Textarea
                      placeholder="Any special requirements or questions..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="bg-white/5 border-[#CEFF00]/20 text-white min-h-20"
                    />
                  </div>

                  <button
                    onClick={handleRequest}
                    disabled={item.stock === 0}
                    className="w-full py-3 glow-button rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Send Request to Vendor
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}