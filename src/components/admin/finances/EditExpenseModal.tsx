
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Expense } from '@/types/finances';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FinanceService } from '@/services/FinanceService';
import { useToast } from '@/hooks/use-toast';

interface EditExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  onSuccess: () => void;
}

const financeService = new FinanceService();

// מיפוי בין עברית לאנגלית
const categoryMapping = {
  'שכירות': 'rent',
  'ציוד משרדי': 'supplies',
  'שירותים מקצועיים': 'services',
  'מסים': 'taxes',
  'חשבונות': 'utilities',
  'אחר': 'other'
};

const paymentMethodMapping = {
  'אשראי': 'credit',
  'העברה בנקאית': 'transfer',
  'מזומן': 'cash',
  'צ\'ק': 'check'
};

// מיפוי הפוך - מאנגלית לעברית
const reverseCategoryMapping = {
  'rent': 'שכירות',
  'supplies': 'ציוד משרדי',
  'services': 'שירותים מקצועיים',
  'taxes': 'מסים',
  'utilities': 'חשבונות',
  'other': 'אחר'
};

const reversePaymentMethodMapping = {
  'credit': 'אשראי',
  'transfer': 'העברה בנקאית',
  'cash': 'מזומן',
  'check': 'צ\'ק'
};

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ 
  open, 
  onOpenChange, 
  expense,
  onSuccess 
}) => {
  const [date, setDate] = React.useState<Date | undefined>();
  const [amount, setAmount] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [payee, setPayee] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('');
  const [referenceNumber, setReferenceNumber] = React.useState('');
  const [isConfirmed, setIsConfirmed] = React.useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!expense) throw new Error('No expense to update');
      return financeService.updateTransaction(expense.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseData'] });
      queryClient.invalidateQueries({ queryKey: ['financialChartData'] });
      toast({
        title: "הוצאה עודכנה בהצלחה",
        description: "הרשומה עודכנה במערכת",
      });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Update expense error:', error);
      toast({
        title: "שגיאה בעדכון הוצאה",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // טען נתונים קיימים כשהמודל נפתח
  useEffect(() => {
    if (expense && open) {
      console.log('Loading expense data:', expense);
      setDate(expense.date);
      setAmount(expense.amount.toString());
      
      // המר מאנגלית לעברית לתצוגה
      const categoryInHebrew = reverseCategoryMapping[expense.category as keyof typeof reverseCategoryMapping];
      setCategory(categoryInHebrew || expense.category);
      
      const paymentMethodInHebrew = reversePaymentMethodMapping[expense.payment_method as keyof typeof reversePaymentMethodMapping];
      setPaymentMethod(paymentMethodInHebrew || expense.payment_method);
      
      setPayee(expense.payee || '');
      setDescription(expense.description || '');
      setReferenceNumber(expense.reference_number || '');
      setIsConfirmed(expense.status === 'confirmed');
      
      console.log('Category set to:', categoryInHebrew || expense.category);
      console.log('Payment method set to:', paymentMethodInHebrew || expense.payment_method);
    }
  }, [expense, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !amount || !category || !payee || !paymentMethod || !expense) {
      return;
    }

    // המר מעברית לאנגלית לשמירה במסד הנתונים
    const categoryInEnglish = categoryMapping[category as keyof typeof categoryMapping] || category;
    const paymentMethodInEnglish = paymentMethodMapping[paymentMethod as keyof typeof paymentMethodMapping] || paymentMethod;
    
    console.log('Submitting updates with category:', categoryInEnglish, 'payment method:', paymentMethodInEnglish);
    
    const updates = {
      date: new Date(date),
      amount: parseFloat(amount),
      category: categoryInEnglish,
      client_name: payee, // Store payee in client_name field
      source: description, // Store description in source field
      payment_method: paymentMethodInEnglish,
      reference_number: referenceNumber || null,
      status: isConfirmed ? 'confirmed' : 'draft'
    };

    updateMutation.mutate(updates);
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">עריכת הוצאה</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="date">תאריך *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !date && "text-muted-foreground"
                    )}
                    id="date"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : <span>בחר תאריך</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="amount">סכום *</Label>
              <Input 
                id="amount" 
                type="number" 
                placeholder="הזן סכום" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required 
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="category">קטגוריה *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="שכירות">שכירות</SelectItem>
                  <SelectItem value="ציוד משרדי">ציוד משרדי</SelectItem>
                  <SelectItem value="שירותים מקצועיים">שירותים מקצועיים</SelectItem>
                  <SelectItem value="מסים">מסים</SelectItem>
                  <SelectItem value="חשבונות">חשבונות</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="payee">למי שולם *</Label>
              <Input 
                id="payee" 
                placeholder="הזן שם ספק" 
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                required 
              />
            </div>

            <div className="flex flex-col space-y-2 col-span-full">
              <Label htmlFor="description">תיאור קצר</Label>
              <Textarea 
                id="description" 
                placeholder="הוסף תיאור להוצאה..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="payment_method">אמצעי תשלום *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="בחר אמצעי תשלום" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="אשראי">אשראי</SelectItem>
                  <SelectItem value="העברה בנקאית">העברה בנקאית</SelectItem>
                  <SelectItem value="מזומן">מזומן</SelectItem>
                  <SelectItem value="צ'ק">צ'ק</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="reference">מספר אסמכתא</Label>
              <Input 
                id="reference" 
                placeholder="הזן מספר אסמכתא"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="confirmed" className="mb-1">סטטוס</Label>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="confirmed"
                  checked={isConfirmed}
                  onCheckedChange={setIsConfirmed}
                />
                <Label htmlFor="confirmed" className="text-sm cursor-pointer font-normal">
                  {isConfirmed ? "מאושר" : "טיוטה"}
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-start mt-6">
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'שומר...' : 'שמור שינויים'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseModal;
