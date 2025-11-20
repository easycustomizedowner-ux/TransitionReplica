import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Upload, Loader2 } from "lucide-react";
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
  {
    name: "Fashion & Apparel",
    examples: "Custom dresses, ethnic wear, cosplay, uniforms",
    icon: "👗"
  },
  {
    name: "Jewelry & Accessories",
    examples: "Rings, pendants, resin art",
    icon: "💍"
  },
  {
    name: "Furniture & Décor",
    examples: "Tables, wall art, interiors",
    icon: "🛋️"
  },
  {
    name: "Footwear",
    examples: "Sneakers, boots, heels",
    icon: "👟"
  },
  {
    name: "Gifting & Art",
    examples: "Frames, journals, handmade gifts",
    icon: "🎁"
  },
  {
    name: "Automotive",
    examples: "Seat covers, decals, car mods",
    icon: "🚗"
  },
  {
    name: "Tech & Gadgets",
    examples: "Phone cases, PC builds",
    icon: "📱"
  },
  {
    name: "Corporate & Branding",
    examples: "T-shirts, merchandise, packaging",
    icon: "🏢"
  },
  {
    name: "Other Custom Requests",
    examples: "Anything not listed",
    icon: "✨"
  }
];

export default function EditPostModal({ isOpen, onClose, post, onUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: post?.title || "",
    description: post?.description || "",
    category: post?.category || "",
    budget: post?.budget || "",
    images: post?.images || []
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploadedUrls = [];

    setIsLoading(true);
    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${Date.now()}_${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('ad-images')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('ad-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(data.publicUrl);
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload image. Please try again.');
      }
    }
    setIsLoading(false);

    setFormData({ ...formData, images: [...formData.images, ...uploadedUrls] });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.description || !formData.category || !formData.budget) {
      alert("Please fill in all required fields");
      return;
    }
    onUpdate(post.id, formData);
    onClose();
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card rounded-3xl p-4 sm:p-6 lg:p-8 max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4 sm:mb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold">Edit Requirement</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label htmlFor="edit-title" className="text-gray-900 mb-2 block">Product Title</Label>
            <Input
              id="edit-title"
              placeholder="e.g., Nike Air Jordan 1 High"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-white border border-gray-200 border-gray-200 text-gray-900"
            />
          </div>

          <div>
            <Label htmlFor="edit-description" className="text-gray-900 mb-2 block">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="Describe the product in detail"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-white border border-gray-200 border-gray-200 text-gray-900 min-h-32"
            />
          </div>

          <div>
            <Label className="text-gray-900 mb-2 block">Category</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.name })}
                  className={`p-3 rounded-lg text-left text-sm transition-all ${formData.category === cat.name
                    ? 'bg-black/20 border-2 border-[#CEFF00]'
                    : 'glass-card hover:border-[#CEFF00]/50'
                    }`}
                >
                  <span className="text-lg mr-2">{cat.icon}</span>
                  <span className="text-gray-900 font-semibold text-xs">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="edit-budget" className="text-gray-900 mb-2 block">Budget (₹)</Label>
            <Input
              id="edit-budget"
              type="number"
              placeholder="Enter your budget in Rupees"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="bg-white border border-gray-200 border-gray-200 text-gray-900 text-xl"
            />
          </div>

          <div>
            <Label className="text-gray-900 mb-2 block">Images</Label>
            <div className="border-2 border-dashed border-[#CEFF00]/30 rounded-xl p-6 text-center">
              <Upload className="w-10 h-10 text-[#CEFF00] mx-auto mb-3" />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="edit-image-upload"
                disabled={isLoading}
              />
              <label
                htmlFor="edit-image-upload"
                className={`glow-button px-4 py-2 rounded-lg cursor-pointer inline-block text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  'Choose Images'
                )}
              </label>
            </div>
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        images: formData.images.filter((_, i) => i !== index)
                      })}
                      className="absolute top-1 right-1 bg-red-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:bg-gray-1000 transition-opacity"
                    >
                      ×
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
            {isLoading ? 'Uploading...' : 'Update Requirement'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}