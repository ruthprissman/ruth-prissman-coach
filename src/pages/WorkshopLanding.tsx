import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Calendar, 
  Clock, 
  Video, 
  Heart, 
  Lightbulb, 
  Star, 
  Mail, 
  Phone, 
  User,
  ArrowDown,
  Sparkles,
  Target,
  BookOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const WORKSHOP_ID = 'ac258723-b2b7-45da-9956-2ca140457a44';

const generateWorkshopConfirmationHTML = (fullName: string): string => {
  const firstName = fullName.split(' ')[0];
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>רישום לסדנה אושר - רות פריסמן</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f5ff; color: #333; line-height: 1.6;">
      
      <!-- Header -->
      <table style="width: 100%; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 20px; text-align: center;">
        <tr>
          <td>
            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              🎉 נרשמת בהצלחה!
            </h1>
            <p style="margin: 12px 0 0 0; color: #e9d8fd; font-size: 18px; font-weight: 300;">
              ${firstName ? `${firstName} יקרה,` : 'יקרה,'} אני מחכה לך בסדנה
            </p>
          </td>
        </tr>
      </table>

      <!-- Main Content -->
      <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <tr>
          <td style="padding: 40px 30px;">
            
            <!-- Welcome Message -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #7c3aed; font-size: 24px; font-weight: bold;">
                חיבורים חדשים למילים מוכרות
              </h2>
              <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.8;">
                תודה שהרשמת לסדנה החינמית שלי! אני כל כך נרגשת לפגוש אותך ולחלוק איתך כלים עמוקים ומעשיים
                להפוך את התפילה לחוויה משמעותית ומחברת.
              </p>
            </div>

            <!-- Workshop Details -->
            <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 30px; margin-bottom: 40px; border-right: 4px solid #7c3aed;">
              <h3 style="margin: 0 0 20px 0; color: #7c3aed; font-size: 20px; font-weight: bold; text-align: center;">
                📅 פרטי הסדנה
              </h3>
              
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="background: #7c3aed; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">📅</span>
                  <div>
                    <strong style="color: #333; font-size: 16px;">תאריך:</strong>
                    <span style="color: #666; margin-right: 8px;">יום ראשון יד׳ אלול • 7.9.25</span>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="background: #d97706; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">⏰</span>
                  <div>
                    <strong style="color: #333; font-size: 16px;">שעה:</strong>
                    <span style="color: #666; margin-right: 8px;">21:30</span>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="background: #059669; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">💻</span>
                  <div>
                    <strong style="color: #333; font-size: 16px;">פלטפורמה:</strong>
                    <span style="color: #666; margin-right: 8px;">זום</span>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="background: #dc2626; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">⏱️</span>
                  <div>
                    <strong style="color: #333; font-size: 16px;">משך:</strong>
                    <span style="color: #666; margin-right: 8px;">שעה וחצי</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Important Note -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border-radius: 12px; padding: 24px; margin-bottom: 40px; text-align: center; border: 2px solid #f59e0b;">
              <h4 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px; font-weight: bold;">
                📧 חשוב לדעת
              </h4>
              <p style="margin: 0; color: #92400e; font-size: 16px; line-height: 1.6;">
                לינק הזום לסדנה יישלח אלייך במייל נפרד 
                <strong>24 שעות לפני הסדנה</strong>
              </p>
            </div>

            <!-- What to Expect -->
            <div style="margin-bottom: 40px;">
              <h3 style="margin: 0 0 20px 0; color: #7c3aed; font-size: 20px; font-weight: bold; text-align: center;">
                💜 מה מחכה לך בסדנה
              </h3>
              
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; align-items: start; gap: 12px;">
                  <span style="color: #7c3aed; font-size: 20px; margin-top: 2px;">✨</span>
                  <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">
                    <strong>פרשנויות מרענות</strong> למילות התפילה שיחזירו להן את הקסם והמשמעות
                  </p>
                </div>
                
                <div style="display: flex; align-items: start; gap: 12px;">
                  <span style="color: #d97706; font-size: 20px; margin-top: 2px;">🎯</span>
                  <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">
                    <strong>כלים יישומיים</strong> שתוכלי להשתמש בהם מיד בתפילות שלך
                  </p>
                </div>
                
                <div style="display: flex; align-items: start; gap: 12px;">
                  <span style="color: #059669; font-size: 20px; margin-top: 2px;">📖</span>
                  <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">
                    <strong>תובנות וגילויים</strong> חדשים שיעשירו את החוויה הרוחנית שלך
                  </p>
                </div>
              </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin-bottom: 30px;">
              <p style="margin: 0 0 20px 0; color: #666; font-size: 16px;">
                בינתיים, אשמח שתכירי את התוכן הנוסף שלי:
              </p>
              
              <div style="display: flex; flex-direction: column; gap: 12px; align-items: center;">
                <a href="https://coach.ruthprissman.co.il/subscribe" 
                   style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 0 8px 8px 0;">
                  📬 הירשמי לרשימת התפוצה
                </a>
                
                <a href="https://coach.ruthprissman.co.il/" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 0 8px 8px 0;">
                  🌟 גלי את כל התוכן באתר
                </a>
              </div>
            </div>

          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table style="width: 100%; background-color: #f8f5ff; padding: 30px 20px; text-align: center;">
        <tr>
          <td>
            <p style="margin: 0 0 12px 0; color: #666; font-size: 16px; font-weight: bold;">
              רות פריסמן - מאמנת רוחנית ומנטורית
            </p>
            <p style="margin: 0 0 16px 0; color: #888; font-size: 14px;">
              📧 ruthprissman@gmail.com • 📱 055-6620273
            </p>
            <p style="margin: 0; color: #888; font-size: 12px; line-height: 1.5;">
              מייל זה נשלח אליך כי נרשמת לסדנה החינמית שלי.<br>
              לכל שאלה או בקשה להסרה מהרשימה, פני אליי במייל או בטלפון.
            </p>
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
};

