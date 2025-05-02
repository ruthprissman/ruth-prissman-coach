
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CalendarPage = () => {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>לוח שנה</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">תוכן לוח השנה יופיע כאן</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPage;
