
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Plus, Search, FileEdit, Trash2, Filter, ExternalLink, Import } from 'lucide-react';
import { DateRange, Transaction } from '@/types/finances';
import AddIncomeModal from './AddIncomeModal';
import EditIncomeModal from './EditIncomeModal';
import ImportIncomeFromSessionsModal from './ImportIncomeFromSessionsModal';
import { IncomeFilters } from './IncomeFilters';

interface IncomeTableProps {
  dateRange: DateRange;
  data: Transaction[];
  isLoading: boolean;
  onRefresh: () => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: number) => void;
}

// מיפוי לתצוגה בעברית
const categoryDisplayMapping = {
  'therapy': 'טיפולים',
  'consultation': 'ייעוץ',
  'workshop': 'סדנאות',
  'other': 'אחר'
};

const paymentMethodDisplayMapping = {
  'cash': 'מזומן',
  'bit': 'ביט',
  'transfer': 'העברה'
};

const IncomeTable: React.FC<IncomeTableProps> = ({ 
  dateRange,
  data,
  isLoading,
  onRefresh,
  onEdit,
  onDelete
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<any>({});

  const filteredData = data.filter(item => {
    // סינון טקסט
    const textMatch = (item.client_name && item.client_name.includes(searchTerm)) ||
      (item.source && item.source.includes(searchTerm)) ||
      (item.category && item.category.includes(searchTerm)) ||
      (item.payment_method && item.payment_method.includes(searchTerm)) ||
      (item.reference_number && item.reference_number.includes(searchTerm)) ||
      (item.receipt_number && item.receipt_number.includes(searchTerm));

    if (searchTerm && !textMatch) return false;

    // סינון תאריך
    if (filters.date) {
      const itemDate = new Date(item.date);
      const filterDate = new Date(filters.date);
      if (itemDate.toDateString() !== filterDate.toDateString()) return false;
    }

    // סינון קטגוריה
    if (filters.category && item.category !== filters.category) return false;

    // סינון אמצעי תשלום
    if (filters.paymentMethod && item.payment_method !== filters.paymentMethod) return false;

    // סינון לקוח
    if (filters.client && item.client_name && !item.client_name.includes(filters.client)) return false;

    return true;
  });

  const handleAddSuccess = () => {
    setShowAddModal(false);
    onRefresh();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedTransaction(null);
    onRefresh();
  };

  const handleImportSuccess = () => {
    setShowImportModal(false);
    onRefresh();
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowEditModal(true);
  };

  const handleDelete = (id: number) => {
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex gap-2">
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white" 
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="ml-1 h-4 w-4" />
            הוספת הכנסה
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setShowImportModal(true)}
          >
            <Import className="ml-1 h-4 w-4" />
            ייבוא הכנסות מפגישות
          </Button>
        </div>
        
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

      {showFilters && <IncomeFilters onFiltersChange={handleFiltersChange} />}

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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-6">
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
                    <TableCell>{row.source}</TableCell>
                    <TableCell>{categoryDisplayMapping[row.category as keyof typeof categoryDisplayMapping] || row.category}</TableCell>
                    <TableCell>{row.client_name}</TableCell>
                    <TableCell>{paymentMethodDisplayMapping[row.payment_method as keyof typeof paymentMethodDisplayMapping] || row.payment_method}</TableCell>
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
                        row.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.status === 'confirmed' ? 'מאושר' : 'טיוטה'}
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
                        >
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
        onSuccess={handleAddSuccess}
      />

      <EditIncomeModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        transaction={selectedTransaction}
        onSuccess={handleEditSuccess}
      />

      <ImportIncomeFromSessionsModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default IncomeTable;
