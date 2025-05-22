
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Plus, Search, FileEdit, Trash2, Filter, Paperclip } from 'lucide-react';
import { DateRange, Expense } from '@/types/finances';
import AddExpenseModal from './AddExpenseModal';
import { ExpenseFilters } from './ExpenseFilters';

// Dummy data - in a real app this would come from an API
const generateDummyExpenseData = (): Expense[] => {
  return [
    {
      id: 1,
      date: new Date(2023, 5, 8),
      amount: 2500,
      category: 'שכירות',
      payee: 'משכיר הנכס',
      description: 'שכירות חודשית למשרד',
      payment_method: 'העברה בנקאית',
      reference_number: '654321',
      attachment_url: 'https://example.com/receipt1.pdf',
      status: 'מאושר',
      type: 'expense'
    },
    {
      id: 2,
      date: new Date(2023, 5, 12),
      amount: 350,
      category: 'ציוד משרדי',
      payee: 'אופיס דיפו',
      description: 'רכישת ציוד משרדי',
      payment_method: 'אשראי',
      reference_number: '987654',
      attachment_url: null,
      status: 'טיוטה',
      type: 'expense'
    },
    // Add more dummy data as needed
  ];
};

interface ExpensesTableProps {
  dateRange: DateRange;
}

const ExpensesTable: React.FC<ExpensesTableProps> = ({ dateRange }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [data] = useState<Expense[]>(generateDummyExpenseData);

  const filteredData = data.filter(item => 
    item.payee.includes(searchTerm) ||
    item.category.includes(searchTerm) ||
    item.description.includes(searchTerm) ||
    item.payment_method.includes(searchTerm) ||
    (item.reference_number && item.reference_number.includes(searchTerm))
  );

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <Button 
          className="bg-purple-600 hover:bg-purple-700 text-white" 
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="ml-1 h-4 w-4" />
          הוספת הוצאה
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

      {showFilters && <ExpenseFilters />}

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table dir="rtl">
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>למי שולם</TableHead>
                <TableHead>תיאור קצר</TableHead>
                <TableHead>אמצעי תשלום</TableHead>
                <TableHead>מספר אסמכתא</TableHead>
                <TableHead>קובץ מצורף</TableHead>
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
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.payee}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.payment_method}</TableCell>
                    <TableCell>{row.reference_number || '-'}</TableCell>
                    <TableCell>
                      {row.attachment_url ? (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Paperclip className="h-4 w-4" />
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
                  <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                    לא נמצאו רשומות מתאימות
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddExpenseModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </div>
  );
};

export default ExpensesTable;
