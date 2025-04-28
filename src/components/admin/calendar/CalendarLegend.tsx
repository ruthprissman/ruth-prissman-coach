
import React from 'react';
import { Check, Calendar, Lock, CalendarPlus, Info } from 'lucide-react';

const CalendarLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-3 mt-2 mb-4 justify-end text-xs">
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-purple-100 rounded"></div>
        <span>זמן זמין</span>
        <Check className="h-3 w-3 text-purple-600 mr-1" />
      </div>
      
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-[#5C4C8D] rounded"></div>
        <span>פגישה</span>
        <Calendar className="h-3 w-3 text-[#CFB53B] mr-1" />
      </div>
      
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-[#D3E4FD] rounded"></div>
        <span>אירוע ביומן גוגל</span>
      </div>
      
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-blue-100 rounded"></div>
        <span>פגישה לא ביומן גוגל</span>
        <Info className="h-3 w-3 text-blue-500 mr-1" />
      </div>
      
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-amber-100 rounded"></div>
        <span>זמן פרטי</span>
        <Lock className="h-3 w-3 text-amber-600 mr-1" />
      </div>
    </div>
  );
};

export default CalendarLegend;
