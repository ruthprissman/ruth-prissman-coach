
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, BookOpen, BookText, Calendar, Mail } from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';
import { formatDateTimeInIsrael } from '@/utils/dateUtils';

interface Subscriber {
  id: number;
  email: string;
  first_name?: string;
  joined_at: string;
  is_subscribed: boolean;
  unsubscribed_at?: string;
}

interface SubscriptionListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionListModal: React.FC<SubscriptionListModalProps> = ({ isOpen, onClose }) => {
  const [contentSubscribers, setContentSubscribers] = useState<Subscriber[]>([]);
  const [storySubscribers, setStorySubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchSubscribers();
    }
  }, [isOpen]);

  const fetchSubscribers = async () => {
    try {
      setIsLoading(true);
      const client = await supabaseClient();

      // Fetch content subscribers
      const { data: contentData, error: contentError } = await client
        .from('content_subscribers')
        .select('*')
        .order('joined_at', { ascending: false });

      if (contentError) {
        console.error('Error fetching content subscribers:', contentError);
      } else {
        setContentSubscribers(contentData || []);
      }

      // Fetch story subscribers
      const { data: storyData, error: storyError } = await client
        .from('story_subscribers')
        .select('*')
        .order('joined_at', { ascending: false });

      if (storyError) {
        console.error('Error fetching story subscribers:', storyError);
      } else {
        setStorySubscribers(storyData || []);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveSubscribers = (subscribers: Subscriber[]) => {
    return subscribers.filter(sub => sub.is_subscribed);
  };

  const getInactiveSubscribers = (subscribers: Subscriber[]) => {
    return subscribers.filter(sub => !sub.is_subscribed);
  };

  const SubscriberTable = ({ subscribers, showUnsubscribed = false }: { subscribers: Subscriber[], showUnsubscribed?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">שם פרטי</TableHead>
          <TableHead className="text-right">אימייל</TableHead>
          <TableHead className="text-right">תאריך הצטרפות</TableHead>
          <TableHead className="text-right">סטטוס</TableHead>
          {showUnsubscribed && <TableHead className="text-right">תאריך הסרה</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {subscribers.map((subscriber) => (
          <TableRow key={subscriber.id}>
            <TableCell className="text-right">{subscriber.first_name || 'לא צוין'}</TableCell>
            <TableCell className="text-right" dir="ltr">{subscriber.email}</TableCell>
            <TableCell className="text-right">
              {formatDateTimeInIsrael(subscriber.joined_at)}
            </TableCell>
            <TableCell className="text-right">
              <Badge variant={subscriber.is_subscribed ? "default" : "secondary"}>
                {subscriber.is_subscribed ? 'פעיל' : 'לא פעיל'}
              </Badge>
            </TableCell>
            {showUnsubscribed && (
              <TableCell className="text-right">
                {subscriber.unsubscribed_at ? formatDateTimeInIsrael(subscriber.unsubscribed_at) : '-'}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const StatCard = ({ title, count, icon, color }: { title: string, count: number, icon: React.ReactNode, color: string }) => (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`h-4 w-4 ${color}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-right">רשימות תפוצה</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                תוכן מקצועי
              </TabsTrigger>
              <TabsTrigger value="stories" className="flex items-center gap-2">
                <BookText className="w-4 h-4" />
                סיפורים
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="flex gap-4 mb-4">
                <StatCard 
                  title="מנויים פעילים" 
                  count={getActiveSubscribers(contentSubscribers).length}
                  icon={<Users />}
                  color="text-green-600"
                />
                <StatCard 
                  title="מנויים שהתנתקו" 
                  count={getInactiveSubscribers(contentSubscribers).length}
                  icon={<Users />}
                  color="text-gray-600"
                />
                <StatCard 
                  title="סה״כ מנויים" 
                  count={contentSubscribers.length}
                  icon={<Mail />}
                  color="text-blue-600"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">מנויים פעילים ({getActiveSubscribers(contentSubscribers).length})</h3>
                  {getActiveSubscribers(contentSubscribers).length > 0 ? (
                    <SubscriberTable subscribers={getActiveSubscribers(contentSubscribers)} />
                  ) : (
                    <p className="text-center text-gray-500 py-4">אין מנויים פעילים</p>
                  )}
                </div>

                {getInactiveSubscribers(contentSubscribers).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">מנויים שהתנתקו ({getInactiveSubscribers(contentSubscribers).length})</h3>
                    <SubscriberTable subscribers={getInactiveSubscribers(contentSubscribers)} showUnsubscribed={true} />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="stories" className="space-y-4">
              <div className="flex gap-4 mb-4">
                <StatCard 
                  title="מנויים פעילים" 
                  count={getActiveSubscribers(storySubscribers).length}
                  icon={<Users />}
                  color="text-green-600"
                />
                <StatCard 
                  title="מנויים שהתנתקו" 
                  count={getInactiveSubscribers(storySubscribers).length}
                  icon={<Users />}
                  color="text-gray-600"
                />
                <StatCard 
                  title="סה״כ מנויים" 
                  count={storySubscribers.length}
                  icon={<Mail />}
                  color="text-blue-600"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">מנויים פעילים ({getActiveSubscribers(storySubscribers).length})</h3>
                  {getActiveSubscribers(storySubscribers).length > 0 ? (
                    <SubscriberTable subscribers={getActiveSubscribers(storySubscribers)} />
                  ) : (
                    <p className="text-center text-gray-500 py-4">אין מנויים פעילים</p>
                  )}
                </div>

                {getInactiveSubscribers(storySubscribers).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">מנויים שהתנתקו ({getInactiveSubscribers(storySubscribers).length})</h3>
                    <SubscriberTable subscribers={getInactiveSubscribers(storySubscribers)} showUnsubscribed={true} />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
