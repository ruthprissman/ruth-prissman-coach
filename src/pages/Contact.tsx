
import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, MessageSquare, MapPin, Video } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
// Fix the import to match the correct Formspree API
import { useForm as useFormspreeForm } from '@formspree/react';

const formSchema = z.object({
  name: z.string().min(2, { message: "נא להזין שם מלא" }),
  phone: z.string().optional(),
  email: z.string().email({ message: "נא להזין כתובת אימייל תקינה" }).optional().or(z.literal('')),
  message: z.string().min(5, { message: "נא להזין הודעה" }),
});

type FormData = z.infer<typeof formSchema>;

export default function Contact() {
  // Fix the Formspree hook usage
  const [formspreeState, formspreeSubmit] = useFormspreeForm("mleyywbb");
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      message: "",
    },
  });

  const formValues = form.watch();

  // Prepare mailto link with dynamic form data
  const prepareMailtoLink = () => {
    const subject = encodeURIComponent(`פנייה מהאתר - ${formValues.name || ''}`);
    const body = encodeURIComponent(`
      שם: ${formValues.name || ''}
      טלפון: ${formValues.phone || 'לא צוין'}
      אימייל: ${formValues.email || 'לא צוין'}
      הודעה: ${formValues.message || ''}
    `);
    
    return `mailto:RuthPrissman@gmail.com?subject=${subject}&body=${body}`;
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Submit to Formspree using the correct API
      const result = await formspreeSubmit(data);
      
      if (result.errors) {
        console.error("Form errors:", result.errors);
        toast.error("אירעה שגיאה בשליחת הטופס, אנא נסו שוב מאוחר יותר");
        return;
      }
      
      // If successful, mark as submitted
      setFormSubmitted(true);
      
      // Show success toast
      toast.success("הפנייה נשלחה בהצלחה!", {
        description: "רות תיצור איתך קשר בהקדם.",
      });
      
      // Clear form
      form.reset();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("אירעה שגיאה בשליחת הטופס, אנא נסו שוב מאוחר יותר");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cover bg-center bg-fixed"
      style={{ backgroundImage: 'url(https://www.dropbox.com/scl/fi/mn961lxdmrzb3hu61jr8c/clear-background.jpg?rlkey=te75ba634sz277355u5onqvuy&st=qxb55gpi&raw=1)' }}>
      <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]"></div>
      
      <Navigation />
      <main className="flex-grow relative z-10">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <h1 className="text-center text-3xl md:text-4xl lg:text-5xl font-alef text-[#4A235A] mb-12 gold-text-shadow">
            צור קשר עם רות פריסמן
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Contact Information */}
            <div className="backdrop-blur-sm rounded-xl p-6 shadow-md space-y-8">
              <h2 className="text-2xl font-alef text-[#4A235A] text-right mb-6">פרטי התקשרות</h2>
              
              <div className="space-y-6">
                <div className="flex flex-row-reverse items-center gap-4">
                  <Phone className="text-gold-DEFAULT flex-shrink-0" size={24} />
                  <div className="flex-grow text-right">
                    <p className="text-lg font-medium">טלפון</p>
                    <a href="tel:+972556620273" className="text-[#4A235A] hover:text-gold-DEFAULT transition-colors">
                      055-6620273
                    </a>
                  </div>
                </div>
                
                <div className="flex flex-row-reverse items-center gap-4">
                  <Mail className="text-gold-DEFAULT flex-shrink-0" size={24} />
                  <div className="flex-grow text-right">
                    <p className="text-lg font-medium">אימייל</p>
                    <a href="mailto:RuthPrissman@gmail.com" className="text-[#4A235A] hover:text-gold-DEFAULT transition-colors">
                      RuthPrissman@gmail.com
                    </a>
                  </div>
                </div>
                
                <div className="flex flex-row-reverse items-center gap-4">
                  <MessageSquare className="text-gold-DEFAULT flex-shrink-0" size={24} />
                  <div className="flex-grow text-right">
                    <p className="text-lg font-medium">וואטסאפ</p>
                    <a href="https://api.whatsapp.com/send?phone=+972556620273" className="text-[#4A235A] hover:text-gold-DEFAULT transition-colors">
                      שלח הודעה בוואטסאפ
                    </a>
                  </div>
                </div>
              </div>

              {/* Meeting Options */}
              <h2 className="text-2xl font-alef text-[#4A235A] text-right mt-8 mb-6">אפשרויות פגישה</h2>
              
              <div className="space-y-6">
                <div className="flex flex-row-reverse items-center gap-4">
                  <MapPin className="text-gold-DEFAULT flex-shrink-0" size={24} />
                  <div className="flex-grow text-right">
                    <p className="text-lg font-medium">פגישות פנים מול פנים</p>
                    <p className="text-gray-700">זמין במודיעין עילית</p>
                  </div>
                </div>
                
                <div className="flex flex-row-reverse items-center gap-4">
                  <Video className="text-gold-DEFAULT flex-shrink-0" size={24} />
                  <div className="flex-grow text-right">
                    <p className="text-lg font-medium">פגישות זום</p>
                    <p className="text-gray-700">זמין לפי בקשה</p>
                  </div>
                </div>
                
                <div className="flex flex-row-reverse items-center gap-4">
                  <Phone className="text-gold-DEFAULT flex-shrink-0" size={24} />
                  <div className="flex-grow text-right">
                    <p className="text-lg font-medium">שיחות טלפון</p>
                    <p className="text-gray-700">זמין להתייעצויות מרחוק</p>
                  </div>
                </div>
              </div>

              {/* Contact Buttons - Updated with new colors and target blank for WhatsApp */}
              <div className="flex flex-wrap gap-4 justify-center mt-8">
                <Button
                  asChild
                  className="bg-[#F5E6C5] hover:bg-gold-light text-[#4A235A] font-medium px-6 border border-gold-DEFAULT shadow-sm"
                >
                  <a href="tel:+972556620273" className="flex gap-2 items-center">
                    <Phone size={18} />
                    <span>התקשר עכשיו</span>
                  </a>
                </Button>
                
                <Button
                  asChild
                  className="bg-[#F5E6C5] hover:bg-gold-light text-[#4A235A] font-medium px-6 border border-gold-DEFAULT shadow-sm"
                >
                  <a 
                    href="https://api.whatsapp.com/send?phone=+972556620273" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex gap-2 items-center"
                  >
                    <MessageSquare size={18} />
                    <span>שלח וואטסאפ</span>
                  </a>
                </Button>
                
                <Button
                  asChild
                  className="bg-[#F5E6C5] hover:bg-gold-light text-[#4A235A] font-medium px-6 border border-gold-DEFAULT shadow-sm"
                >
                  <a 
                    href={prepareMailtoLink()}
                    className="flex gap-2 items-center"
                  >
                    <Mail size={18} />
                    <span>שלח אימייל</span>
                  </a>
                </Button>
              </div>
            </div>

            {/* Contact Form */}
            <div className="backdrop-blur-sm rounded-xl p-6 shadow-md" id="contact-form">
              <h2 className="text-2xl font-alef text-[#4A235A] text-right mb-6">השאירו פרטים ואחזור אליכם</h2>
              
              {formSubmitted ? (
                <div className="text-center py-12">
                  <div className="text-2xl font-alef text-[#4A235A] mb-4">הפנייה נשלחה בהצלחה!</div>
                  <div className="text-lg text-gray-700">רות תיצור איתך קשר בהקדם.</div>
                  <Button 
                    onClick={() => setFormSubmitted(false)}
                    className="mt-8 bg-[#F5E6C5] hover:bg-gold-light text-[#4A235A] font-medium px-6 border border-gold-DEFAULT shadow-sm"
                  >
                    שלח פנייה נוספת
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right block">שם מלא *</FormLabel>
                          <FormControl>
                            <Input placeholder="יש להזין שם מלא" {...field} className="text-right" />
                          </FormControl>
                          <FormMessage className="text-right" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right block">טלפון</FormLabel>
                          <FormControl>
                            <Input placeholder="יש להזין מספר טלפון" {...field} className="text-right" />
                          </FormControl>
                          <FormMessage className="text-right" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right block">אימייל</FormLabel>
                          <FormControl>
                            <Input placeholder="יש להזין כתובת אימייל" {...field} className="text-right" />
                          </FormControl>
                          <FormMessage className="text-right" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right block">הודעה *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="יש להזין את תוכן ההודעה" 
                              className="min-h-[120px] text-right dir-rtl" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-right" />
                        </FormItem>
                      )}
                    />
                    
                    <div className="pt-4 text-center">
                      <Button 
                        type="submit" 
                        className="bg-[#F5E6C5] hover:bg-gold-light text-[#4A235A] font-medium px-8 py-2 w-full md:w-auto border border-gold-DEFAULT shadow-md"
                        disabled={formState.submitting}
                      >
                        {formState.submitting ? "שולח..." : "שלח פנייה"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
