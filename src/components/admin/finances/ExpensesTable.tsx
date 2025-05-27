
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Plus, Search, FileEdit, Trash2, Filter, Paperclip } from 'lucide-react';
import { DateRange, Expense } from '@/types/finances';
import AddExpenseModal from './AddExpenseModal';
import EditExpenseModal from './EditExpenseModal';
import { ExpenseFilters } from './ExpenseFilters';
import { useExpenseData } from '@/hooks/useExpenseData';

interface ExpensesTableProps {
  dateRange: DateRange;
}

// מיפוי לתצוגה בעברית
const categoryDisplayMapping = {
  'rent': 'שכירות',
  'supplies': 'ציוד משרדי',
  'services': 'שירותים מקצועיים',
  'taxes': 'מסים',
  'utilities': 'חשבונות',
  'other': 'אחר'
};

const paymentMethodDisplayMapping = {
  'credit': 'אשראי',
  'transfer': 'העברה בנקאית',
  'cash': 'מזומן',
  'check': 'צ\'ק'
};

// מיפוי סטטוס מאנגלית לעברית
const statusMapping = {
  'confirmed': 'מאושר',
  'draft': 'טיוטה'
};

const ExpensesTable: React.FC<ExpensesTableProps> = ({ dateRange }) => {
  console.log('ExpensesTable: Received dateRange:', dateRange);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<any>({});

  // Use the expense data hook with filters
  const { 
    expenseData, 
    isLoading, 
    error, 
    handleDelete, 
    handleRefresh,
    isDeleting 
  } = useExpenseData(dateRange, appliedFilters);

  console.log('ExpensesTable: Applied filters:', appliedFilters);
  console.log('ExpensesTable: Expense data:', expenseData);

  // Only apply local search filter now, since DB filters are handled by the hook
  const filteredData = expenseData.filter(item => {
    if (!searchTerm) return true;
    
    const textMatch = (item.payee && item.payee.includes(searchTerm)) ||
      (item.category && item.category.includes(searchTerm)) ||
      (item.description && item.description.includes(searchTerm)) ||
      (item.payment_method && item.payment_method.includes(searchTerm)) ||
      (item.reference_number && item.reference_number.includes(searchTerm));

    return textMatch;
  });

  console.log('ExpensesTable: Filtered data after local search:', filteredData);

  const handleAddSuccess = () => {
    setShowAddModal(false);
    handleRefresh();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedExpense(null);
    handleRefresh();
  };

  const handleEdit = (expense: Expense) => {
    console.log('Edit expense clicked:', expense);
    setSelectedExpense(expense);
    setShowEditModal(true);
  };

  const handleFiltersChange = (newFilters: any) => {
    console.log('ExpensesTable: Filters changed to:', newFilters);
    setAppliedFilters(newFilters);
  };

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

      {showFilters && <ExpenseFilters onFiltersChange={handleFiltersChange} />}

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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-6">
                    <div className="flex justify-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                    </div>
                    <div className="mt-2">טוען נתונים...</div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.date instanceof Date ? row.date.toLocaleDateString('he-IL') : new Date(row.date).toLocaleDateString('he-IL')}</TableCell>
                    <TableCell className="font-medium">₪{row.amount.toLocaleString()}</TableCell>
                    <TableCell>{categoryDisplayMapping[row.category as keyof typeof categoryDisplayMapping] || row.category}</TableCell>
                    <TableCell>{row.payee}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{paymentMethodDisplayMapping[row.payment_method as keyof typeof paymentMethodDisplayMapping] || row.payment_method}</TableCell>
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
                        row.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {statusMapping[row.status as keyof typeof statusMapping] || row.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          onClick={() => handleEdit(row)}
                        >
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          onClick={() => handleDelete(row.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                    {expenseData.length === 0 && !isLoading ? 'לא נמצאו הוצאות בטווח התאריכים הנבחר' : 'לא נמצאו רשומות מתאימות'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 text-xs">
          <div>Total data items: {expenseData.length}</div>
          <div>Filtered items: {filteredData.length}</div>
          <div>Is loading: {isLoading.toString()}</div>
          <div>Applied filters: {JSON.stringify(appliedFilters)}</div>
          <div>Date range: {dateRange.start.toISOString()} - {dateRange.end.toISOString()}</div>
        </div>
      )}

      <AddExpenseModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleAddSuccess}
      />

      <EditExpenseModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        expense={selectedExpense}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default ExpensesTable;
