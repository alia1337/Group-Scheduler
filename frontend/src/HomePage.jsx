import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // Always redirect based on authentication status
    if (token) {
      navigate("/calendar", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);


  // This component just redirects, no UI needed
  return null;
}

export default HomePage;
