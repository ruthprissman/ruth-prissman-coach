
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, BookOpen } from 'lucide-react';
import { ClientStatistics } from '@/types/session';

interface ClientStatisticsCardProps {
  statistics: ClientStatistics | null;
  formatDateOnly: (date: string | null) => string;
}

const ClientStatisticsCard: React.FC<ClientStatisticsCardProps> = ({ 
  statistics, 
  formatDateOnly
}) => {
  return (
    <Card className="border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-purple-700">סטטיסטיקות</CardTitle>
      </CardHeader>
      <CardContent>
        {statistics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-purple-50 rounded-md border border-purple-200">
                <div className="text-sm text-purple-600">סה״כ פגישות</div>
                <div className="text-2xl font-bold text-purple-800">{statistics.total_sessions}</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-md border border-purple-200">
                <div className="text-sm text-purple-600">סה״כ חוב</div>
                <div className="text-2xl font-bold text-purple-800">₪{statistics.total_debt}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-purple-50 rounded-md border border-purple-200">
                <div className="text-sm text-purple-600">פגישה אחרונה</div>
                <div className="font-medium">
                  {statistics.last_session 
                    ? formatDateOnly(statistics.last_session) 
                    : 'אין פגישות'}
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-md border border-purple-200">
                <div className="text-sm text-purple-600">פגישה הבאה</div>
                <div className="font-medium">
                  {statistics.next_session 
                    ? formatDateOnly(statistics.next_session) 
                    : 'לא נקבע'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">אין נתונים סטטיסטיים זמינים</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientStatisticsCard;
