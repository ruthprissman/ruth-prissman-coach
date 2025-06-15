
import React from 'react';

const MeetingTypeLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-4 items-center text-xs text-gray-600">
      <div className="flex items-center gap-1.5">
        <span className="text-base select-none">👤</span>
        <span>פגישה רגילה</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-base select-none">📝</span>
        <span>פגישת אינטייק</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-base select-none">⚡</span>
        <span>פגישת SEFT</span>
      </div>
    </div>
  );
};

export default MeetingTypeLegend;
