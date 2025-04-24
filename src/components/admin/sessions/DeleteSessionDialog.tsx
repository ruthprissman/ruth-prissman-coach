
import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Session } from '@/types/patient';

interface DeleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onConfirm: () => void;
  formatDate: (date: string | null) => string;
}

const DeleteSessionDialog: React.FC<DeleteSessionDialogProps> = ({
  open,
  onOpenChange,
  session,
  onConfirm,
  formatDate
}) => {
  if (!session) return null;

  console.log('DeleteSessionDialog - Session date:', {
    original: session.session_date,
    formatted: formatDate(session.session_date)
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-purple-800">מחיקת פגישה היסטורית</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription className="space-y-4">
          <p>האם את בטוחה שברצונך למחוק את הפגישה?</p>
          
          <div className="flex items-center text-gray-700 mt-2">
            <Calendar className="h-4 w-4 ml-2 text-purple-600" />
            <span className="font-semibold">{formatDate(session.session_date)}</span>
          </div>
          
          <p className="text-red-600 text-sm mt-4">
            שימי לב: פעולה זו אינה ניתנת לביטול. כל הנתונים המשויכים לפגישה זו ימחקו.
          </p>
        </AlertDialogDescription>
        <AlertDialogFooter className="flex-row-reverse gap-2 sm:gap-0">
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            מחק פגישה
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-purple-200 text-purple-700"
          >
            ביטול
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteSessionDialog;
