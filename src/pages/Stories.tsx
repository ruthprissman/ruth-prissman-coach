
import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { createClient } from '@supabase/supabase-js';
import { FileDown, ExternalLink, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StoryDescriptionModal } from '@/components/StoryDescriptionModal';
import * as kosherZmanim from 'kosher-zmanim';
import { Helmet } from 'react-helmet-async';

// Supabase configuration
const supabaseUrl = 'https://uwqwlltrfvokjlaufguz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cXdsbHRyZnZva2psYXVmZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjU0MjYsImV4cCI6MjA1NjQ0MTQyNn0.G2JhvsEw4Q24vgt9SS9_nOMPtOdOqTGpus8zEJ5USD8';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Debug kosher-zmanim exports
console.log('kosherZmanim library:', kosherZmanim);

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
  const [hebrewDates, setHebrewDates] = useState<Record<number, string>>({});
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper function to get story image or use default
  const getStoryImage = (imageUrl: string) => {
    return imageUrl && imageUrl.trim() !== ""
      ? imageUrl
      : "https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/sign/stories_img/default.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJzdG9yaWVzX2ltZy9kZWZhdWx0LmpwZyIsImlhdCI6MTc0MTA5OTE1MCwiZXhwIjoyMzcxODE5MTUwfQ.k3rGaTGlhjgrqxFxiJT9H70Aaq89RbM_kDKuTxqTgcQ";
  };

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
          
          // Fetch Hebrew dates for all stories
          const datePromises = data.map(async (story) => {
            try {
              const hebrewDate = await fetchHebrewDate(new Date(story.published_at));
              return { id: story.id, hebrewDate };
            } catch (err) {
              console.error('Error fetching Hebrew date:', err);
              return { id: story.id, hebrewDate: '' };
            }
          });
          
          const results = await Promise.all(datePromises);
          const hebrewDatesMap = results.reduce((acc, { id, hebrewDate }) => {
            acc[id] = hebrewDate;
            return acc;
          }, {} as Record<number, string>);
          
          setHebrewDates(hebrewDatesMap);
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

  // Function to fetch Hebrew date from Hebcal API
  const fetchHebrewDate = async (date: Date) => {
    try {
      const response = await fetch(
        `https://www.hebcal.com/converter?cfg=json&gy=${date.getFullYear()}&gm=${date.getMonth()+1}&gd=${date.getDate()}&g2h=1&strict=1`
      );
      const data = await response.json();
      return data.hebrew; // Returns formatted Hebrew date as a string
    } catch (error) {
      console.error('Error fetching Hebrew date:', error);
      // Fallback to the kosher-zmanim implementation
      return formatHebrewDate(date.toISOString());
    }
  };

  const handleOpenPDF = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadPDF = (url: string, title: string) => {
    // Open in new tab instead of downloading directly
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenModal = (story: Story) => {
    setSelectedStory(story);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  const formatHebrewDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      if (kosherZmanim.JewishCalendar) {
        const jewishCalendar = new kosherZmanim.JewishCalendar(date);
        
        // Get the month number and convert to name
        const monthNumber = jewishCalendar.getJewishMonth();
        let monthName = '';
        
        // Hebrew month names based on Jewish calendar
        const hebrewMonths = [
          'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול',
          'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר'
        ];
        
        // Handle Adar I and Adar II in leap years
        if (jewishCalendar.isJewishLeapYear() && monthNumber === 12) {
          monthName = 'אדר א';
        } else if (jewishCalendar.isJewishLeapYear() && monthNumber === 13) {
          monthName = 'אדר ב';
        } else {
          monthName = hebrewMonths[monthNumber - 1];
        }
        
        // Format Hebrew numbers for day (using numeric value directly)
        const day = jewishCalendar.getJewishDayOfMonth();
        
        // Get Hebrew year
        const year = jewishCalendar.getJewishYear();
        
        return `${day} ${monthName} ${year}`;
      } else {
        console.error('JewishCalendar not found in kosher-zmanim');
        return '';
      }
    } catch (error) {
      console.error('Error converting to Hebrew date:', error);
      return '';
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-white">
      <Helmet>
        <title>סיפורים קצרים - רות פריסמן | קוד הנפש</title>
        <meta name="description" content="סיפורים קצרים שנכתבו על ידי רות פריסמן, המעבירים עומק רגשי, תובנות נשיות ומסע פנימי בגישת קוד הנפש. כתיבה שנוגעת בנפש." />
        <meta name="keywords" content="סיפורים קצרים, כתיבה רגשית, רות פריסמן, קוד הנפש, כתיבה נשית, סיפור אישי, העצמה רגשית, סיפורים טיפוליים, תהליך רגשי" />
      </Helmet>
      
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-20" 
        style={{ 
          backgroundImage: "url('https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/sign/site_imgs/clear-background.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJzaXRlX2ltZ3MvY2xlYXItYmFja2dyb3VuZC5wbmciLCJpYXQiOjE3NDExMDE0OTMsImV4cCI6MjM3MTgyMTQ5M30.k9JPVqmzmFtfxa8jbYpr1Hi3T4l2ZaHQZdPy2gGpgvk')" 
        }}
      />
      
      <Navigation />
      
      <main className="flex-grow pt-24 pb-12 px-4 z-10">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-alef text-center text-[#4A235A] mb-3 gold-text-shadow">
            סיפורים
          </h1>
          
          <p className="text-lg md:text-xl font-alef text-center text-[#4A235A]/80 mb-10">
            על חיים מוכרים במבט חדש
          </p>
          
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
                  <div 
                    className="mb-4 aspect-[3/2] overflow-hidden rounded-md cursor-pointer"
                    onClick={() => handleOpenModal(story)}
                  >
                    <img 
                      src={getStoryImage(story.image_url)} 
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
                  
                  <div 
                    className="text-gray-700 mb-4 text-right line-clamp-3 cursor-pointer hover:text-[#4A235A] whitespace-pre-line"
                    onClick={() => handleOpenModal(story)}
                  >
                    {story.description}
                  </div>
                  
                  <div className="text-right mb-4">
                    <p className="text-right text-md text-gray-500">
                      {hebrewDates[story.id] || formatHebrewDate(story.published_at)}
                    </p>
                    <p className="text-right text-md text-gray-500">
                      {formatDate(story.published_at)}
                    </p>
                  </div>
                  
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
          
          {selectedStory && (
            <StoryDescriptionModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              title={selectedStory.title}
              description={selectedStory.description}
              imageUrl={selectedStory.image_url}
              pdfUrl={selectedStory.pdf_url}
            />
          )}
          
          <div className="mt-20">
            <Card className="w-full max-w-md mx-auto shadow-lg border-2 border-[#D4C5B9]">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-[#4A235A] text-center">
                  הצטרף/י לרשימות התפוצה
                </CardTitle>
                <p className="text-[#4A235A]/80 mt-2 text-center">
                  קבל/י תוכן חדש וסיפורים ישירות למייל
                </p>
              </CardHeader>
              
              <CardContent className="text-center">
                <p className="text-[#4A235A]/70 mb-6">
                  בחר/י את רשימות התפוצה המעניינות אותך והישאר/י מעודכן/ת
                </p>
                
                <Link to="/subscribe">
                  <Button 
                    className="bg-[#D4C5B9] hover:bg-[#C5B3A3] text-[#4A235A] font-semibold px-8 py-3 text-lg w-full"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    להצטרפות לרשימות התפוצה
                  </Button>
                </Link>
                
                <p className="text-xs text-[#4A235A]/60 mt-4 leading-relaxed">
                  אפשרות להירשם לתוכן מקצועי או לסיפורים
                  <br />
                  <Link to="/privacy-policy" className="text-[#4A235A] hover:underline mx-1">
                    מדיניות הפרטיות
                  </Link>
                  |
                  <Link to="/unsubscribe" className="text-[#4A235A] hover:underline mx-1">
                    להסרה מרשימת התפוצה
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Stories;
