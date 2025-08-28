import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, MapPin, DollarSign, Users, Video } from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

interface Workshop {
  id: string;
  title: string;
  description: string;
  date: string;
  price: number;
  is_free: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Workshops = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkshops = async () => {
      setLoading(true);
      try {
        const supabase = supabaseClient();
        
        const { data, error } = await supabase
          .from('workshops')
          .select('*')
          .eq('is_active', true)
          .order('date', { ascending: true });

        if (error) throw error;

        setWorkshops(data || []);
      } catch (err: any) {
        console.error('Error fetching workshops:', err);
        setError(err.message || 'אירעה שגיאה בטעינת הסדנאות');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshops();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const isWorkshopPast = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const getWorkshopStatus = (workshop: Workshop) => {
    const isPast = isWorkshopPast(workshop.date);
    if (isPast) {
      return { text: 'הסתיימה', variant: 'secondary' as const };
    }
    return { text: 'פתוחה להרשמה', variant: 'default' as const };
  };

  return (
    <>
      <Helmet>
        <title>סדנאות | רות פריסמן - קוד הנפש</title>
        <meta name="description" content="סדנאות רוחניות ופיתוח אישי עם רות פריסמן. הצטרפו לסדנאות המעשירות שיעזרו לכם להכיר את עצמכם ולצמוח." />
        <meta name="keywords" content="סדנאות, פיתוח אישי, רוחניות, צמיחה אישית, רות פריסמן" />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Navigation />
        
        <main className="flex-grow pt-24 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto w-full">
          <section className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-alef text-center text-[#4A235A] mb-6 gold-text-shadow">
              סדנאות
            </h1>
            
            <p className="text-center text-lg md:text-xl text-[#4A235A] mb-8 max-w-3xl mx-auto font-alef leading-relaxed">
              הצטרפו לסדנאות מעשירות שמציעות כלים מעשיים לצמיחה אישית ורוחנית.
              <br />
              כל סדנה מיועדת לתת לכם חוויה משמעותית ולהעמיק את ההכרה העצמית.
            </p>
          </section>
          
          {loading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="animate-pulse text-purple-dark text-xl">טוען סדנאות...</div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-6 border border-red-200 rounded-lg bg-red-50">
              <p className="text-xl font-semibold mb-2">שגיאה בטעינת הסדנאות</p>
              <p>{error}</p>
            </div>
          ) : workshops.length === 0 ? (
            <div className="text-center p-8">
              <div className="max-w-md mx-auto">
                <Users className="h-16 w-16 text-[#D4C5B9] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[#4A235A] mb-4">אין סדנאות זמינות כרגע</h3>
                <p className="text-[#4A235A]/70 mb-6">
                  אנחנו עובדים על סדנאות חדשות ומעניינות. עקבו אחרינו לעדכונים!
                </p>
                <Link to="/contact">
                  <Button className="bg-[#D4C5B9] hover:bg-[#C5B3A3] text-[#4A235A] font-semibold">
                    צרו קשר לפרטים נוספים
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {workshops.map((workshop) => {
                const status = getWorkshopStatus(workshop);
                const isPast = isWorkshopPast(workshop.date);
                
                return (
                  <Card 
                    key={workshop.id} 
                    className={`h-full shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                      isPast ? 'border-gray-300 opacity-75' : 'border-[#D4C5B9] hover:border-[#C5B3A3]'
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant={status.variant} className="text-xs">
                          {status.text}
                        </Badge>
                        {workshop.is_free && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            חינמי!
                          </Badge>
                        )}
                      </div>
                      
                      <CardTitle className="text-xl font-bold text-[#4A235A] text-right leading-tight">
                        {workshop.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="pt-0 space-y-4">
                      <p className="text-[#4A235A]/80 text-right leading-relaxed">
                        {workshop.description}
                      </p>
                      
                      <div className="space-y-3 border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-end text-[#4A235A]/70">
                          <span className="mr-2">{formatDate(workshop.date)}</span>
                          <CalendarDays className="h-4 w-4" />
                        </div>
                        
                        <div className="flex items-center justify-end text-[#4A235A]/70">
                          <span className="mr-2">{formatTime(workshop.date)}</span>
                          <Clock className="h-4 w-4" />
                        </div>
                        
                        <div className="flex items-center justify-end text-[#4A235A]/70">
                          <span className="mr-2">זום</span>
                          <Video className="h-4 w-4" />
                        </div>
                        
                        {!workshop.is_free && workshop.price > 0 && (
                          <div className="flex items-center justify-end text-[#4A235A]/70">
                            <span className="mr-2">₪{workshop.price}</span>
                            <DollarSign className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      
                      {!isPast && (
                        <div className="pt-4">
                          <Link to="/prayer-landing" className="block w-full">
                            <Button 
                              className="w-full bg-[#D4C5B9] hover:bg-[#C5B3A3] text-[#4A235A] font-semibold py-3 transition-colors duration-300"
                              size="lg"
                            >
                              הרשמה לסדנה
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          
          <section className="mt-20 mb-16">
            <Card className="w-full max-w-2xl mx-auto shadow-lg border-2 border-[#D4C5B9]">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-[#4A235A] text-center">
                  רוצים להתעדכן על סדנאות חדשות?
                </CardTitle>
                <p className="text-[#4A235A]/80 mt-2 text-center">
                  הצטרפו לרשימת התפוצה שלנו ותהיו הראשונים לדעת על סדנאות חדשות
                </p>
              </CardHeader>
              
              <CardContent className="text-center">
                <p className="text-[#4A235A]/70 mb-6">
                  נשלח לכם הודעה כשנפתח רישום לסדנאות חדשות ומעניינות
                </p>
                
                <Link to="/subscribe">
                  <Button 
                    className="bg-[#D4C5B9] hover:bg-[#C5B3A3] text-[#4A235A] font-semibold px-8 py-3 text-lg"
                    size="lg"
                  >
                    הצטרפות לרשימת התפוצה
                  </Button>
                </Link>
                
                <p className="text-xs text-[#4A235A]/60 mt-6 leading-relaxed">
                  <Link to="/privacy-policy" className="text-[#4A235A] hover:underline mx-1">
                    מדיניות פרטיות
                  </Link>
                  |
                  <Link to="/unsubscribe" className="text-[#4A235A] hover:underline mx-1">
                    ביטול הרשמה
                  </Link>
                </p>
              </CardContent>
            </Card>
          </section>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Workshops;