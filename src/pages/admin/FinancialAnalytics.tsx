
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MonthlyFinanceChart from '@/components/admin/analytics/MonthlyFinanceChart';
import IncomePieChart from '@/components/admin/analytics/IncomePieChart';
import ExpensesPieChart from '@/components/admin/analytics/ExpensesPieChart';
import ProfitTrendChart from '@/components/admin/analytics/ProfitTrendChart';
import TopClientsChart from '@/components/admin/analytics/TopClientsChart';

const FinancialAnalytics = () => {
  return (
    <AdminLayout title="ניתוחים גרפיים">
      <Helmet>
        <title>ניתוחים גרפיים</title>
      </Helmet>

      <div className="space-y-6">
        {/* Monthly comparison chart */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-right">השוואת הכנסות והוצאות חודשית</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyFinanceChart />
          </CardContent>
        </Card>

        {/* Two pie charts in a grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-right">הכנסות לפי קטגוריה</CardTitle>
            </CardHeader>
            <CardContent>
              <IncomePieChart />
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-right">הוצאות לפי קטגוריה</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpensesPieChart />
            </CardContent>
          </Card>
        </div>

        {/* Profit trend line chart */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-right">מגמת רווחים</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfitTrendChart />
          </CardContent>
        </Card>

        {/* Top clients chart */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-right">לקוחות מובילים</CardTitle>
          </CardHeader>
          <CardContent>
            <TopClientsChart />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default FinancialAnalytics;
