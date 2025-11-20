import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, ArrowRight, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Added Dialog imports
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

export default function PostRequirementModal({ isOpen, onClose, onSubmit }) { // Changed to default export
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
    budget: "",
    images: []
  });

  const handleNext = () => {
    if (step === 1 && !formData.category) {
      alert("Please select a category");
      return;
    }
    if (step === 2 && (!formData.title || !formData.description)) {
      alert("Please fill in all fields");
      return;
    }
    if (step === 3 && !formData.budget) {
      alert("Please enter your budget");
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({ category: "", title: "", description: "", budget: "", images: [] });
    setStep(1);
    onClose();
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploadedUrls = [];

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

    setFormData({ ...formData, images: [...formData.images, ...uploadedUrls] });
  };

  // Dialog component handles `isOpen` prop, so `if (!isOpen) return null;` is no longer needed.
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card rounded-3xl p-4 sm:p-6 lg:p-8 max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4 sm:mb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold">Post New Requirement</DialogTitle>
          {/* DialogContent usually provides its own close button. Removing the custom one
              to avoid duplicates and rely on the Dialog's default behavior and styling. */}
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold transition-colors ${s === step
                  ? "bg-[#CEFF00] text-[#0D0D0D]"
                  : s < step
                    ? "bg-[#CEFF00]/30 text-white"
                    : "bg-white/10 text-gray-400"
                  }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`h-1 w-6 sm:w-12 mx-1 sm:mx-2 transition-colors ${s < step ? "bg-[#CEFF00]" : "bg-white/10"
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Category */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Select Category</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.name}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setFormData({ ...formData, category: cat.name });
                      setStep(2);
                    }}
                    className={`p-4 rounded-xl text-left transition-all ${formData.category === cat.name
                      ? 'bg-[#CEFF00]/20 border-2 border-[#CEFF00]'
                      : 'glass-card hover:border-[#CEFF00]/50'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white mb-1 text-sm">{cat.name}</h4>
                        <p className="text-xs text-gray-400 line-clamp-2">{cat.examples}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Description */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Describe Your Product</h3>
              <div>
                <Label htmlFor="title" className="text-white mb-2 block">Product Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Nike Air Jordan 1 High"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-white/5 border-[#CEFF00]/20 text-white"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-white mb-2 block">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the product in detail (brand, size, color, etc.)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-white/5 border-[#CEFF00]/20 text-white min-h-32"
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Budget */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Set Your Budget</h3>
              <div>
                <Label htmlFor="budget" className="text-white mb-2 block">Budget (₹)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="Enter your budget in Rupees"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="bg-white/5 border-[#CEFF00]/20 text-white text-2xl"
                />
              </div>
            </motion.div>
          )}

          {/* Step 4: Images */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Upload Images (Optional)</h3>
              <div className="border-2 border-dashed border-[#CEFF00]/30 rounded-2xl p-8 text-center">
                <Upload className="w-12 h-12 text-[#CEFF00] mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Upload product images or reference photos</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="glow-button px-6 py-2 rounded-lg cursor-pointer inline-block">
                  Choose Images
                </label>
              </div>
              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          images: formData.images.filter((_, i) => i !== index)
                        })}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 glass-card rounded-xl font-semibold hover:border-[#CEFF00]/50 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={handleNext}
              id="next-button"
              className="flex-1 py-3 glow-button rounded-xl font-semibold flex items-center justify-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              id="submit-post-button"
              className="flex-1 py-3 glow-button rounded-xl font-semibold"
            >
              Post Requirement
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}