export default function WorkshopLanding() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const scrollToRegistration = () => {
    const registrationSection = document.getElementById('registration');
    registrationSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא מלאי את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if email already registered for this workshop
      const { data: existingRegistration } = await supabase
        .from('registrations')
        .select('id')
        .eq('email', formData.email.trim())
        .eq('workshop_id', WORKSHOP_ID)
        .single();

      if (existingRegistration) {
        toast({
          title: "כבר נרשמת!",
          description: "את כבר רשומה לסדנה זו. נתראה שם! 💜",
          variant: "default"
        });
        setIsSubmitting(false);
        return;
      }

      // Create new registration
      const { error } = await supabase
        .from('registrations')
        .insert([
          {
            full_name: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            workshop_id: WORKSHOP_ID
          }
        ]);

      if (error) {
        throw error;
      }

      // Send confirmation email using existing email infrastructure
      try {
        console.log('🚀 Starting email sending process...');
        console.log('📧 Email will be sent to:', formData.email.trim());
        
        const firstName = formData.fullName.trim().split(' ')[0];
        const subject = `${firstName ? `${firstName},` : ''} רישום לסדנה אושר - חיבורים חדשים למילים מוכרות 🎉`;
        
        console.log('📝 Email subject:', subject);
        console.log('👤 Sender name:', formData.fullName.trim());
        
        const htmlContent = generateWorkshopConfirmationHTML(formData.fullName.trim());
        console.log('📄 HTML content length:', htmlContent.length);
        
        console.log('🔄 Invoking send-email function...');
        const emailResponse = await supabase.functions.invoke('send-email', {
          body: {
            emailList: [formData.email.trim()],
            subject: subject,
            sender: {
              email: "ruthprissman@gmail.com",
              name: "רות פריסמן"
            },
            htmlContent: htmlContent
          }
        });

        console.log('📨 Email response:', emailResponse);

        if (emailResponse.error) {
          console.error('❌ Error sending confirmation email:', emailResponse.error);
          // Don't fail the registration if email fails
        } else {
          console.log('✅ Confirmation email sent successfully');
        }
      } catch (emailError) {
        console.error('💥 Failed to send confirmation email:', emailError);
        // Don't fail the registration if email fails
      }

      toast({
        title: "נרשמת בהצלחה! 🎉",
        description: (
          <div className="space-y-3">
            <p>נשלח אלייך מייל אישור עם כל הפרטים</p>
            <p>לינק הזום יישלח אלייך במייל נפרד 24 שעות לפני הסדנה</p>
            <div className="flex flex-col gap-2 pt-2">
              <a 
                href="/subscribe" 
                className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  window.open('/subscribe', '_blank');
                }}
              >
                👉 הירשמי לרשימת התפוצה שלי לקבלת תוכן מעשיר
              </a>
              <a 
                href="/subscribe" 
                className="text-purple-600 hover:text-purple-800 underline text-sm font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  window.open('/', '_blank');
                }}
              >
                🌟 גלי את כל התוכן באתר שלי
              </a>
            </div>
          </div>
        ),
        variant: "default",
        duration: 10000
      });

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: ''
      });

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "שגיאה ברישום",
        description: "אנא נסי שוב או צרי קשר במספר 055-6620273",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>חיבורים חדשים למילים מוכרות - סדנה חינמית | רות פריסמן</title>
        <meta 
          name="description" 
          content="סדנה חינמית עם רות פריסמן - מבט חדש על מילות התפילה, רגע של חיבור בתוך שגרת היום. 7.9.25 בשעה 21:30"
        />
        <meta property="og:title" content="חיבורים חדשים למילים מוכרות - סדנה חינמית" />
        <meta property="og:description" content="סדנה חינמית עם רות פריסמן - מבט חדש על מילות התפילה" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://coach.ruthprissman.co.il/workshop" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-white">
        <Navigation />
        
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="space-y-6 animate-fade-in">
              <Badge 
                variant="outline" 
                className="text-lg px-6 py-2 bg-gradient-to-r from-purple-100 to-gold-100 border-purple-light text-purple-dark font-alef"
              >
                סדנה חינמית
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-alef text-purple-dark gold-text-shadow leading-tight">
                חיבורים חדשים
                <br />
                למילים מוכרות
              </h1>
              
              <p className="text-xl md:text-2xl text-purple-light font-heebo max-w-2xl mx-auto leading-relaxed">
                מבט חדש על מילות התפילה – רגע של חיבור בתוך שגרת היום
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center text-purple-dark font-alef text-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gold" />
                  <span>יום ראשון יד׳ אלול</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-light">•</span>
                  <span>7.9.25</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-light">•</span>
                  <Clock className="h-5 w-5 text-gold" />
                  <span>21:30</span>
                </div>
              </div>
              
              <div className="pt-6">
                <Button 
                  onClick={scrollToRegistration}
                  size="lg"
                  className="bg-gradient-to-r from-purple-dark to-purple-light hover:from-purple-light hover:to-purple-dark text-white px-8 py-4 text-lg font-alef rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  אני רוצה להירשם
                  <ArrowDown className="mr-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Emotional Intro Cards */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 border-l-4 border-l-red-400 bg-red-50/30 hover:shadow-lg transition-shadow duration-300">
                <div className="space-y-4">
                  <h3 className="text-2xl font-alef text-purple-dark flex items-center gap-3">
                    <Heart className="h-6 w-6 text-red-400" />
                    את מכירה את התחושה הזו?
                  </h3>
                  <div className="space-y-3 text-purple-dark leading-relaxed">
                    <p className="golden-bullet">מתפללת מתוך הרגל, בלי להרגיש באמת מחוברת</p>
                    <p className="golden-bullet">המילים כבר לא נוגעות, נהיו אוטומטיות</p>
                    <p className="golden-bullet">רוצה למצוא משמעות חדשה בטקסים מוכרים</p>
                    <p className="golden-bullet">מחפשת דרך להפוך את התפילה לרגע של חיבור אמיתי</p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 border-l-4 border-l-blue-400 bg-blue-50/30 hover:shadow-lg transition-shadow duration-300">
                <div className="space-y-4">
                  <h3 className="text-2xl font-alef text-purple-dark flex items-center gap-3">
                    <Lightbulb className="h-6 w-6 text-blue-400" />
                    יש דרך אחרת
                  </h3>
                  <p className="text-purple-dark leading-relaxed text-lg">
                    כשאת מבינה את המשמעות האמיתית שמאחורי המילים, התפילה הופכת לרגע של נוכחות, 
                    חיבור ושלווה. הסדנה הזו תיתן לך כלים פשוטים ועמוקים להפוך כל תפילה 
                    לחוויה משמעותית ומחברת.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-purple-50/20 to-gold-50/20">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-alef text-purple-dark text-center mb-12 gold-text-shadow">
              מה את תקבלי בסדנה
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 text-center bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-light to-purple-dark rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-alef text-purple-dark">אמונות חדשות</h3>
                  <p className="text-purple-light leading-relaxed">
                    פרשנויות מרענות ונגישות למילות התפילה שיחזירו להן את הקסם והמשמעות
                  </p>
                </div>
              </Card>

              <Card className="p-8 text-center bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-gold to-gold-dark rounded-full flex items-center justify-center mx-auto">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-alef text-purple-dark">כלים יישומיים</h3>
                  <p className="text-purple-light leading-relaxed">
                    טכניקות פשוטות ויעילות שתוכלי להשתמש בהן מיד בתפילות שלך
                  </p>
                </div>
              </Card>

              <Card className="p-8 text-center bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-dark to-purple-light rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-alef text-purple-dark">תובנות וגילויים</h3>
                  <p className="text-purple-light leading-relaxed">
                    חיבורים אישיים חדשים שיעשירו את החוויה הרוחנית שלך
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Workshop Details */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="p-8 md:p-12 bg-gradient-to-br from-white to-purple-50/30 border-purple-light/30 shadow-xl">
              <h2 className="text-3xl font-alef text-purple-dark text-center mb-8 gold-text-shadow">
                פרטי הסדנה
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-light rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-alef text-purple-dark text-lg">תאריך ושעה</h4>
                      <p className="text-purple-light">יום ראשון יד׳ אלול • 7.9.25 • 21:30</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-alef text-purple-dark text-lg">משך הסדנה</h4>
                      <p className="text-purple-light">שעה וחצי</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-dark rounded-full flex items-center justify-center">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-alef text-purple-dark text-lg">פלטפורמה</h4>
                      <p className="text-purple-light">זום (לינק יישלח לנרשמות)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-alef text-purple-dark text-lg">מחיר</h4>
                      <p className="text-green-600 font-bold text-lg">חינם לחלוטין</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Registration Section */}
        <section id="registration" className="py-16 px-4 bg-gradient-to-r from-purple-100/50 to-gold-100/50">
          <div className="container mx-auto max-w-2xl">
            <Card className="p-8 md:p-12 bg-white shadow-2xl">
              <h2 className="text-3xl font-alef text-purple-dark text-center mb-8 gold-text-shadow">
                הרשמה לסדנה
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-purple-dark font-alef text-lg">
                    שם מלא *
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="text-right text-lg p-4 border-purple-light/50 focus:border-purple-dark"
                    placeholder="השם המלא שלך"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-purple-dark font-alef text-lg">
                    כתובת אימייל *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="text-right text-lg p-4 border-purple-light/50 focus:border-purple-dark"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-purple-dark font-alef text-lg">
                    מספר טלפון (אופציונלי)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="text-right text-lg p-4 border-purple-light/50 focus:border-purple-dark"
                    placeholder="05X-XXXXXXX"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-dark to-purple-light hover:from-purple-light hover:to-purple-dark text-white py-4 text-xl font-alef rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {isSubmitting ? 'נרשמת...' : 'אני רוצה להירשם לסדנה'}
                </Button>

                <p className="text-purple-light text-center text-sm leading-relaxed">
                  לינק הזום יישלח אלייך במייל 24 שעות לפני הסדנה
                </p>
              </form>
            </Card>
          </div>
        </section>

        {/* Facilitator Bio */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="p-8 md:p-12 bg-gradient-to-br from-gold-50/30 to-purple-50/30 border-gold/30">
              <h2 className="text-3xl font-alef text-purple-dark text-center mb-8 gold-text-shadow">
                על המנחה
              </h2>
              
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-dark to-gold rounded-full flex items-center justify-center mx-auto">
                  <User className="h-12 w-12 text-white" />
                </div>
                
                <h3 className="text-2xl font-alef text-purple-dark">רות פריסמן</h3>
                
                <p className="text-purple-dark leading-relaxed text-lg max-w-3xl mx-auto">
                  מאמנת טיפולית מוסמכת, מתמחה בגישה טיפולית המשלבת צמיחה רגשית | זוגיות | ילדים | טראומות | SEFT - קוד הנפש
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-purple-50/30 to-gold-50/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-alef text-purple-dark text-center mb-12 gold-text-shadow">
              יש שאלות? צרי קשר
            </h2>
            
            <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-xl">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-light rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-alef text-purple-dark text-lg">שם</h4>
                      <p className="text-purple-light">רות פריסמן</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-alef text-purple-dark text-lg">אימייל</h4>
                      <a href="mailto:Ruth@RuthPrissman.co.il" className="text-purple-light hover:text-purple-dark transition-colors">
                        Ruth@RuthPrissman.co.il
                      </a>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-dark rounded-full flex items-center justify-center">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-alef text-purple-dark text-lg">טלפון</h4>
                      <a href="tel:0556620273" className="text-purple-light hover:text-purple-dark transition-colors">
                        0556620273
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">🌐</span>
                    </div>
                    <div>
                      <h4 className="font-alef text-purple-dark text-lg">אתר</h4>
                      <a 
                        href="https://coach.ruthprissman.co.il" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-light hover:text-purple-dark transition-colors"
                      >
                        coach.ruthprissman.co.il
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}