
import React from "react";
import { useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <div 
        className="min-h-screen bg-cover bg-center bg-fixed relative" 
        style={{ backgroundImage: 'url(https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/sign/site_imgs/clear-background.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJzaXRlX2ltZ3MvY2xlYXItYmFja2dyb3VuZC5wbmciLCJpYXQiOjE3NDExMDE0OTMsImV4cCI6MjM3MTgyMTQ5M30.k9JPVqmzmFtfxa8jbYpr1Hi3T4l2ZaHQZdPy2gGpgvk)' }}
      >
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]"></div>
        
        <Navigation />
        
        <main className="flex-grow flex items-center justify-center px-4 relative z-10">
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-lg shadow-gold-sm max-w-md w-full text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4 gold-text-shadow">404</h1>
            <p className="text-xl text-gray-600 mb-6">הדף המבוקש לא נמצא</p>
            <p className="text-gray-600 mb-8">
              נראה שהדף שחיפשת ({location.pathname}) לא קיים או הוסר.
            </p>
            <a 
              href="/" 
              className="bg-gold hover:bg-gold-dark text-white font-bold py-2 px-6 rounded-lg transition-all duration-300"
            >
              חזרה לדף הבית
            </a>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default NotFound;
