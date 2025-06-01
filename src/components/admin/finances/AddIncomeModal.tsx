import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import { useAddIncome } from '@/hooks/useAddIncome';
import { useFinanceCategories } from '@/hooks/useFinanceCategories';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { usePatients } from '@/hooks/usePatients';
import AddPatientDialog from '@/components/admin/AddPatientDialog';
import { Patient } from '@/types/patient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface AddIncomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddIncomeModal: React.FC<AddIncomeModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const [date, setDate] = React.useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [amount, setAmount] = React.useState('');
  const [source, setSource] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [clientId, setClientId] = React.useState<string>('');
  const [customClientName, setCustomClientName] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('');
  const [referenceNumber, setReferenceNumber] = React.useState('');
  const [receiptNumber, setReceiptNumber] = React.useState('');
  const [isConfirmed, setIsConfirmed] = React.useState(false);
  const [showAddPatientDialog, setShowAddPatientDialog] = React.useState(false);

  const addIncomeMutation = useAddIncome();
  const { data: incomeCategories, isLoading: categoriesLoading } = useFinanceCategories('income');
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = usePaymentMethods();
  const { data: patients = [], isLoading: isPatientsLoading } = usePatients();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addPatientMutation = useMutation({
    mutationFn: async (patient: Omit<Patient, 'id'>) => {
      const client = supabaseClient();
      
      const { data, error } = await client
        .from('patients')
        .insert(patient)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (newPatient) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: "לקוח נוסף בהצלחה",
        description: "הלקוח החדש נשמר במערכת",
      });
      // Select the newly added patient
      setClientId(newPatient.id.toString());
      setCustomClientName('');
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בהוספת לקוח",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAddPatient = async (patient: Omit<Patient, 'id'>) => {
    try {
      await addPatientMutation.mutateAsync(patient);
      return true;
    } catch (error) {
      console.error('Error adding patient:', error);
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !amount || !source || !paymentMethod) {
      return;
    }

    const selectedPatient = patients.find(p => p.id.toString() === clientId);
    
    const incomeData = {
      date: new Date(date),
      amount: parseFloat(amount),
      source,
      category: category || 'other',
      client_id: clientId === 'other' ? undefined : (clientId ? parseInt(clientId) : undefined),
      client_name: clientId === 'other' ? customClientName : (selectedPatient?.name || customClientName),
      payment_method: paymentMethod,
      reference_number: referenceNumber,
      receipt_number: receiptNumber,
      status: isConfirmed ? 'מאושר' : 'טיוטה'
    };

    addIncomeMutation.mutate(incomeData, {
      onSuccess: () => {
        // Reset form
        setAmount('');
        setSource('');
        setCategory('');
        setClientId('');
        setCustomClientName('');
        setPaymentMethod('');
        setReferenceNumber('');
        setReceiptNumber('');
        setIsConfirmed(false);
        const today = new Date();
        setDate(today.toISOString().split('T')[0]);
        
        onSuccess();
        onOpenChange(false);
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">הוספת הכנסה</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="date">תאריך *</Label>
                <Input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="text-right"
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
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="source">מקור הכנסה *</Label>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="client">שם משלם</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddPatientDialog(true)}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 ml-1" />
                    הוסף לקוח
                  </Button>
                </div>
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

      <AddPatientDialog
        isOpen={showAddPatientDialog}
        onClose={() => setShowAddPatientDialog(false)}
        onAddPatient={handleAddPatient}
      />
    </>
  );
};

export default AddIncomeModal;
