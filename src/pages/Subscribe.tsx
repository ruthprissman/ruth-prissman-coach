import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const Subscribe = () => {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [subscribeToContent, setSubscribeToContent] = useState(false);
  const [subscribeToStories, setSubscribeToStories] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין כתובת אימייל",
        variant: "destructive",
      });
      return;
    }

    if (!subscribeToContent && !subscribeToStories) {
      toast({
        title: "שגיאה", 
        description: "נא לבחור לפחות רשימת תפוצה אחת",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Subscribe to content if selected
      if (subscribeToContent) {
        const { error: contentError } = await supabase
          .from("content_subscribers")
          .upsert([
            {
              email: email.trim(),
              first_name: firstName.trim() || null,
              is_subscribed: true,
              joined_at: new Date().toISOString(),
            },
          ], {
            onConflict: "email",
            ignoreDuplicates: false,
          });

        if (contentError) {
          console.error("Error subscribing to content:", contentError);
        }
      }

      // Subscribe to stories if selected
      if (subscribeToStories) {
        const { error: storiesError } = await supabase
          .from("story_subscribers")
          .upsert([
            {
              email: email.trim(),
              first_name: firstName.trim() || null,
              is_subscribed: true,
              joined_at: new Date().toISOString(),
            },
          ], {
            onConflict: "email",
            ignoreDuplicates: false,
          });

        if (storiesError) {
          console.error("Error subscribing to stories:", storiesError);
        }
      }

      toast({
        title: "נרשמת בהצלחה!",
        description: "ההרשמה לרשימות התפוצה הושלמה בהצלחה",
      });

      // Reset form
      setFirstName("");
      setEmail("");
      setSubscribeToContent(false);
      setSubscribeToStories(false);

    } catch (error) {
      console.error("Error during subscription:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במהלך ההרשמה. אנא נסה שוב",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            הצטרף/י לרשימות התפוצה
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            וקבל/ני תוכן חדש וסיפורים ישירות למייל
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName" className="text-right block mb-2">
                  השם שלך (אופציונלי)
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="השם שלך"
                  className="text-right"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-right block mb-2">
                  האימייל שלך *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="האימייל שלך"
                  className="text-right"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label className="text-right block font-medium">
                  בחר/י לאילו רשימות תפוצה להירשם:
                </Label>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="content"
                    checked={subscribeToContent}
                    onCheckedChange={(checked) => setSubscribeToContent(checked === true)}
                  />
                  <Label htmlFor="content" className="text-right">
                    רשימת תפוצה לתוכן מקצועי (מאמרים, שירים, הומור)
                  </Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="stories"
                    checked={subscribeToStories}
                    onCheckedChange={(checked) => setSubscribeToStories(checked === true)}
                  />
                  <Label htmlFor="stories" className="text-right">
                    רשימת תפוצה לסיפורים
                  </Label>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "מעבד..." : "הירשם/י לרשימות התפוצה"}
            </Button>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              בלחיצה על כפתור ההרשמה אני מאשר/ת קבלת תוכן שבועי כמפורט ב
              <Link to="/privacy-policy" className="text-primary hover:underline mx-1">
                מדיניות הפרטיות
              </Link>
              <br />
              <Link to="/unsubscribe" className="text-primary hover:underline">
                להסרה מרשימת התפוצה
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscribe;