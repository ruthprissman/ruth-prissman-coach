import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabaseClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Types for our data
interface FinanceCategory {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

interface PaymentMethod {
  id: number;
  name: string;
}

// Create a QueryClient instance
const queryClient = new QueryClient();

const FinancialSettingsContent: React.FC = () => {
  const { toast } = useToast();
  const localQueryClient = useQueryClient();
  
  // State for dialogs
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [isPaymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // State for forms
  const [currentCategory, setCurrentCategory] = useState<Partial<FinanceCategory> | null>(null);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<Partial<PaymentMethod> | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{id: number, type: 'category' | 'payment'} | null>(null);
  
  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['financeCategories'],
    queryFn: async () => {
      const { data, error } = await supabaseClient()
        .from('finance_categories')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) {
        toast({ 
          title: "שגיאה בטעינת קטגוריות",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      return data as FinanceCategory[];
    }
  });
  
  // Fetch payment methods
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: async () => {
      const { data, error } = await supabaseClient()
        .from('payment_methods')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        toast({ 
          title: "שגיאה בטעינת אמצעי תשלום",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      return data as PaymentMethod[];
    }
  });

  // Mutations for categories
  const createOrUpdateCategory = useMutation({
    mutationFn: async (category: Partial<FinanceCategory>) => {
      if (category.id) {
        // Update
        const { data, error } = await supabaseClient()
          .from('finance_categories')
          .update({ name: category.name, type: category.type })
          .eq('id', category.id)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } else {
        // Create
        const { data, error } = await supabaseClient()
          .from('finance_categories')
          .insert({ name: category.name, type: category.type })
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({ 
        title: "נשמר בהצלחה",
        description: "הקטגוריה נשמרה בהצלחה",
      });
      localQueryClient.invalidateQueries({ queryKey: ['financeCategories'] });
      setCategoryDialogOpen(false);
      setCurrentCategory(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "שגיאה בשמירה",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutations for payment methods
  const createOrUpdatePaymentMethod = useMutation({
    mutationFn: async (paymentMethod: Partial<PaymentMethod>) => {
      if (paymentMethod.id) {
        // Update
        const { data, error } = await supabaseClient()
          .from('payment_methods')
          .update({ name: paymentMethod.name })
          .eq('id', paymentMethod.id)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } else {
        // Create
        const { data, error } = await supabaseClient()
          .from('payment_methods')
          .insert({ name: paymentMethod.name })
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({ 
        title: "נשמר בהצלחה",
        description: "אמצעי התשלום נשמר בהצלחה",
      });
      localQueryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      setPaymentMethodDialogOpen(false);
      setCurrentPaymentMethod(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "שגיאה בשמירה",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteItem = useMutation({
    mutationFn: async ({ id, type }: { id: number, type: 'category' | 'payment' }) => {
      const table = type === 'category' ? 'finance_categories' : 'payment_methods';
      const { error } = await supabaseClient()
        .from(table)
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return { id, type };
    },
    onSuccess: (data) => {
      const queryKey = data.type === 'category' ? 'financeCategories' : 'paymentMethods';
      const itemType = data.type === 'category' ? 'הקטגוריה' : 'אמצעי התשלום';
      
      toast({ 
        title: "נמחק בהצלחה",
        description: `${itemType} נמחק בהצלחה`,
      });
      
      localQueryClient.invalidateQueries({ queryKey: [queryKey] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "שגיאה במחיקה",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle category form submission
  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCategory && currentCategory.name && currentCategory.type) {
      createOrUpdateCategory.mutate(currentCategory);
    } else {
      toast({ 
        title: "שגיאה בטופס",
        description: "אנא מלא את כל השדות הנדרשים",
        variant: "destructive"
      });
    }
  };

  // Handle payment method form submission
  const handlePaymentMethodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPaymentMethod && currentPaymentMethod.name) {
      createOrUpdatePaymentMethod.mutate(currentPaymentMethod);
    } else {
      toast({ 
        title: "שגיאה בטופס",
        description: "אנא מלא את כל השדות הנדרשים",
        variant: "destructive"
      });
    }
  };

  // Handle edit category
  const handleEditCategory = (category: FinanceCategory) => {
    setCurrentCategory(category);
    setCategoryDialogOpen(true);
  };

  // Handle edit payment method
  const handleEditPaymentMethod = (paymentMethod: PaymentMethod) => {
    setCurrentPaymentMethod(paymentMethod);
    setPaymentMethodDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirmation = (id: number, type: 'category' | 'payment') => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };

  // Handle actual delete
  const handleDelete = () => {
    if (itemToDelete) {
      deleteItem.mutate(itemToDelete);
    }
  };

  return (
    <AdminLayout title="הגדרות ניהול פיננסיות">
      <div className="container mx-auto" dir="rtl">
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="categories">ניהול קטגוריות</TabsTrigger>
            <TabsTrigger value="payment-methods">ניהול אמצעי תשלום</TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">קטגוריות פיננסיות</CardTitle>
                <Button
                  onClick={() => {
                    setCurrentCategory({ name: '', type: 'income' });
                    setCategoryDialogOpen(true);
                  }}
                >
                  <Plus className="ml-2 h-4 w-4" />
                  הוספת קטגוריה
                </Button>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="text-center p-4">טוען...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>שם הקטגוריה</TableHead>
                        <TableHead>סוג</TableHead>
                        <TableHead className="w-[100px]">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories && categories.length > 0 ? (
                        categories.map((category) => (
                          <TableRow key={category.id}>
                            <TableCell>{category.name}</TableCell>
                            <TableCell>
                              {category.type === 'income' ? 'הכנסה' : 'הוצאה'}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-s-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCategory(category)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">ערוך</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteConfirmation(category.id, 'category')}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                  <span className="sr-only">מחק</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            לא נמצאו קטגוריות
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">אמצעי תשלום</CardTitle>
                <Button
                  onClick={() => {
                    setCurrentPaymentMethod({ name: '' });
                    setPaymentMethodDialogOpen(true);
                  }}
                >
                  <Plus className="ml-2 h-4 w-4" />
                  הוספת אמצעי תשלום
                </Button>
              </CardHeader>
              <CardContent>
                {paymentMethodsLoading ? (
                  <div className="text-center p-4">טוען...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>שם אמצעי התשלום</TableHead>
                        <TableHead className="w-[100px]">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentMethods && paymentMethods.length > 0 ? (
                        paymentMethods.map((method) => (
                          <TableRow key={method.id}>
                            <TableCell>{method.name}</TableCell>
                            <TableCell>
                              <div className="flex space-s-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPaymentMethod(method)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">ערוך</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteConfirmation(method.id, 'payment')}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                  <span className="sr-only">מחק</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center">
                            לא נמצאו אמצעי תשלום
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Category Dialog */}
        <Dialog open={isCategoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {currentCategory?.id ? 'עריכת קטגוריה' : 'הוספת קטגוריה חדשה'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">שם הקטגוריה</Label>
                <Input
                  id="name"
                  value={currentCategory?.name || ''}
                  onChange={(e) =>
                    setCurrentCategory({ ...currentCategory!, name: e.target.value })
                  }
                  placeholder="שם הקטגוריה"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">סוג</Label>
                <Select
                  value={currentCategory?.type || 'income'}
                  onValueChange={(value) =>
                    setCurrentCategory({ ...currentCategory!, type: value as 'income' | 'expense' })
                  }
                  required
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="בחר סוג" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">הכנסה</SelectItem>
                    <SelectItem value="expense">הוצאה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCategoryDialogOpen(false)}
                >
                  ביטול
                </Button>
                <Button type="submit" isLoading={createOrUpdateCategory.isPending}>
                  {currentCategory?.id ? 'עדכן' : 'הוסף'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment Method Dialog */}
        <Dialog open={isPaymentMethodDialogOpen} onOpenChange={setPaymentMethodDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {currentPaymentMethod?.id ? 'עריכת אמצעי תשלום' : 'הוספת אמצעי תשלום חדש'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePaymentMethodSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment-name">שם אמצעי התשלום</Label>
                <Input
                  id="payment-name"
                  value={currentPaymentMethod?.name || ''}
                  onChange={(e) =>
                    setCurrentPaymentMethod({ ...currentPaymentMethod!, name: e.target.value })
                  }
                  placeholder="שם אמצעי התשלום"
                  required
                />
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setPaymentMethodDialogOpen(false)}
                >
                  ביטול
                </Button>
                <Button type="submit" isLoading={createOrUpdatePaymentMethod.isPending}>
                  {currentPaymentMethod?.id ? 'עדכן' : 'הוסף'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>אתה בטוח שברצונך למחוק?</AlertDialogTitle>
              <AlertDialogDescription>
                פעולה זו אינה ניתנת לביטול ותמחק את{' '}
                {itemToDelete?.type === 'category' ? 'הקטגוריה' : 'אמצעי התשלום'} לצמיתות.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                מחק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

const FinancialSettings: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <FinancialSettingsContent />
    </QueryClientProvider>
  );
};

export default FinancialSettings;
