
import React, { useRef, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DebugLogPanelProps {
  logs: string[];
  onClose: () => void;
  title?: string;
  forceShow?: boolean;
}

const DebugLogPanel: React.FC<DebugLogPanelProps> = ({ 
  logs, 
  onClose,
  title = 'יומן שגיאות',
  forceShow = false
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0 && !forceShow) {
    return null;
  }

  return (
    <Card className="mt-4 border-red-200" dir="rtl">
      <CardHeader className="bg-red-50 py-2 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700">
          <AlertCircle className="h-4 w-4" />
          {title}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6 text-red-700 hover:text-red-900 hover:bg-red-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64 border-t border-red-100" dir="ltr">
          <div className="p-4 font-mono text-xs" ref={scrollRef}>
            {logs.map((log, index) => (
              <div key={index} className="mb-1 pb-1 border-b border-red-50 whitespace-pre-wrap break-words" dir="rtl">
                {log}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t border-red-100 py-2 px-4 flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClose}
          className="text-xs"
        >
          סגור
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DebugLogPanel;
