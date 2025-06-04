
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, BookOpen, TrendingUp } from 'lucide-react';
import { ClientStatistics } from '@/types/session';
import { Session } from '@/types/patient';

interface ClientStatisticsCardProps {
  statistics: ClientStatistics | null;
  sessions: Session[];
  sessionPrice: number | null;
  formatDateOnly: (date: string | null) => string;
}

const ClientStatisticsCard: React.FC<ClientStatisticsCardProps> = ({ 
  statistics, 
  sessions,
  sessionPrice,
  formatDateOnly
}) => {
  // Calculate outstanding balance based on sessions
  const calculateOutstandingBalance = () => {
    if (!sessionPrice) return 0;
    
    const unpaidSessions = sessions.filter(session => 
      session.payment_status === 'pending' || session.payment_status === 'partial'
    );
    
    return unpaidSessions.reduce((total, session) => {
      if (session.payment_status === 'pending') {
        // For unpaid sessions, the full session price is owed
        return total + sessionPrice;
      } else if (session.payment_status === 'partial') {
        // For partially paid sessions, subtract what was already paid
        const paidAmount = session.paid_amount || 0;
        return total + (sessionPrice - paidAmount);
      }
      return total;
    }, 0);
  };

  const outstandingBalance = calculateOutstandingBalance();

  return (
    <Card className="border-purple-200">
      <CardHeader className="pb-3 bg-purple-50 text-right">
        <CardTitle className="text-2xl text-purple-700 flex items-center">
          <TrendingUp className="ml-2 h-5 w-5" />
          סטטיסטיקות
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {statistics ? (
          <div className="space-y-4 text-right">
            {/* Top row - Main metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-xs text-purple-600 text-center">סה״כ פגישות</div>
                <div className="text-2xl font-bold text-purple-800 text-center">{statistics.total_sessions}</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-xs text-purple-600 text-center">סה״כ חוב</div>
                <div className="text-2xl font-bold text-purple-800 text-center">₪{outstandingBalance}</div>
              </div>
            </div>
            
            {/* Bottom row - Date information */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center mb-1">
                  <Calendar className="h-4 w-4 text-gray-600" />
                </div>
                <div className="text-xs text-gray-600 text-center">פגישה אחרונה</div>
                <div className="font-medium text-center text-sm">
                  {statistics.last_session 
                    ? formatDateOnly(statistics.last_session) 
                    : 'אין פגישות'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center mb-1">
                  <Calendar className="h-4 w-4 text-gray-600" />
                </div>
                <div className="text-xs text-gray-600 text-center">פגישה הבאה</div>
                <div className="font-medium text-center text-sm">
                  {statistics.next_session 
                    ? formatDateOnly(statistics.next_session) 
                    : 'לא נקבע'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">אין נתונים סטטיסטיים זמינים</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientStatisticsCard;
