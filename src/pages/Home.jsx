import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { 
  ShoppingBag, 
  Shield, 
  Zap, 
  Lock,
  ArrowRight,
  ChevronDown
} from "lucide-react";
import CategoryProductsModal from "../components/CategoryProductsModal";

const features = [
  {
    title: "Any Product, Sourced",
    description: "From shoes to furniture, electronics to clothing — vendors find what you need",
    icon: ShoppingBag
  },
  {
    title: "Verified Vendors",
    description: "Work with trusted sellers who source authentic products",
    icon: Shield
  },
  {
    title: "Real-Time Quotes",
    description: "Get competitive offers instantly and compare prices in real-time",
    icon: Zap
  },
  {
    title: "Secure Transactions",
    description: "Your orders and payments are protected every step of the way",
    icon: Lock
  }
];

const categories = [
  { 
    name: "Fashion", 
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800"
  },
  { 
    name: "Electronics", 
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"
  },
  { 
    name: "Furniture", 
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"
  },
  { 
    name: "Home & Kitchen", 
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800"
  }
];

const steps = [
  "Post exactly what product you want with photos, brand, quantity, and budget",
  "Receive competitive quotes from vendors who have or can source it",
  "Compare prices, delivery times, and vendor ratings in one place",
  "Chat with vendors, finalize your order, and get your product delivered"
];

function Home() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="overflow-hidden">
      {/* Fixed Navigation for Homepage */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-16 left-0 right-0 z-40 glass-card border-b border-[#CEFF00]/20 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-center space-x-3 sm:space-x-8 h-12 sm:h-14">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection('how-it-works')}
              className="text-xs sm:text-sm font-semibold text-gray-300 hover:text-[#CEFF00] transition-colors"
            >
              How It Works
            </motion.button>
            <div className="w-px h-4 sm:h-6 bg-[#CEFF00]/20"></div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection('categories')}
              className="text-xs sm:text-sm font-semibold text-gray-300 hover:text-[#CEFF00] transition-colors"
            >
              Any Product, Anytime
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-14">
        {/* Background Images */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
          <img 
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400" 
            alt="Shoes"
            className="absolute top-20 right-10 w-32 h-32 object-cover rounded-2xl floating-animation"
            style={{ animationDelay: '0s' }}
          />
          <img 
            src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400" 
            alt="Furniture"
            className="absolute top-40 left-20 w-40 h-40 object-cover rounded-2xl floating-animation"
            style={{ animationDelay: '1s' }}
          />
          <img 
            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" 
            alt="Electronics"
            className="absolute bottom-40 right-32 w-36 h-36 object-cover rounded-2xl floating-animation"
            style={{ animationDelay: '2s' }}
          />
          <img 
            src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400" 
            alt="Watch"
            className="absolute bottom-20 left-40 w-28 h-28 object-cover rounded-2xl floating-animation"
            style={{ animationDelay: '1.5s' }}
          />
          <img 
            src="https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400" 
            alt="Sneakers"
            className="absolute top-1/3 right-1/4 w-32 h-32 object-cover rounded-2xl floating-animation opacity-60"
            style={{ animationDelay: '0.5s' }}
          />
          <img 
            src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400" 
            alt="Laptop"
            className="absolute bottom-1/3 left-1/4 w-36 h-36 object-cover rounded-2xl floating-animation opacity-60"
            style={{ animationDelay: '1.8s' }}
          />
          <img 
            src="https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400" 
            alt="Perfume"
            className="absolute top-1/2 left-10 w-24 h-24 object-cover rounded-2xl floating-animation opacity-60"
            style={{ animationDelay: '2.5s' }}
          />
          <img 
            src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400" 
            alt="Sunglasses"
            className="absolute bottom-1/4 right-10 w-28 h-28 object-cover rounded-2xl floating-animation opacity-60"
            style={{ animationDelay: '1.2s' }}
          />
        </div>

        <div className="max-w-7xl mx-auto text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo/Brand Name */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 px-4 leading-tight">
              <span className="text-white">EASY</span>
              <span className="neon-text">CUSTOMIZED</span>
            </h1>

            {/* Tagline */}
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#CEFF00] font-semibold mb-8 sm:mb-12 px-4">
              Your Idea, Their Craft
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 px-4">
              <Link to={createPageUrl('GetStarted')}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="glow-button px-10 py-4 rounded-xl text-lg font-semibold flex items-center justify-center space-x-2 w-full sm:w-auto min-w-[200px]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToSection('why-choose')}
                className="glass-card px-10 py-4 rounded-xl text-lg font-semibold border-[#CEFF00]/30 hover:border-[#CEFF00] transition-colors w-full sm:w-auto min-w-[200px]"
              >
                Learn More
              </motion.button>
            </div>

            {/* Scroll indicator */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="cursor-pointer"
              onClick={() => scrollToSection('why-choose')}
            >
              <ChevronDown className="w-8 h-8 text-[#CEFF00] mx-auto" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose EASYCUSTOMIZED */}
      <section id="why-choose" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 px-2">
              Why Choose <span className="neon-text">EASYCUSTOMIZED</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-8 rounded-2xl hover:border-[#CEFF00]/50 transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-[#CEFF00]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#CEFF00]/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-[#CEFF00]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 px-2">
              Any Product, <span className="neon-text">Anytime</span>
            </h2>
            <p className="text-gray-400 text-lg sm:text-xl">Browse popular categories</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedCategory(category.name)}
                className="relative overflow-hidden rounded-3xl cursor-pointer group h-64"
              >
                {/* Category Image */}
                <img
                  src={category.image}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                
                {/* Category Name */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white group-hover:text-[#CEFF00] transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to explore products
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 px-2">
              How It <span className="neon-text">Works</span>
            </h2>
            <p className="text-gray-400 text-lg sm:text-xl">Get your product in 4 simple steps</p>
          </motion.div>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                className="glass-card p-4 sm:p-6 lg:p-8 rounded-2xl hover:border-[#CEFF00]/50 transition-all duration-300 flex items-start gap-3 sm:gap-4 lg:gap-6"
              >
                <motion.div 
                  className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-[#CEFF00] rounded-full flex items-center justify-center text-[#0D0D0D] font-bold text-lg sm:text-xl"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  {index + 1}
                </motion.div>
                <p className="text-sm sm:text-base lg:text-lg text-gray-300 flex-1 pt-1 sm:pt-2">{step}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 px-2">
              Ready to Get <span className="neon-text">Started?</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-8 sm:mb-12 px-2">
              Join thousands finding and selling products through our reverse marketplace
            </p>
            <div className="flex justify-center">
              <Link to={createPageUrl('GetStarted')}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="glow-button px-10 py-4 rounded-xl text-lg font-semibold flex items-center space-x-2"
                >
                  <span>Get Started Now</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Products Modal */}
      <CategoryProductsModal
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        category={selectedCategory}
      />
    </div>
  );
}

export default Home;