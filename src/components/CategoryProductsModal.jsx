import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, ArrowLeft } from "lucide-react";

const categoryProducts = {
  Fashion: [
    { name: "Nike Air Jordan 1", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", price: "₹12,000" },
    { name: "Designer Dress", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400", price: "₹8,500" },
    { name: "Leather Jacket", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400", price: "₹15,000" },
    { name: "Designer Handbag", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400", price: "₹6,500" },
    { name: "Sunglasses", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400", price: "₹3,500" },
    { name: "Casual Sneakers", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400", price: "₹5,500" }
  ],
  Electronics: [
    { name: "MacBook Pro", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400", price: "₹1,20,000" },
    { name: "iPhone 15 Pro", image: "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=400", price: "₹1,35,000" },
    { name: "Sony Headphones", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", price: "₹25,000" },
    { name: "iPad Pro", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400", price: "₹85,000" },
    { name: "Smart Watch", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400", price: "₹45,000" },
    { name: "Camera DSLR", image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400", price: "₹95,000" }
  ],
  Furniture: [
    { name: "Modern Sofa Set", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400", price: "₹45,000" },
    { name: "Dining Table", image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400", price: "₹35,000" },
    { name: "Office Chair", image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400", price: "₹12,000" },
    { name: "King Size Bed", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400", price: "₹55,000" },
    { name: "Bookshelf", image: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400", price: "₹18,000" },
    { name: "Coffee Table", image: "https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=400", price: "₹8,500" }
  ],
  "Home & Kitchen": [
    { name: "Air Fryer", image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400", price: "₹8,500" },
    { name: "Coffee Maker", image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400", price: "₹12,000" },
    { name: "Kitchen Mixer", image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400", price: "₹15,000" },
    { name: "Cookware Set", image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400", price: "₹6,500" },
    { name: "Vacuum Cleaner", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400", price: "₹18,000" },
    { name: "Table Lamp", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400", price: "₹3,500" }
  ]
};

function CategoryProductsModal({ isOpen, onClose, category }) {
  const navigate = useNavigate();

  if (!isOpen || !category) return null;

  const products = categoryProducts[category] || [];

  const handlePostRequirement = () => {
    const userRole = localStorage.getItem('userRole');
    
    if (userRole === 'customer') {
      navigate(createPageUrl('CustomerDashboard'));
      onClose();
    } else {
      navigate(createPageUrl('GetStarted'));
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 overflow-y-auto">
        <div className="min-h-screen flex items-start justify-center p-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-card rounded-2xl p-4 md:p-6 max-w-6xl w-full"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#CEFF00]/20">
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 bg-[#CEFF00]/10 hover:bg-[#CEFF00]/20 rounded-lg transition-all group border border-[#CEFF00]/30"
              >
                <ArrowLeft className="w-5 h-5 text-[#CEFF00] group-hover:-translate-x-1 transition-transform" />
                <span className="text-[#CEFF00] font-semibold">Back to Home</span>
              </button>
              
              <button onClick={onClose} className="text-gray-400 hover:text-[#CEFF00] transition-colors p-2 hover:bg-white/5 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="neon-text">{category}</span> Products
              </h2>
              <p className="text-gray-400">{products.length} products available</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4 mb-6">
              {products.map((product, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  whileHover={{ scale: 1.05 }}
                  className="glass-card rounded-xl overflow-hidden hover:border-[#CEFF00] transition-all cursor-pointer group"
                >
                  <div className="relative h-28 sm:h-32 overflow-hidden bg-black/20">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2 sm:p-3">
                    <h3 className="text-xs sm:text-sm font-semibold mb-1 group-hover:text-[#CEFF00] transition-colors line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base font-bold text-[#CEFF00]">{product.price}</span>
                      <button className="p-1.5 bg-[#CEFF00]/10 rounded-lg hover:bg-[#CEFF00]/20 transition-colors">
                        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 text-[#CEFF00]" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center pt-4 border-t border-[#CEFF00]/20">
              <p className="text-gray-400 mb-3 text-sm">Can't find what you're looking for?</p>
              <button onClick={handlePostRequirement} className="glow-button px-6 py-2.5 rounded-lg font-semibold text-sm">
                Post Your Requirement
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

export default CategoryProductsModal;