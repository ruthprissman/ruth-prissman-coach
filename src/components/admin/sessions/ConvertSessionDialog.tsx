import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { FutureSession } from '@/types/session';
import { Check, X, BadgeDollarSign } from 'lucide-react';

interface ConvertSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  futureSession: FutureSession;
  onSessionConverted: () => void;
  patientId: number;
  sessionPrice: number | null;
}

const ConvertSessionDialog: React.FC<ConvertSessionDialogProps> = ({
  isOpen,
  onClose,
  futureSession,
  onSessionConverted,
  patientId,
  sessionPrice
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [sentExercises, setSentExercises] = useState<boolean>(false);
  const [exerciseList, setExerciseList] = useState<string[]>([]);
  const [exerciseInput, setExerciseInput] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partially_paid' | 'unpaid'>('unpaid');
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bit' | 'transfer' | null>(null);
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const formatDate = (dateString: string) => {
    try {
      // Handle timestamp format from the database
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: he });
    } catch (e) {
      return dateString;
    }
  };

  const handleAddExercise = () => {
    if (exerciseInput.trim()) {
      setExerciseList([...exerciseList, exerciseInput.trim()]);
      setExerciseInput('');
    }
  };

  const handleRemoveExercise = (index: number) => {
    const newList = [...exerciseList];
    newList.splice(index, 1);
    setExerciseList(newList);
  };

  const handleConvert = async () => {
    setIsSubmitting(true);
    try {
      // Extract session date and time from the timestamp
      const sessionStartTime = futureSession.start_time;
      
      // Create new completed session with correct start_time
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert([
          {
            patient_id: patientId,
            session_date: sessionStartTime ? new Date(sessionStartTime).toISOString().split('T')[0] : null,
            session_time: sessionStartTime ? new Date(sessionStartTime).toISOString().split('T')[1].substring(0, 5) : null,
            meeting_type: futureSession.meeting_type,
            sent_exercises: sentExercises,
            exercise_list: exerciseList.length > 0 ? exerciseList : null,
            summary,
            paid_amount: paidAmount,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            payment_date: paymentStatus === 'paid' ? new Date().toISOString() : null,
            payment_notes: paymentNotes || null
          }
        ])
        .select();

      if (sessionError) throw sessionError;

      // Delete the future session
      const { error: deleteError } = await supabase
        .from('future_sessions')
        .delete()
        .eq('id', futureSession.id);

      if (deleteError) throw deleteError;

      toast({
        title: "פגישה הומרה בהצלחה",
        description: "הפגישה העתידית הומרה לפגישה שהושלמה"
      });

      onSessionConverted();
    } catch (error: any) {
      console.error('Error converting session:', error);
      toast({
        title: "שגיאה בהמרת הפגישה",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-purple-800">המרת פגישה עתידית לפגישה שהושלמה</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-purple-50 rounded-md border border-purple-200">
            <p className="text-center text-purple-800">
              המרת הפגישה מתאריך<br />
              <span className="font-bold">{formatDate(futureSession.scheduled_date)}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary" className="text-purple-700">סיכום פגישה</Label>
            <Textarea 
              id="summary" 
              placeholder="הוסף סיכום לפגישה..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="border-purple-200 focus-visible:ring-purple-500 min-h-[100px]"
            />
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox 
              id="sentExercises" 
              checked={sentExercises}
              onCheckedChange={(checked) => setSentExercises(checked as boolean)}
              className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
            />
            <Label htmlFor="sentExercises" className="text-purple-700">נשלחו תרגילים</Label>
          </div>

          {sentExercises && (
            <div className="space-y-2 p-3 bg-purple-50 rounded-md border border-purple-200">
              <Label htmlFor="exercises" className="text-purple-700">תרגילים שניתנו</Label>
              
              <div className="flex space-x-2 space-x-reverse">
                <Input
                  id="exercises"
                  placeholder="שם התרגיל..."
                  value={exerciseInput}
                  onChange={(e) => setExerciseInput(e.target.value)}
                  className="border-purple-200 focus-visible:ring-purple-500"
                />
                <Button 
                  type="button" 
                  onClick={handleAddExercise}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  הוסף
                </Button>
              </div>
              
              {exerciseList.length > 0 && (
                <div className="mt-2">
                  <ul className="space-y-1">
                    {exerciseList.map((exercise, index) => (
                      <li key={index} className="flex justify-between items-center bg-white p-2 rounded border border-purple-100">
                        <span>{exercise}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveExercise(index)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 p-3 bg-purple-50 rounded-md border border-purple-200">
            <h3 className="font-medium text-purple-800">פרטי תשלום</h3>
            
            <div className="space-y-2">
              <Label htmlFor="paymentStatus" className="text-purple-700">סטטוס תשלום</Label>
              <Select
                value={paymentStatus}
                onValueChange={(value) => setPaymentStatus(value as 'paid' | 'partially_paid' | 'unpaid')}
              >
                <SelectTrigger id="paymentStatus" className="border-purple-200 focus-visible:ring-purple-500">
                  <SelectValue placeholder="בחר סטטוס תשלום" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">שולם</SelectItem>
                  <SelectItem value="partially_paid">שולם חלקית</SelectItem>
                  <SelectItem value="unpaid">לא שולם</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {paymentStatus !== 'unpaid' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="paidAmount" className="text-purple-700">סכום ששולם (₪)</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    placeholder={sessionPrice ? `${sessionPrice}` : '0'}
                    value={paidAmount === null ? '' : paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value === '' ? null : Number(e.target.value))}
                    className="border-purple-200 focus-visible:ring-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod" className="text-purple-700">אמצעי תשלום</Label>
                  <Select
                    value={paymentMethod || ''}
                    onValueChange={(value) => setPaymentMethod(value === '' ? null : value as 'cash' | 'bit' | 'transfer')}
                  >
                    <SelectTrigger id="paymentMethod" className="border-purple-200 focus-visible:ring-purple-500">
                      <SelectValue placeholder="בחר אמצעי תשלום" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">מזומן</SelectItem>
                      <SelectItem value="bit">ביט</SelectItem>
                      <SelectItem value="transfer">העברה בנקאית</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="paymentNotes" className="text-purple-700">הערות תשלום</Label>
              <Textarea
                id="paymentNotes"
                placeholder="הוסף הערות לגבי התשלום..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="border-purple-200 focus-visible:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
          <Button 
            onClick={handleConvert}
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? 'מבצע המרה...' : 'המר פגישה'}
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConvertSessionDialog;
