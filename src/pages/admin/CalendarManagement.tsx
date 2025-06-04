import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { supabaseClient } from '@/lib/supabaseClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { GoogleCalendarService } from '@/services/GoogleCalendarService';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';
import { RefreshCw } from 'lucide-react';

const CalendarManagement: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  const googleAuth = useGoogleOAuth();

  const { data: futureSessions, refetch, isLoading } = useQuery('futureSessions', async () => {
    const supabase = supabaseClient();
    const { data, error } = await supabase
      .from('future_sessions')
      .select('*')
      .order('session_date', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  });

  const handleSyncWithGoogle = async (): Promise<void> => {
    if (!googleAuth.isAuthenticated) {
      toast({
        title: "לא מחובר לGoogle",
        description: "אנא התחבר לGoogle Calendar קודם",
        variant: "destructive",
      });
      return;
    }

    try {
      const supabase = supabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "שגיאת אימות",
          description: "אנא התחבר מחדש למערכת",
          variant: "destructive",
        });
        return;
      }

      // Get Google tokens
      const { data: tokens } = await supabase
        .from('google_tokens')
        .select('access_token')
        .eq('user_id', session.user.id)
        .single();

      if (!tokens?.access_token) {
        toast({
          title: "שגיאת אימות Google",
          description: "לא נמצא token תקף לGoogle",
          variant: "destructive",
        });
        return;
      }

      const googleCalendarService = new GoogleCalendarService(tokens.access_token);
      
      // Sync future sessions to Google Calendar
      const result = await googleCalendarService.syncFutureSessionsToGoogle();
      
      if (result.success) {
        toast({
          title: "סנכרון הושלם בהצלחה",
          description: `${result.syncedCount} פגישות סונכרנו עם Google Calendar`,
        });
        
        // Refresh calendar data
        await refetch();
      } else {
        toast({
          title: "שגיאה בסנכרון",
          description: result.error || "לא ניתן לסנכרן עם Google Calendar",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error syncing with Google:', error);
      toast({
        title: "שגיאה בסנכרון",
        description: error.message || "אירעה שגיאה בלתי צפויה",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout title="ניהול יומן פגישות">
      <div className="container mx-auto py-10" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            ניהול יומן פגישות
          </h1>
          <Button onClick={handleSyncWithGoogle} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                מסנכרן...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                סנכרן עם Google Calendar
              </>
            )}
          </Button>
        </div>

        <Card className="w-[400px] border-purple-200">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-700">
              בחר תאריך
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={
                    "w-[280px] justify-start text-right font-normal" +
                    (date ? " text-black" : " text-muted-foreground")
                  }
                >
                  {date ? (
                    format(date, "dd/MM/yyyy", { locale: he })
                  ) : (
                    <span>בחר תאריך</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="start"
                side="bottom"
              >
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) =>
                    date > new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div>
              <Label htmlFor="email">הערות</Label>
              <Input
                type="email"
                id="email"
                placeholder="הוסף הערות לפגישה..."
              />
            </div>
            <Button>שמור</Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CalendarManagement;
