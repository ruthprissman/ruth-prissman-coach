
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UploadCloud } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useAddExpense } from '@/hooks/useAddExpense';
import { useFinanceCategories } from '@/hooks/useFinanceCategories';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { validateExpenseData, sanitizeFinancialData } from '@/utils/inputValidation';
import { useToast } from '@/hooks/use-toast';

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const [date, setDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [payee, setPayee] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('');
  const [referenceNumber, setReferenceNumber] = React.useState('');
  const [isConfirmed, setIsConfirmed] = React.useState(false);

  const addExpenseMutation = useAddExpense();
  const { data: expenseCategories, isLoading: categoriesLoading } = useFinanceCategories('expense');
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = usePaymentMethods();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate input data using the security schema
      const validatedData = validateExpenseData({
        date,
        amount,
        category,
        payee,
        description,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        status: isConfirmed ? 'מאושר' : 'טיוטה'
      });

      // Sanitize the data before submission
      const sanitizedData = sanitizeFinancialData({
        date: new Date(validatedData.date),
        amount: parseFloat(validatedData.amount),
        category: validatedData.category,
        payee: validatedData.payee,
        description: validatedData.description || '',
        payment_method: validatedData.payment_method,
        reference_number: validatedData.reference_number || '',
        status: validatedData.status
      });

      addExpenseMutation.mutate(sanitizedData, {
        onSuccess: () => {
          // Reset form
          setAmount('');
          setCategory('');
          setPayee('');
          setDescription('');
          setPaymentMethod('');
          setReferenceNumber('');
          setIsConfirmed(false);
          setDate(new Date().toISOString().split('T')[0]);
          
          onSuccess();
          onOpenChange(false);
          
          toast({
            title: "הוצאה נוספה בהצלחה",
            description: "ההוצאה נשמרה במערכת",
          });
        },
        onError: (error: any) => {
          toast({
            title: "שגיאה בשמירת ההוצאה",
            description: error.message || "אירעה שגיאה לא צפויה",
            variant: "destructive"
          });
        }
      });
    } catch (error: any) {
      toast({
        title: "שגיאה בנתונים",
        description: error.message || "הנתונים שהוזנו אינם תקינים",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">הוספת הוצאה</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="date">תאריך *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
              />
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
                min="0.01"
                max="1000000"
                step="0.01"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="category">קטגוריה *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesLoading ? (
                    <div className="px-2 py-4 text-center text-muted-foreground">
                      טוען קטגוריות...
                    </div>
                  ) : expenseCategories && expenseCategories.length > 0 ? (
                    expenseCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center text-muted-foreground">
                      לא נמצאו קטגוריות הוצאה
                    </div>
                  )}
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
                maxLength={200}
              />
            </div>

            <div className="flex flex-col space-y-2 col-span-full">
              <Label htmlFor="description">תיאור קצר</Label>
              <Textarea 
                id="description" 
                placeholder="הוסף תיאור להוצאה..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="payment_method">אמצעי תשלום *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="בחר אמצעי תשלום" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodsLoading ? (
                    <div className="px-2 py-4 text-center text-muted-foreground">
                      טוען אמצעי תשלום...
                    </div>
                  ) : paymentMethods && paymentMethods.length > 0 ? (
                    paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.name}>
                        {method.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center text-muted-foreground">
                      לא נמצאו אמצעי תשלום
                    </div>
                  )}
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
                maxLength={100}
              />
            </div>

            <div className="flex flex-col space-y-2 col-span-full">
              <Label htmlFor="attachment">קובץ מצורף</Label>
              <div className="border-2 border-dashed rounded-md p-6 text-center border-gray-300 hover:border-gray-400 transition cursor-pointer">
                <div className="flex flex-col items-center">
                  <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm">לחץ להעלאת קובץ או גרור לכאן</p>
                  <p className="text-xs text-muted-foreground mt-1">קבצים מסוג PDF, JPG, PNG</p>
                </div>
                <input type="file" className="hidden" id="attachment" />
              </div>
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
              disabled={addExpenseMutation.isPending}
            >
              {addExpenseMutation.isPending ? 'שומר...' : 'שמור'}
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

export default AddExpenseModal;
