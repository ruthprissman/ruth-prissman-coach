
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Plus, Search, FileEdit, Trash2, Filter, ExternalLink } from 'lucide-react';
import { DateRange, Transaction } from '@/types/finances';
import AddIncomeModal from './AddIncomeModal';
import { IncomeFilters } from './IncomeFilters';

// Dummy data - in a real app this would come from an API
const generateDummyIncomeData = (): Transaction[] => {
  return [
    {
      id: 1,
      date: new Date(2023, 5, 10),
      amount: 500,
      source: 'פגישה טיפולית',
      category: 'טיפולים',
      client_name: 'ישראל ישראלי',
      client_id: 123,
      payment_method: 'אשראי',
      reference_number: '123456',
      receipt_number: 'R-1001',
      session_id: 5001,
      status: 'מאושר',
      type: 'income'
    },
    {
      id: 2,
      date: new Date(2023, 5, 15),
      amount: 350,
      source: 'ייעוץ טלפוני',
      category: 'ייעוץ',
      client_name: 'יעל כהן',
      client_id: 124,
      payment_method: 'העברה בנקאית',
      reference_number: '789012',
      receipt_number: 'R-1002',
      session_id: null,
      status: 'טיוטה',
      type: 'income'
    },
    // Add more dummy data as needed
  ];
};

interface IncomeTableProps {
  dateRange: DateRange;
}

const IncomeTable: React.FC<IncomeTableProps> = ({ dateRange }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [data] = useState<Transaction[]>(generateDummyIncomeData);

  const filteredData = data.filter(item => 
    item.client_name.includes(searchTerm) ||
    item.source.includes(searchTerm) ||
    item.category.includes(searchTerm) ||
    item.payment_method.includes(searchTerm) ||
    (item.reference_number && item.reference_number.includes(searchTerm)) ||
    (item.receipt_number && item.receipt_number.includes(searchTerm))
  );

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white" 
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="ml-1 h-4 w-4" />
          הוספת הכנסה
        </Button>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3 pr-8 w-full"
            />
          </div>
          <Button 
            variant={showFilters ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex gap-1 items-center"
          >
            <Filter className="h-4 w-4" />
            סינון
          </Button>
        </div>
      </div>

      {showFilters && <IncomeFilters />}

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table dir="rtl">
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>מקור</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>שם משלם</TableHead>
                <TableHead>אמצעי תשלום</TableHead>
                <TableHead>מספר אסמכתא</TableHead>
                <TableHead>מספר קבלה</TableHead>
                <TableHead>קישור לפגישה</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.date.toLocaleDateString('he-IL')}</TableCell>
                    <TableCell className="font-medium">₪{row.amount.toLocaleString()}</TableCell>
                    <TableCell>{row.source}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.client_name}</TableCell>
                    <TableCell>{row.payment_method}</TableCell>
                    <TableCell>{row.reference_number || '-'}</TableCell>
                    <TableCell>{row.receipt_number || '-'}</TableCell>
                    <TableCell>
                      {row.session_id ? (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        row.status === 'מאושר' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-6 text-muted-foreground">
                    לא נמצאו רשומות מתאימות
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddIncomeModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </div>
  );
};

export default IncomeTable;
