import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Lead = {
  id: string;
  created_at: string | null;
  date: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  referrer_name: string | null;
  status: string | null;
  content_type: string | null;
  first_meeting: string | null;
  second_meeting: string | null;
  first_call_summary: string | null;
  second_call_summary: string | null;
  quoted_price: string | null;
  notes: string | null;
  updated_at: string | null;
  updated_by: string | null;
};

interface EditLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated: () => void;
}

const STATUS_OPTIONS = [
  'Closed – Meetings started',
  'No', 
  'Pending'
];

const CONTENT_TYPE_OPTIONS = [
  'מאמר',
  'סיפור',
  'שיר',
  'סדנה',
  'ייעוץ אישי',
  'אחר'
];

const SOURCE_OPTIONS = [
  'Instagram',
  'Website', 
  'Facebook',
  'Google',
  'הפניה',
  'אחר'
];

export const EditLeadDialog: React.FC<EditLeadDialogProps> = ({
  lead,
  open,
  onOpenChange,
  onLeadUpdated
}) => {
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [loading, setLoading] = useState(false);
  const [firstMeetingDate, setFirstMeetingDate] = useState<Date | undefined>(undefined);
  const [secondMeetingDate, setSecondMeetingDate] = useState<Date | undefined>(undefined);
  const [leadDate, setLeadDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (lead) {
      setFormData(lead);
      setFirstMeetingDate(lead.first_meeting ? new Date(lead.first_meeting) : undefined);
      setSecondMeetingDate(lead.second_meeting ? new Date(lead.second_meeting) : undefined);
      setLeadDate(lead.date ? new Date(lead.date) : undefined);
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setLoading(true);
    try {
      const updateData = {
        ...formData,
        date: leadDate ? leadDate.toISOString().split('T')[0] : null,
        first_meeting: firstMeetingDate ? firstMeetingDate.toISOString().split('T')[0] : null,
        second_meeting: secondMeetingDate ? secondMeetingDate.toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', lead.id);

      if (error) throw error;

      toast({
        title: 'הצלחה',
        description: 'הליד עודכן בהצלחה',
      });

      onLeadUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בעדכון הליד',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Lead, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-lead-description">
        <DialogHeader>
          <DialogTitle>ערוך ליד</DialogTitle>
          <DialogDescription id="edit-lead-description">
            ערוך את פרטי הליד {lead.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Basic Information */}
            <div className="space-y-2">
              <Label htmlFor="name">שם *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            {/* Lead Date */}
            <div className="space-y-2">
              <Label>תאריך ליד</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !leadDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {leadDate ? format(leadDate, "dd/MM/yyyy", { locale: he }) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={leadDate}
                    onSelect={setLeadDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Source and Referrer */}
            <div className="space-y-2">
              <Label htmlFor="source">מאיפה הגיע</Label>
              <Select value={formData.source || ''} onValueChange={(value) => handleInputChange('source', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר מקור" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referrer_name">שם הממליץ</Label>
              <Input
                id="referrer_name"
                value={formData.referrer_name || ''}
                onChange={(e) => handleInputChange('referrer_name', e.target.value)}
              />
            </div>

            {/* Status and Content Type */}
            <div className="space-y-2">
              <Label htmlFor="status">סטטוס</Label>
              <Select value={formData.status || ''} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_type">סוג תוכן</Label>
              <Select value={formData.content_type || ''} onValueChange={(value) => handleInputChange('content_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג תוכן" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Meeting Dates */}
            <div className="space-y-2">
              <Label>פגישה ראשונה</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !firstMeetingDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {firstMeetingDate ? format(firstMeetingDate, "dd/MM/yyyy", { locale: he }) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={firstMeetingDate}
                    onSelect={setFirstMeetingDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>פגישה שנייה</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !secondMeetingDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {secondMeetingDate ? format(secondMeetingDate, "dd/MM/yyyy", { locale: he }) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={secondMeetingDate}
                    onSelect={setSecondMeetingDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quoted_price">מחיר שנמסר</Label>
              <Input
                id="quoted_price"
                value={formData.quoted_price || ''}
                onChange={(e) => handleInputChange('quoted_price', e.target.value)}
                placeholder="₪"
              />
            </div>
          </div>

          {/* Text Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_call_summary">סיכום שיחה ראשונה</Label>
              <Textarea
                id="first_call_summary"
                value={formData.first_call_summary || ''}
                onChange={(e) => handleInputChange('first_call_summary', e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="second_call_summary">סיכום שיחה שנייה</Label>
              <Textarea
                id="second_call_summary"
                value={formData.second_call_summary || ''}
                onChange={(e) => handleInputChange('second_call_summary', e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};