
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FutureSession } from '@/types/session';
import { formatDateInIsraelTimeZone } from '@/utils/dateUtils';

interface DeleteFutureSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: FutureSession | null;
  onConfirm: () => void;
  formatDate?: (dateString: string) => string; // Added optional formatDate prop
}

const DeleteFutureSessionDialog: React.FC<DeleteFutureSessionDialogProps> = ({
  open,
  onOpenChange,
  session,
  onConfirm,
  formatDate: customFormatDate, // Renamed to avoid conflict with local function
}) => {
  const formatDate = (dateString: string) => {
    if (customFormatDate) {
      return customFormatDate(dateString);
    }
    return formatDateInIsraelTimeZone(dateString, 'dd/MM/yyyy HH:mm');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>מחיקת פגישה עתידית</DialogTitle>
          <DialogDescription>
            {session && (
              <>
                האם אתה בטוח שברצונך למחוק את הפגישה העתידית מהתאריך {" "}
                {formatDate(session.session_date)}?
                <div className="mt-2 text-red-500">
                  פעולה זו לא ניתנת לביטול לאחר אישור.
                </div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            ביטול
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
          >
            כן, מחק פגישה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteFutureSessionDialog;
