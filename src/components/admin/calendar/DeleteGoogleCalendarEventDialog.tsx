
import React from "react";
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2 } from "lucide-react";
import { GoogleCalendarEvent } from "@/types/calendar";

interface DeleteGoogleCalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  googleEvent: GoogleCalendarEvent | null;
  onConfirm: () => void;
}

const DeleteGoogleCalendarEventDialog: React.FC<DeleteGoogleCalendarEventDialogProps> = ({
  open, onOpenChange, googleEvent, onConfirm
}) => {
  if (!googleEvent) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-purple-800 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" /> מחיקת פגישה מיומן Google
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription className="space-y-2">
          <p>האם למחוק את הפגישה ממערכת Google Calendar? פעולה זו אינה ניתנת לשחזור!</p>
          <div className="flex gap-2 text-gray-700">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="font-semibold">{googleEvent.summary}</span>
          </div>
        </AlertDialogDescription>
        <AlertDialogFooter className="flex-row-reverse gap-2 sm:gap-0">
          <Button 
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
            onClick={onConfirm}
          >
            מחק מגוגל
          </Button>
          <Button 
            variant="outline"
            className="border-purple-200 text-purple-700"
            onClick={() => onOpenChange(false)}
          >
            ביטול
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteGoogleCalendarEventDialog;
