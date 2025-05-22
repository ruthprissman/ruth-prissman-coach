
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, UploadCloud } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ open, onOpenChange }) => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [isConfirmed, setIsConfirmed] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    onOpenChange(false);
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
              <Input id="amount" type="number" placeholder="הזן סכום" required />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="category">קטגוריה *</Label>
              <Select required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">שכירות</SelectItem>
                  <SelectItem value="supplies">ציוד משרדי</SelectItem>
                  <SelectItem value="services">שירותים מקצועיים</SelectItem>
                  <SelectItem value="taxes">מסים</SelectItem>
                  <SelectItem value="utilities">חשבונות</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="payee">למי שולם *</Label>
              <Input id="payee" placeholder="הזן שם ספק" required />
            </div>

            <div className="flex flex-col space-y-2 col-span-full">
              <Label htmlFor="description">תיאור קצר</Label>
              <Textarea id="description" placeholder="הוסף תיאור להוצאה..." />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="payment_method">אמצעי תשלום *</Label>
              <Select required>
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="בחר אמצעי תשלום" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">אשראי</SelectItem>
                  <SelectItem value="transfer">העברה בנקאית</SelectItem>
                  <SelectItem value="cash">מזומן</SelectItem>
                  <SelectItem value="check">צ'ק</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="reference">מספר אסמכתא</Label>
              <Input id="reference" placeholder="הזן מספר אסמכתא" />
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
            <Button type="submit">שמור</Button>
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
