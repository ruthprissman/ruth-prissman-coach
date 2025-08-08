
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Paperclip, Eye, X } from 'lucide-react';
import { getReceiptSignedUrl, uploadReceiptForTransaction, deleteReceiptForTransaction } from '@/services/ReceiptService';

type Props = {
  transactionId: number;
  receiptPath?: string | null;
  onUploaded?: () => void;
  onDeleted?: () => void;
};

const ReceiptButtons: React.FC<Props> = ({ transactionId, receiptPath, onUploaded, onDeleted }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const [isBusy, setIsBusy] = useState(false);

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsBusy(true);
    try {
      await uploadReceiptForTransaction(transactionId, file, receiptPath || undefined);
      toast({ title: 'הקבלה הועלתה', description: 'הקובץ נשמר בהצלחה' });
      onUploaded?.();
    } catch (err: any) {
      toast({ title: 'שגיאה בהעלאה', description: err.message || 'אירעה שגיאה', variant: 'destructive' });
    } finally {
      setIsBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleView = async () => {
    if (!receiptPath) return;
    setIsBusy(true);
    try {
      const url = await getReceiptSignedUrl(receiptPath);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast({ title: 'שגיאה בפתיחת קבלה', description: err.message || 'לא ניתן לפתוח את הקובץ', variant: 'destructive' });
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!receiptPath) return;
    if (!confirm('למחוק את הקבלה המצורפת?')) return;
    setIsBusy(true);
    try {
      await deleteReceiptForTransaction(transactionId, receiptPath);
      toast({ title: 'נמחק', description: 'הקבלה נמחקה מהרשומה' });
      onDeleted?.();
    } catch (err: any) {
      toast({ title: 'שגיאה במחיקה', description: err.message || 'לא ניתן למחוק', variant: 'destructive' });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={handleClickUpload}
        disabled={isBusy}
        title={receiptPath ? 'החלפת קבלה' : 'העלאת קבלה'}
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      {receiptPath ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleView}
            disabled={isBusy}
            title="צפייה בקבלה"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleDelete}
            disabled={isBusy}
            title="מחיקת קבלה"
          >
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </>
      ) : null}
    </div>
  );
};

export default ReceiptButtons;
