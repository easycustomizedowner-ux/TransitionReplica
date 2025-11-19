import React, { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Loader2, X, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

const categories = [
  { name: "Fashion & Apparel", icon: "👗" },
  { name: "Jewelry & Accessories", icon: "💍" },
  { name: "Furniture & Décor", icon: "🛋️" },
  { name: "Footwear", icon: "👟" },
  { name: "Gifting & Art", icon: "🎁" },
  { name: "Automotive", icon: "🚗" },
  { name: "Tech & Gadgets", icon: "📱" },
  { name: "Corporate & Branding", icon: "🏢" },
  { name: "Other Custom Requests", icon: "✨" }
];

export default function VendorInventoryForm({ isOpen, onClose, item, onSubmit }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_name: item?.product_name || "",
    description: item?.description || "",
    category: item?.category || "",
    price: item?.price || "",
    stock: item?.stock || "",
    images: item?.images || [],
    is_featured: item?.is_featured || false
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setIsLoading(true);

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${Date.now()}_${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vendor-inventory')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('vendor-inventory')
          .getPublicUrl(filePath);

        setFormData(prev => ({ ...prev, images: [...prev.images, data.publicUrl] }));
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload image');
      }
    }
    setIsLoading(false);
  };

  const handleSubmit = () => {
    if (!formData.product_name || !formData.description || !formData.category ||
      !formData.price || !formData.stock) {
      alert("Please fill in all required fields");
      return;
    }
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card rounded-3xl p-4 sm:p-6 lg:p-8 max-w-3xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4 sm:mb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            {item ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">Product Name *</Label>
              <Input
                placeholder="e.g., Custom T-Shirt"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                className="bg-white/5 border-[#CEFF00]/20 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Price (₹) *</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="bg-white/5 border-[#CEFF00]/20 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-white mb-2 block">Description *</Label>
            <Textarea
              placeholder="Describe your product..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-white/5 border-[#CEFF00]/20 text-white min-h-24"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">Stock Quantity *</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="bg-white/5 border-[#CEFF00]/20 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block flex items-center gap-2">
                <span>Featured Item</span>
                <Star className="w-4 h-4 text-[#CEFF00]" />
              </Label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                className={`w-full h-10 rounded-lg flex items-center justify-center gap-2 transition-all ${formData.is_featured
                  ? 'bg-[#CEFF00]/20 border-2 border-[#CEFF00]'
                  : 'bg-white/5 border border-[#CEFF00]/20'
                  }`}
              >
                <Star className={`w-4 h-4 ${formData.is_featured ? 'fill-[#CEFF00] text-[#CEFF00]' : 'text-gray-400'}`} />
                <span className="text-white">{formData.is_featured ? 'Featured' : 'Not Featured'}</span>
              </button>
            </div>
          </div>

          <div>
            <Label className="text-white mb-2 block">Category *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.name })}
                  className={`p-3 rounded-lg text-left text-xs transition-all ${formData.category === cat.name
                    ? 'bg-[#CEFF00]/20 border-2 border-[#CEFF00]'
                    : 'glass-card hover:border-[#CEFF00]/50'
                    }`}
                >
                  <span className="text-lg mr-1">{cat.icon}</span>
                  <span className="text-white font-semibold">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-white mb-2 block">Product Images</Label>
            <div className="border-2 border-dashed border-[#CEFF00]/30 rounded-xl p-6 text-center">
              <Upload className="w-10 h-10 text-[#CEFF00] mx-auto mb-3" />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="inventory-image-upload"
                disabled={isLoading}
              />
              <label
                htmlFor="inventory-image-upload"
                className={`glow-button px-4 py-2 rounded-lg cursor-pointer inline-block text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  'Upload Images'
                )}
              </label>
            </div>
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                      onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=Image'}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        images: formData.images.filter((_, i) => i !== index)
                      })}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 glass-card rounded-xl font-semibold hover:border-[#CEFF00]/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 py-3 glow-button rounded-xl font-semibold disabled:opacity-50"
          >
            {item ? 'Update Item' : 'Add to Inventory'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}