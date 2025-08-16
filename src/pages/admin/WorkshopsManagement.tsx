import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Plus, Edit2, CalendarDays, Trash2, Users, Mail } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Workshop {
  id: string;
  title: string;
  description: string;
  date: string;
  is_free: boolean;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Registrant {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

const workshopSchema = z.object({
  title: z.string().min(1, 'כותרת נדרשת'),
  description: z.string().min(1, 'תיאור נדרש'),
  date: z.date({ required_error: 'תאריך נדרש' }),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'שעה לא תקינה'),
  is_free: z.boolean().default(false),
  price: z.number().min(0, 'מחיר חייב להיות חיובי').default(0),
  is_active: z.boolean().default(true),
});

type WorkshopFormData = z.infer<typeof workshopSchema>;

const WorkshopsManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [isRegistrantsModalOpen, setIsRegistrantsModalOpen] = useState(false);
  const [zoomLink, setZoomLink] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<WorkshopFormData>({
    resolver: zodResolver(workshopSchema),
    defaultValues: {
      title: '',
      description: '',
      time: '',
      is_free: false,
      price: 0,
      is_active: true,
    },
  });

  // Fetch workshops
  const { data: workshops = [], isLoading } = useQuery({
    queryKey: ['workshops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Workshop[];
    },
  });

  // Fetch registrants for a specific workshop
  const { data: registrants = [], isLoading: isLoadingRegistrants } = useQuery({
    queryKey: ['registrants', selectedWorkshop?.id],
    queryFn: async () => {
      if (!selectedWorkshop?.id) return [];
      
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('workshop_id', selectedWorkshop.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Registrant[];
    },
    enabled: !!selectedWorkshop?.id,
  });

  // Create workshop mutation
  const createWorkshopMutation = useMutation({
    mutationFn: async (data: WorkshopFormData) => {
      const [hours, minutes] = data.time.split(':').map(Number);
      const dateWithTime = new Date(data.date);
      dateWithTime.setHours(hours, minutes, 0, 0);
      
      const { error } = await supabase
        .from('workshops')
        .insert([{
          title: data.title,
          description: data.description,
          date: dateWithTime.toISOString(),
          is_free: data.is_free,
          price: data.is_free ? 0 : data.price,
          is_active: data.is_active,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: 'הצלחה',
        description: 'הסדנה נוצרה בהצלחה',
      });
    },
    onError: (error) => {
      console.error('Error creating workshop:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה ביצירת הסדנה',
        variant: 'destructive',
      });
    },
  });

  // Update workshop mutation
  const updateWorkshopMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WorkshopFormData }) => {
      const [hours, minutes] = data.time.split(':').map(Number);
      const dateWithTime = new Date(data.date);
      dateWithTime.setHours(hours, minutes, 0, 0);
      
      const { error } = await supabase
        .from('workshops')
        .update({
          title: data.title,
          description: data.description,
          date: dateWithTime.toISOString(),
          is_free: data.is_free,
          price: data.is_free ? 0 : data.price,
          is_active: data.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      setIsDialogOpen(false);
      setEditingWorkshop(null);
      form.reset();
      toast({
        title: 'הצלחה',
        description: 'הסדנה עודכנה בהצלחה',
      });
    },
    onError: (error) => {
      console.error('Error updating workshop:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בעדכון הסדנה',
        variant: 'destructive',
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('workshops')
        .update({ 
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      toast({
        title: 'הצלחה',
        description: 'סטטוס הסדנה עודכן בהצלחה',
      });
    },
    onError: (error) => {
      console.error('Error toggling workshop status:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בעדכון סטטוס הסדנה',
        variant: 'destructive',
      });
    },
  });

  // Delete workshop mutation
  const deleteWorkshopMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workshops')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      toast({
        title: 'הצלחה',
        description: 'הסדנה נמחקה בהצלחה',
      });
    },
    onError: (error) => {
      console.error('Error deleting workshop:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת הסדנה',
        variant: 'destructive',
      });
    },
  });

  // Send workshop invitations mutation
  const sendInvitationsMutation = useMutation({
    mutationFn: async ({ workshopId, zoomLink }: { workshopId: string; zoomLink: string }) => {
      const { data, error } = await supabase.functions.invoke('send-workshop-invitations', {
        body: {
          workshopId,
          zoomLink,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'הצלחה',
        description: 'הזימונים נשלחו בהצלחה לכל הנרשמות',
      });
      setIsRegistrantsModalOpen(false);
      setZoomLink('');
    },
    onError: (error) => {
      console.error('Error sending invitations:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בשליחת הזימונים',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    const workshopDate = new Date(workshop.date);
    form.reset({
      title: workshop.title,
      description: workshop.description,
      date: workshopDate,
      time: format(workshopDate, 'HH:mm'),
      is_free: workshop.is_free,
      price: workshop.price,
      is_active: workshop.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: WorkshopFormData) => {
    if (editingWorkshop) {
      updateWorkshopMutation.mutate({ id: editingWorkshop.id, data });
    } else {
      createWorkshopMutation.mutate(data);
    }
  };

  const handleAddNew = () => {
    setEditingWorkshop(null);
    form.reset({
      title: '',
      description: '',
      time: '',
      is_free: false,
      price: 0,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = (workshop: Workshop) => {
    toggleActiveMutation.mutate({
      id: workshop.id,
      is_active: !workshop.is_active,
    });
  };

  const handleViewRegistrants = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setIsRegistrantsModalOpen(true);
  };

  const handleSendInvitations = () => {
    if (!selectedWorkshop || !zoomLink.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נדרש לקלוט לינק זום',
        variant: 'destructive',
      });
      return;
    }
    
    sendInvitationsMutation.mutate({
      workshopId: selectedWorkshop.id,
      zoomLink: zoomLink.trim(),
    });
  };

  const formatWorkshopDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: he });
    } catch {
      return 'תאריך לא תקין';
    }
  };

  const formatRegistrantDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: he });
    } catch {
      return 'תאריך לא תקין';
    }
  };

  const isWorkshopInFuture = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  // Watch is_free to reset price when workshop becomes free
  const isFree = form.watch('is_free');
  React.useEffect(() => {
    if (isFree) {
      form.setValue('price', 0);
    }
  }, [isFree, form]);

  return (
    <AdminLayout title="ניהול סדנאות">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">ניהול סדנאות</h1>
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            הוספת סדנה חדשה
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              רשימת הסדנאות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : workshops.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                אין סדנאות במערכת
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">כותרת</TableHead>
                    <TableHead className="text-right">תאריך</TableHead>
                    <TableHead className="text-center">פעילה</TableHead>
                    <TableHead className="text-center">מחיר</TableHead>
                    <TableHead className="text-center">נרשמות / שלח מייל</TableHead>
                    <TableHead className="text-center">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workshops.map((workshop) => (
                    <TableRow key={workshop.id}>
                      <TableCell className="font-medium">{workshop.title}</TableCell>
                      <TableCell>{formatWorkshopDate(workshop.date)}</TableCell>
                       <TableCell className="text-center">
                         <div className="flex justify-center">
                           <Switch
                             checked={workshop.is_active}
                             onCheckedChange={() => handleToggleActive(workshop)}
                             disabled={toggleActiveMutation.isPending}
                           />
                         </div>
                       </TableCell>
                      <TableCell className="text-center">
                        {workshop.is_free ? 'חינם' : `₪${workshop.price}`}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRegistrants(workshop)}
                          className="flex items-center gap-1"
                        >
                          <Users className="h-3 w-3" />
                          נרשמות / שלח מייל
                        </Button>
                      </TableCell>
                       <TableCell className="text-center">
                         <div className="flex items-center justify-center gap-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleEdit(workshop)}
                             className="flex items-center gap-1"
                           >
                             <Edit2 className="h-3 w-3" />
                             עריכה
                           </Button>
                           <AlertDialog>
                             <AlertDialogTrigger asChild>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 className="flex items-center gap-1 text-destructive hover:text-destructive"
                               >
                                 <Trash2 className="h-3 w-3" />
                                 מחיקה
                               </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                               <AlertDialogHeader>
                                 <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                                 <AlertDialogDescription>
                                   האם אתה בטוח שברצונך למחוק את הסדנה "{workshop.title}"?
                                   פעולה זו לא ניתנת לביטול.
                                 </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                 <AlertDialogCancel>ביטול</AlertDialogCancel>
                                 <AlertDialogAction
                                   onClick={() => deleteWorkshopMutation.mutate(workshop.id)}
                                   disabled={deleteWorkshopMutation.isPending}
                                   className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                 >
                                   מחק
                                 </AlertDialogAction>
                               </AlertDialogFooter>
                             </AlertDialogContent>
                           </AlertDialog>
                         </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Workshop Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingWorkshop ? 'עריכת סדנה' : 'הוספת סדנה חדשה'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>כותרת</FormLabel>
                      <FormControl>
                        <Input placeholder="הכנס כותרת לסדנה" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>תיאור</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="הכנס תיאור לסדנה"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                 <div className="grid grid-cols-2 gap-4">
                   <FormField
                     control={form.control}
                     name="date"
                     render={({ field }) => (
                       <FormItem className="flex flex-col">
                         <FormLabel>תאריך</FormLabel>
                         <Popover>
                           <PopoverTrigger asChild>
                             <FormControl>
                               <Button
                                 variant="outline"
                                 className={cn(
                                   "pl-3 text-left font-normal",
                                   !field.value && "text-muted-foreground"
                                 )}
                               >
                                 {field.value ? (
                                   format(field.value, "PPP", { locale: he })
                                 ) : (
                                   <span>בחר תאריך</span>
                                 )}
                                 <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                               </Button>
                             </FormControl>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0" align="start">
                             <Calendar
                               mode="single"
                               selected={field.value}
                               onSelect={field.onChange}
                               disabled={(date) => date < new Date()}
                               initialFocus
                               className={cn("p-3 pointer-events-auto")}
                             />
                           </PopoverContent>
                         </Popover>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <FormField
                     control={form.control}
                     name="time"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>שעה</FormLabel>
                         <FormControl>
                           <Input
                             type="time"
                             {...field}
                           />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>

                 <FormField
                   control={form.control}
                   name="is_free"
                   render={({ field }) => (
                     <FormItem className="flex flex-row-reverse items-center justify-between rounded-lg border p-3">
                       <FormControl>
                         <Switch
                           checked={field.value}
                           onCheckedChange={field.onChange}
                         />
                       </FormControl>
                       <div className="space-y-0.5">
                         <FormLabel>סדנה חינמית</FormLabel>
                       </div>
                     </FormItem>
                   )}
                 />

                {!isFree && (
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>מחיר (₪)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                 <FormField
                   control={form.control}
                   name="is_active"
                   render={({ field }) => (
                     <FormItem className="flex flex-row-reverse items-center justify-between rounded-lg border p-3">
                       <FormControl>
                         <Switch
                           checked={field.value}
                           onCheckedChange={field.onChange}
                         />
                       </FormControl>
                       <div className="space-y-0.5">
                         <FormLabel>סדנה פעילה</FormLabel>
                       </div>
                     </FormItem>
                   )}
                 />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createWorkshopMutation.isPending || updateWorkshopMutation.isPending}
                    className="flex-1"
                  >
                    {editingWorkshop ? 'עדכן סדנה' : 'צור סדנה'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    ביטול
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Registrants Modal */}
        <Dialog open={isRegistrantsModalOpen} onOpenChange={setIsRegistrantsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                נרשמות לסדנה: {selectedWorkshop?.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {isLoadingRegistrants ? (
                <div className="flex justify-center items-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : registrants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  אין נרשמות לסדנה זו
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <h3 className="font-semibold">רשימת נרשמות ({registrants.length}):</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">שם מלא</TableHead>
                            <TableHead className="text-right">אימייל</TableHead>
                            <TableHead className="text-right">טלפון</TableHead>
                            <TableHead className="text-right">תאריך הרשמה</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {registrants.map((registrant) => (
                            <TableRow key={registrant.id}>
                              <TableCell className="font-medium">{registrant.full_name}</TableCell>
                              <TableCell>{registrant.email}</TableCell>
                              <TableCell>{registrant.phone || '-'}</TableCell>
                              <TableCell>{formatRegistrantDate(registrant.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {selectedWorkshop && isWorkshopInFuture(selectedWorkshop.date) && (
                    <div className="space-y-3 border-t pt-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        שליחת זימון לסדנה
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            לינק זום לסדנה:
                          </label>
                          <Input
                            placeholder="הכנס את לינק הזום לסדנה..."
                            value={zoomLink}
                            onChange={(e) => setZoomLink(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <Button
                          onClick={handleSendInvitations}
                          disabled={sendInvitationsMutation.isPending || !zoomLink.trim()}
                          className="w-full flex items-center gap-2"
                        >
                          {sendInvitationsMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              שולח זימונים...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4" />
                              שלח מייל זימון לנרשמות ({registrants.length})
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default WorkshopsManagement;