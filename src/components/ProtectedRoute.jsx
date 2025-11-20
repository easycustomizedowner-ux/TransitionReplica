import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children, requiredRole }) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  const checkAuth = useCallback(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');

    // Check if user is authenticated
    if (!isAuthenticated || isAuthenticated !== 'true') {
      navigate(createPageUrl('Auth'), { replace: true });
      return;
    }

    // Check if all required data exists
    if (!userEmail || !userRole || !userName) {
      localStorage.clear();
      navigate(createPageUrl('Auth'), { replace: true });
      return;
    }

    // Check if user has the required role for this page
    if (requiredRole && userRole !== requiredRole) {
      // Redirect to correct dashboard
      if (userRole === 'customer') {
        navigate(createPageUrl('CustomerDashboard'), { replace: true });
      } else {
        navigate(createPageUrl('VendorDashboard'), { replace: true });
      }
      return;
    }

    setIsChecking(false);
  }, [navigate, requiredRole]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return children;
}