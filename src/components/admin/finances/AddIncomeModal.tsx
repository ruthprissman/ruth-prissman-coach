
import React from 'react';
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
import { useAddIncome } from '@/hooks/useAddIncome';

interface AddIncomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddIncomeModal: React.FC<AddIncomeModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
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
  const addIncomeMutation = useAddIncome();

  const resetForm = () => {
    setDate(new Date());
    setAmount('');
    setSource('');
    setCategory('');
    setClientId('');
    setCustomClientName('');
    setPaymentMethod('');
    setReferenceNumber('');
    setReceiptNumber('');
    setSessionId('');
    setIsConfirmed(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !amount || !source || !category || !paymentMethod) {
      return;
    }

    const selectedPatient = patients.find(p => p.id.toString() === clientId);
    
    const incomeData = {
      date,
      amount: parseFloat(amount),
      source,
      category,
      client_id: clientId === 'other' ? undefined : (clientId ? parseInt(clientId) : undefined),
      client_name: clientId === 'other' ? customClientName : (selectedPatient?.name || customClientName),
      payment_method: paymentMethod,
      reference_number: referenceNumber || undefined,
      receipt_number: receiptNumber || undefined,
      session_id: sessionId ? parseInt(sessionId) : undefined,
      status: isConfirmed ? 'מאושר' : 'טיוטה'
    };

    addIncomeMutation.mutate(incomeData, {
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        resetForm();
      }
    });
  };

  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">הוספת הכנסה</DialogTitle>
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
              <Label htmlFor="category">קטגוריה *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="therapy">טיפולים</SelectItem>
                  <SelectItem value="consultation">ייעוץ</SelectItem>
                  <SelectItem value="workshop">סדנאות</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
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
                  <SelectItem value="cash">מזומן</SelectItem>
                  <SelectItem value="bit">ביט</SelectItem>
                  <SelectItem value="transfer">העברה</SelectItem>
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
              disabled={addIncomeMutation.isPending}
            >
              {addIncomeMutation.isPending ? 'שומר...' : 'שמור'}
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

export default AddIncomeModal;
