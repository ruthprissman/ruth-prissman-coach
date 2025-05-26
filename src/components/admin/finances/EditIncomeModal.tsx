
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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePatients } from '@/hooks/usePatients';
import { useFinanceCategories } from '@/hooks/useFinanceCategories';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { Transaction } from '@/types/finances';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FinanceService } from '@/services/FinanceService';
import { useToast } from '@/hooks/use-toast';

interface EditIncomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onSuccess: () => void;
}

const financeService = new FinanceService();

const EditIncomeModal: React.FC<EditIncomeModalProps> = ({ 
  open, 
  onOpenChange, 
  transaction,
  onSuccess 
}) => {
  const [date, setDate] = React.useState<Date | undefined>();
  const [amount, setAmount] = React.useState('');
  const [source, setSource] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [clientId, setClientId] = React.useState<string>('');
  const [customClientName, setCustomClientName] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('');
  const [referenceNumber, setReferenceNumber] = React.useState('');
  const [receiptNumber, setReceiptNumber] = React.useState('');
  const [sessionId, setSessionId] = React.useState('');
  const [isConfirmed, setIsConfirmed] = React.useState(false);

  const { data: patients = [], isLoading: isPatientsLoading } = usePatients();
  const { data: incomeCategories, isLoading: categoriesLoading } = useFinanceCategories('income');
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = usePaymentMethods();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Transaction>) => {
      if (!transaction) throw new Error('No transaction to update');
      return financeService.updateTransaction(transaction.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeData'] });
      queryClient.invalidateQueries({ queryKey: ['financialChartData'] });
      toast({
        title: "הכנסה עודכנה בהצלחה",
        description: "הרשומה עודכנה במערכת",
      });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Update income error:', error);
      toast({
        title: "שגיאה בעדכון הכנסה",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // טען נתונים קיימים כשהמודל נפתח
  useEffect(() => {
    if (transaction && open) {
      console.log('Loading transaction data:', transaction);
      setDate(transaction.date);
      setAmount(transaction.amount.toString());
      setSource(transaction.source || '');
      setCategory(transaction.category);
      setPaymentMethod(transaction.payment_method);
      setReferenceNumber(transaction.reference_number || '');
      setReceiptNumber(transaction.receipt_number || '');
      setSessionId(transaction.session_id?.toString() || '');
      setIsConfirmed(transaction.status === 'confirmed');

      // בדוק אם הלקוח קיים ברשימה
      const existingPatient = patients.find(p => p.name === transaction.client_name);
      if (existingPatient) {
        setClientId(existingPatient.id.toString());
        setCustomClientName('');
      } else {
        setClientId('other');
        setCustomClientName(transaction.client_name || '');
      }
    }
  }, [transaction, open, patients]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !amount || !source || !category || !paymentMethod || !transaction) {
      return;
    }

    const selectedPatient = patients.find(p => p.id.toString() === clientId);
    
    const updates = {
      date: new Date(date),
      amount: parseFloat(amount),
      source,
      category,
      client_id: clientId === 'other' ? null : (clientId ? parseInt(clientId) : null),
      client_name: clientId === 'other' ? customClientName : (selectedPatient?.name || customClientName),
      payment_method: paymentMethod,
      reference_number: referenceNumber || null,
      receipt_number: receiptNumber || null,
      session_id: sessionId ? parseInt(sessionId) : null,
      status: isConfirmed ? 'confirmed' : 'draft'
    };

    updateMutation.mutate(updates);
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">עריכת הכנסה</DialogTitle>
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
              <Label htmlFor="source">מקור *</Label>
              <Input 
                id="source" 
                placeholder="הזן מקור הכנסה" 
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required 
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="category">קטגוריה</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesLoading ? (
                    <div className="px-2 py-4 text-center text-muted-foreground">
                      טוען קטגוריות...
                    </div>
                  ) : incomeCategories && incomeCategories.length > 0 ? (
                    incomeCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center text-muted-foreground">
                      לא נמצאו קטגוריות הכנסה
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="client">שם משלם</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="בחר לקוח או אחר" />
                </SelectTrigger>
                <SelectContent>
                  {isPatientsLoading ? (
                    <SelectItem value="" disabled>טוען לקוחות...</SelectItem>
                  ) : (
                    <>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">אחר</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {clientId === 'other' && (
              <div className="flex flex-col space-y-2">
                <Label htmlFor="customClient">שם משלם מותאם אישית</Label>
                <Input 
                  id="customClient" 
                  placeholder="הזן שם משלם" 
                  value={customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                />
              </div>
            )}

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
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="receipt">מספר קבלה</Label>
              <Input 
                id="receipt" 
                placeholder="הזן מספר קבלה" 
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="session">קישור לפגישה</Label>
              <Input 
                id="session" 
                type="number"
                placeholder="מספר פגישה (אופציונלי)" 
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
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

export default EditIncomeModal;
