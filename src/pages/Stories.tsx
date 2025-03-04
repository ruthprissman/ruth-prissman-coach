
import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { createClient } from '@supabase/supabase-js';
import { FileDown, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StorySubscriptionForm } from '@/components/StorySubscriptionForm';

// Supabase configuration
const supabaseUrl = 'https://uwqwlltrfvokjlaufguz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cXdsbHRyZnZva2psYXVmZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjU0MjYsImV4cCI6MjA1NjQ0MTQyNn0.G2JhvsEw4Q24vgt9SS9_nOMPtOdOqTGpus8zEJ5USD8';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Story {
  id: number;
  title: string;
  description: string;
  pdf_url: string;
  image_url: string;
  published_at: string;
}

const Stories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .order('published_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (data) {
          console.log('Fetched stories:', data);
          setStories(data);
        }
      } catch (err: any) {
        console.error('Error fetching stories:', err);
        setError(err.message || 'אירעה שגיאה בטעינת הסיפורים');
        toast({
          variant: "destructive",
          title: "שגיאה בטעינת הסיפורים",
          description: "לא ניתן היה לטעון את הסיפורים כרגע. אנא נסו שוב מאוחר יותר.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const handleOpenPDF = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadPDF = (url: string, title: string) => {
    // Open in new tab instead of downloading directly
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-white">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-20" 
        style={{ 
          backgroundImage: "url('https://www.dropbox.com/scl/fi/mn961lxdmrzb3hu61jr8c/clear-background.jpg?rlkey=te75ba634sz277355u5onqvuy&st=qxb55gpi&raw=1')" 
        }}
      />
      
      <Navigation />
      
      <main className="flex-grow pt-24 pb-12 px-4 z-10">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-alef text-center text-[#4A235A] mb-10 gold-text-shadow">
            סיפורים
          </h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-8 text-center">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white/80 rounded-lg shadow-md p-6 flex flex-col h-full animate-pulse">
                  <Skeleton className="h-40 w-full rounded-md mb-4" />
                  <Skeleton className="h-7 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3 mb-6" />
                  <div className="flex justify-between mt-auto">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p className="text-xl">אין סיפורים להצגה כרגע.</p>
              <p className="mt-2">סיפורים חדשים יתווספו בקרוב.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stories.map((story) => (
                <div 
                  key={story.id} 
                  className="bg-white/80 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 flex flex-col h-full border border-gray-100"
                >
                  <div className="mb-4 aspect-[3/2] overflow-hidden rounded-md">
                    <img 
                      src={story.image_url} 
                      alt={story.title} 
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  
                  <h2 className="text-xl font-alef font-bold text-[#4A235A] mb-2 text-right">
                    {story.title}
                  </h2>
                  
                  <p className="text-gray-700 mb-4 text-right line-clamp-3">
                    {story.description}
                  </p>
                  
                  <p className="text-sm text-gray-500 mb-4 text-right">
                    {formatDate(story.published_at)}
                  </p>
                  
                  <div className="flex justify-between mt-auto">
                    <Button
                      variant="outline"
                      className="text-[#4A235A] border-[#4A235A] hover:bg-[#4A235A] hover:text-white"
                      onClick={() => handleDownloadPDF(story.pdf_url, story.title)}
                    >
                      <FileDown size={18} className="ml-2" />
                      הורד PDF
                    </Button>
                    
                    <Button
                      className="bg-[#F5E6C5] hover:bg-gold-light text-[#4A235A] border border-gold-DEFAULT"
                      onClick={() => handleOpenPDF(story.pdf_url)}
                    >
                      <ExternalLink size={18} className="ml-2" />
                      פתח לקריאה
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Subscription Form */}
          <div className="mt-20">
            <StorySubscriptionForm />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Stories;
