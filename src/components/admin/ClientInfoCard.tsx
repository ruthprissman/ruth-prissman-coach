
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, DollarSign, FileText, PencilIcon } from 'lucide-react';
import { Patient } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import EditClientDialog from '@/components/admin/clients/EditClientDialog';

interface ClientInfoCardProps {
  patient: Patient;
  onPatientUpdated?: () => void;
}

const ClientInfoCard: React.FC<ClientInfoCardProps> = ({ patient, onPatientUpdated }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <Card className="border-purple-200 overflow-hidden relative">
      <CardHeader className="pb-3 bg-purple-50 text-right">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl text-purple-700">{patient.name}</CardTitle>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditDialogOpen(true)}
                  className="h-8 w-8 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                >
                  <PencilIcon className="h-4 w-4" />
                  <span className="sr-only">ערוך פרטי לקוח</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent dir="rtl">
                <p>ערוך פרטי לקוח</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="pt-4 text-right">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {/* Contact Details - Takes 1 column */}
          <div className="space-y-3">
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-purple-500 ml-2" />
              <div>
                <div className="text-xs text-purple-600 font-medium">טלפון</div>
                <div className="text-sm font-medium">{patient.phone || 'לא צוין'}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-purple-500 ml-2" />
              <div>
                <div className="text-xs text-purple-600 font-medium">אימייל</div>
                <div className="text-sm font-medium truncate">{patient.email || 'לא צוין'}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-purple-500 ml-2" />
              <div>
                <div className="text-xs text-purple-600 font-medium">מחיר לפגישה</div>
                <div className="text-sm font-medium">
                  {patient.session_price ? `₪${patient.session_price}` : 'לא צוין'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center">
              <FileText className="h-4 w-4 text-purple-500 ml-2" />
              <div className="text-xs text-purple-600 font-medium">הערות</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 min-h-[80px] max-h-[120px] overflow-y-auto text-gray-700 text-sm">
              {patient.notes || 'אין הערות'}
            </div>
          </div>
        </div>
      </CardContent>

      <EditClientDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        patient={patient}
        onPatientUpdated={onPatientUpdated}
      />
    </Card>
  );
};

export default ClientInfoCard;
