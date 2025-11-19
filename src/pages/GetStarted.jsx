import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

function GetStarted() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Auth page
    navigate(createPageUrl('Auth'));
  }, [navigate]);

  return null;
}

export default GetStarted;