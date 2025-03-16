
import React from 'react';
import { Info, BadgeDollarSign, Check, X } from 'lucide-react';
import { Session } from '@/types/patient';
import { 
  Collapsible, 
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';

interface SessionDetailCollapsibleProps {
  session: Session;
  formatDate?: (dateString: string) => string;
  formatDateOnly?: (date: string | null) => string;
  getPaymentMethodText: (method: string | null) => string;
  isExpanded?: boolean;
  onToggle?: () => void;
  client?: {
    session_price: number | null;
  };
}

const SessionDetailCollapsible: React.FC<SessionDetailCollapsibleProps> = ({
  session,
  formatDate,
  formatDateOnly = (date) => date || '-',
  getPaymentMethodText,
  isExpanded,
  onToggle,
  client = { session_price: 0 }
}) => {
  return (
    <div className="p-4 bg-purple-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2 flex items-center text-purple-700">
              <Info className="h-4 w-4 ml-2 text-purple-600" />
              סיכום פגישה
            </h4>
            <div className="bg-white p-3 rounded border border-purple-100 min-h-[100px]">
              {session.summary || 'אין סיכום'}
            </div>
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              <h4 className="font-medium text-purple-700">נשלחו תרגילים?</h4>
              <div className="flex items-center mr-4">
                {session.sent_exercises ? (
                  <>
                    <Check className="h-4 w-4 text-green-500 ml-1" />
                    <span className="text-green-600">כן</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-red-500 ml-1" />
                    <span className="text-red-600">לא</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2 text-purple-700">תרגילים שניתנו</h4>
          {session.exercise_list && session.exercise_list.length > 0 ? (
            <div className="bg-white p-3 rounded border border-purple-100">
              <ul className="list-disc list-inside space-y-1">
                {session.exercise_list.map((exercise, index) => (
                  <li key={index} className="text-purple-800">{exercise}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white p-3 rounded border border-purple-100 min-h-[100px]">
              לא ניתנו תרגילים
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="font-medium mb-2 flex items-center text-purple-700">
          <BadgeDollarSign className="h-4 w-4 ml-2 text-purple-600" />
          פרטי תשלום
        </h4>
        <div className="bg-white p-3 rounded border border-purple-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-purple-600">סטטוס תשלום:</span>
                <span>{session.payment_status}</span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="font-medium text-purple-600">סכום ששולם:</span>
                <span className={session.payment_status === 'paid' ? 'text-green-600 font-medium' : ''}>
                  ₪{session.paid_amount || 0}
                </span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="font-medium text-purple-600">סכום לתשלום:</span>
                <span className={session.payment_status === 'unpaid' ? 'text-red-600 font-medium' : ''}>
                  {client.session_price && session.paid_amount
                    ? session.payment_status === 'paid'
                      ? '₪0'
                      : `₪${client.session_price - (session.paid_amount || 0)}`
                    : `₪${client.session_price || 0}`}
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-purple-600">אמצעי תשלום:</span>
                <span>{getPaymentMethodText(session.payment_method)}</span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="font-medium text-purple-600">תאריך תשלום:</span>
                <span>{formatDateOnly(session.payment_date)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium text-purple-600">הערות תשלום:</span>
                <span>{session.payment_notes || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailCollapsible;
