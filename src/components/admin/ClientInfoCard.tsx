
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, DollarSign, FileText } from 'lucide-react';
import { Patient } from '@/types/patient';

interface ClientInfoCardProps {
  patient: Patient;
}

const ClientInfoCard: React.FC<ClientInfoCardProps> = ({ patient }) => {
  return (
    <Card className="border-purple-200 overflow-hidden">
      <CardHeader className="pb-3 bg-purple-50">
        <CardTitle className="text-2xl text-purple-700">{patient.name}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-start">
              <Phone className="h-5 w-5 text-purple-500 mt-0.5 ml-2" />
              <div>
                <div className="text-sm text-purple-600 font-medium">טלפון</div>
                <div className="font-medium">{patient.phone || 'לא צוין'}</div>
              </div>
            </div>
            
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-purple-500 mt-0.5 ml-2" />
              <div>
                <div className="text-sm text-purple-600 font-medium">אימייל</div>
                <div className="font-medium">{patient.email || 'לא צוין'}</div>
              </div>
            </div>
            
            <div className="flex items-start">
              <DollarSign className="h-5 w-5 text-purple-500 mt-0.5 ml-2" />
              <div>
                <div className="text-sm text-purple-600 font-medium">מחיר לפגישה</div>
                <div className="font-medium">
                  {patient.session_price ? `₪${patient.session_price}` : 'לא צוין'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-purple-500 mt-0.5 ml-2" />
              <div className="flex-1">
                <div className="text-sm text-purple-600 font-medium">הערות</div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 min-h-[100px] text-gray-700">
              {patient.notes || 'אין הערות'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientInfoCard;
