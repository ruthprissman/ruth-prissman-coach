
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
    <Card className="border-purple-200 overflow-hidden relative" dir="rtl">
      <CardHeader className="pb-3 bg-purple-50">
        <div className="flex flex-row-reverse justify-between items-center">
          <CardTitle className="text-2xl text-purple-700 text-right">{patient.name}</CardTitle>
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
      <CardContent className="pt-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-start flex-row-reverse">
              <Phone className="h-5 w-5 text-purple-500 mt-0.5 mr-2" />
              <div className="w-full text-right">
                <div className="text-sm text-purple-600 font-medium">טלפון</div>
                <div className="font-medium">{patient.phone || 'לא צוין'}</div>
              </div>
            </div>
            
            <div className="flex items-start flex-row-reverse">
              <Mail className="h-5 w-5 text-purple-500 mt-0.5 mr-2" />
              <div className="w-full text-right">
                <div className="text-sm text-purple-600 font-medium">אימייל</div>
                <div className="font-medium">{patient.email || 'לא צוין'}</div>
              </div>
            </div>
            
            <div className="flex items-start flex-row-reverse">
              <DollarSign className="h-5 w-5 text-purple-500 mt-0.5 mr-2" />
              <div className="w-full text-right">
                <div className="text-sm text-purple-600 font-medium">מחיר לפגישה</div>
                <div className="font-medium">
                  {patient.session_price ? `₪${patient.session_price}` : 'לא צוין'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start flex-row-reverse">
              <FileText className="h-5 w-5 text-purple-500 mt-0.5 mr-2" />
              <div className="flex-1">
                <div className="text-sm text-purple-600 font-medium text-right">הערות</div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 min-h-[100px] text-gray-700 text-right">
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
