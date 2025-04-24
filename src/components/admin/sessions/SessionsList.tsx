
import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Monitor, Phone, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Session } from '@/types/patient';
import { SessionWithPatient } from '@/types/session';

interface SessionsListProps {
  sessions: SessionWithPatient[];
  formatDate: (dateString: string) => string;
  onEditSession: (session: Session) => void;
  onDeleteSession: (session: Session) => void;
}

const SessionsList: React.FC<SessionsListProps> = ({
  sessions,
  formatDate,
  onEditSession,
  onDeleteSession,
}) => {
  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'Zoom':
        return <Monitor className="h-4 w-4 ml-2" />;
      case 'Phone':
        return <Phone className="h-4 w-4 ml-2" />;
      case 'In-Person':
        return <User className="h-4 w-4 ml-2" />;
      default:
        return <Calendar className="h-4 w-4 ml-2" />;
    }
  };

  // Debug logs to check the session dates
  React.useEffect(() => {
    if (sessions.length > 0) {
      console.log('SessionsList received sessions:', sessions.length);
      console.log('First session date (raw):', sessions[0].session_date);
      console.log('First session formatted date:', formatDate(sessions[0].session_date));
    }
  }, [sessions, formatDate]);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b">
        <h3 className="text-lg font-bold">רשימת הפגישות ({sessions.length})</h3>
      </div>
      
      {sessions.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">לא נמצאו פגישות התואמות את הסינון.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם המטופל</th>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך פגישה</th>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סוג פגישה</th>
                <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessions.map((session) => {
                // Log the session date before formatting to help debug
                console.log(`Session ${session.id} original date:`, session.session_date);
                const formattedDate = formatDate(session.session_date);
                console.log(`Session ${session.id} formatted date:`, formattedDate);
                
                return (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <Link 
                        to={`/admin/patients/${session.patient_id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {session.patients.name}
                      </Link>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {formattedDate}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        {getMeetingTypeIcon(session.meeting_type)}
                        <span>{session.meeting_type === 'Zoom' ? 'זום' : 
                               session.meeting_type === 'Phone' ? 'טלפון' : 'פגישה פרונטלית'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          variant="ghost" 
                          size="sm"
                          onClick={() => onEditSession(session)}
                          className="flex items-center"
                        >
                          <Edit className="h-4 w-4 ml-2" />
                          עריכה
                        </Button>
                        <Button
                          variant="ghost" 
                          size="sm"
                          onClick={() => onDeleteSession(session)}
                          className="flex items-center text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          מחיקה
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SessionsList;
