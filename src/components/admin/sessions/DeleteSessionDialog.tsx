
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
import { Session } from '@/types/patient';

interface DeleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onConfirm: () => void;
  formatDate: (dateString: string) => string;
}

const DeleteSessionDialog: React.FC<DeleteSessionDialogProps> = ({
  open,
  onOpenChange,
  session,
  onConfirm,
  formatDate,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>מחיקת פגישה</DialogTitle>
          <DialogDescription>
            {session && (
              <>
                האם אתה בטוח שברצונך למחוק את הפגישה מהתאריך {" "}
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

export default DeleteSessionDialog;
