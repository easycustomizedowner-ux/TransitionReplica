
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Menu, X, Home, ShoppingBag, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatProvider } from "@/components/ChatContext";
import { supabase } from "@/lib/supabase";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  const checkAuth = () => {
    const isAuth = localStorage.getItem('isAuthenticated');
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    const role = localStorage.getItem('userRole');

    if (isAuth && email && name && role) {
      setUser({ email, full_name: name, role });
    } else {
      setUser(null);
    }
  };

  const handleLogout = async () => {
    // Clear Supabase session
    await supabase.auth.signOut();

    // Clear localStorage
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAuthenticated');

    setUser(null);
    navigate(createPageUrl('Auth'), { replace: true });
  };

  const isActive = (pageName) => location.pathname === createPageUrl(pageName);

  return (
    <ChatProvider>
      <div className="min-h-screen bg-white text-gray-900">
        <style>{`
          @keyframes neon-glow {
            0%, 100% { filter: drop-shadow(0 0 8px #CEFF00) drop-shadow(0 0 16px #CEFF00); }
            50% { filter: drop-shadow(0 0 12px #CEFF00) drop-shadow(0 0 24px #CEFF00); }
          }
          .neon-text {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 800;
          }
          .glass-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 0, 0, 0.1);
          }
          .glow-button {
            background: #000;
            color: #fff;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
          }
          .glow-button:hover {
            background: #1a1a1a;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            transform: translateY(-2px);
          }
          .floating-animation {
            animation: float 6s ease-in-out infinite;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
        `}</style>

        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to={createPageUrl('Home')} className="flex items-center space-x-1 sm:space-x-2">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">EASY</span>
                <span className="text-lg sm:text-xl md:text-2xl font-bold neon-text">CUSTOMIZED</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-6">
                <Link
                  to={createPageUrl('Home')}
                  className={`flex items-center space-x-2 text-gray-700 hover:text-black transition-colors ${isActive('Home') ? 'text-black font-semibold' : ''}`}
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Link>

                {user && user.role && (
                  <>
                    {user.role === 'customer' && (
                      <Link
                        to={createPageUrl('CustomerDashboard')}
                        className={`flex items-center space-x-2 text-gray-700 hover:text-black transition-colors ${isActive('CustomerDashboard') ? 'text-black font-semibold' : ''}`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>My Dashboard</span>
                      </Link>
                    )}
                    {user.role === 'vendor' && (
                      <Link
                        to={createPageUrl('VendorDashboard')}
                        className={`flex items-center space-x-2 text-gray-700 hover:text-black transition-colors ${isActive('VendorDashboard') ? 'text-black font-semibold' : ''}`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Vendor Dashboard</span>
                      </Link>
                    )}
                  </>
                )}

                {!user ? (
                  <Link to={createPageUrl('Auth')}>
                    <button className="glow-button px-6 py-2 rounded-lg">
                      Get Started
                    </button>
                  </Link>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{user.full_name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white border-gray-200">
                      <DropdownMenuItem onClick={handleLogout} className="text-gray-900 hover:bg-gray-100 cursor-pointer">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden text-gray-900 hover:text-black transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden glass-card border-t border-gray-200">
              <div className="px-4 pt-2 pb-4 space-y-2">
                <Link
                  to={createPageUrl('Home')}
                  className="block py-2 text-gray-700 hover:text-black transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                {user && user.role && (
                  <>
                    {user.role === 'customer' && (
                      <Link
                        to={createPageUrl('CustomerDashboard')}
                        className="block py-2 text-gray-700 hover:text-black transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Dashboard
                      </Link>
                    )}
                    {user.role === 'vendor' && (
                      <Link
                        to={createPageUrl('VendorDashboard')}
                        className="block py-2 text-gray-700 hover:text-black transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Vendor Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left py-2 text-gray-700 hover:text-black transition-colors"
                    >
                      Logout
                    </button>
                  </>
                )}
                {!user && (
                  <Link
                    to={createPageUrl('Auth')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <button className="glow-button w-full px-6 py-2 rounded-lg mt-2">
                      Get Started
                    </button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main className="pt-16">
          {children}
        </main>

        {/* Footer - Only on Home page */}
        {currentPageName === 'Home' && (
          <footer className="glass-card border-t border-gray-200 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center space-x-2 mb-4 md:mb-0">
                  <span className="text-lg font-bold text-gray-900">EASY</span>
                  <span className="text-lg font-bold neon-text">CUSTOMIZED</span>
                </div>
                <p className="text-gray-400 text-sm text-center sm:text-left">
                  © 2024 EASYCUSTOMIZED. Your Idea, Their Craft.
                </p>
              </div>
            </div>
          </footer>
        )}
      </div>
    </ChatProvider>
  );
}
