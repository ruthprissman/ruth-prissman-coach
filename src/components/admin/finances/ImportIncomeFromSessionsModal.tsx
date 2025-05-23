
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Download } from 'lucide-react';

interface ImportIncomeFromSessionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface SessionForImport {
  id: number;
  payment_date: string;
  paid_amount: number;
  payment_method: string;
  patient_id: number;
  patient_name: string;
}

const ImportIncomeFromSessionsModal: React.FC<ImportIncomeFromSessionsModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [daysBack, setDaysBack] = useState(60);
  const [searchTriggered, setSearchTriggered] = useState(false);

  // Query for sessions eligible for import
  const { data: sessionsToImport, isLoading: isSearching, refetch: searchSessions } = useQuery({
    queryKey: ['sessionsForImport', daysBack],
    queryFn: async () => {
      const supabase = supabaseClient();
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - daysBack);
      
      // Get sessions with payments in the specified period
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          payment_date,
          paid_amount,
          payment_method,
          patient_id,
          patients:patient_id (
            id,
            name
          )
        `)
        .gt('paid_amount', 0)
        .gte('payment_date', daysAgo.toISOString().split('T')[0])
        .not('payment_date', 'is', null);

      if (sessionsError) {
        throw sessionsError;
      }

      if (!sessions || sessions.length === 0) {
        return [];
      }

      // Check which sessions already exist in transactions
      const { data: existingTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('session_id')
        .eq('type', 'income')
        .in('session_id', sessions.map(s => s.id));

      if (transactionsError) {
        throw transactionsError;
      }

      const existingSessionIds = new Set(
        existingTransactions?.map(t => t.session_id) || []
      );

      // Filter out sessions that already exist in transactions
      const eligibleSessions = sessions
        .filter(session => !existingSessionIds.has(session.id))
        .map(session => ({
          id: session.id,
          payment_date: session.payment_date,
          paid_amount: session.paid_amount,
          payment_method: session.payment_method,
          patient_id: session.patient_id,
          patient_name: (session.patients as any)?.name || 'לא ידוע'
        }));

      return eligibleSessions as SessionForImport[];
    },
    enabled: false // Only run when manually triggered
  });

  // Mutation for importing sessions
  const importMutation = useMutation({
    mutationFn: async (sessions: SessionForImport[]) => {
      const supabase = supabaseClient();
      
      const transactionsToInsert = sessions.map(session => {
        // Map payment method
        let mappedPaymentMethod = 'אחר';
        if (session.payment_method === 'cash') {
          mappedPaymentMethod = 'מזומן';
        } else if (session.payment_method === 'bit') {
          mappedPaymentMethod = 'ביט';
        } else if (session.payment_method === 'transfer') {
          mappedPaymentMethod = 'העברה';
        }

        return {
          type: 'income',
          date: session.payment_date,
          amount: session.paid_amount,
          client_id: session.patient_id,
          source: 'session',
          session_id: session.id,
          payment_method: mappedPaymentMethod,
          status: 'draft',
          category: 'טיפול',
          client_name: session.patient_name
        };
      });

      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (error) {
        throw error;
      }

      return transactionsToInsert.length;
    },
    onSuccess: (importedCount) => {
      toast({
        title: "הייבוא הושלם בהצלחה",
        description: `יובאו ${importedCount} רשומות הכנסה מפגישות`,
      });
      // Invalidate both transactions and incomeData queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['incomeData'] });
      onSuccess?.();
      onOpenChange(false);
      setSearchTriggered(false);
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בייבוא",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSearch = () => {
    setSearchTriggered(true);
    searchSessions();
  };

  const handleImport = () => {
    if (sessionsToImport && sessionsToImport.length > 0) {
      importMutation.mutate(sessionsToImport);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchTriggered(false);
    setDaysBack(60);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>ייבוא הכנסות מפגישות</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Controls */}
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="daysBack">מספר ימים אחורה</Label>
              <Input
                id="daysBack"
                type="number"
                value={daysBack}
                onChange={(e) => setDaysBack(Number(e.target.value))}
                className="w-32"
                min="1"
                max="365"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="ml-2 h-4 w-4" />
              {isSearching ? 'מחפש...' : 'חיפוש'}
            </Button>
          </div>

          {/* Results */}
          {searchTriggered && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {isSearching ? (
                  'מחפש פגישות עם תשלומים...'
                ) : sessionsToImport ? (
                  `נמצאו ${sessionsToImport.length} פגישות זכאיות לייבוא`
                ) : (
                  'לא נמצאו תוצאות'
                )}
              </div>

              {sessionsToImport && sessionsToImport.length > 0 && (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>תאריך תשלום</TableHead>
                            <TableHead>שם לקוח</TableHead>
                            <TableHead>סכום</TableHead>
                            <TableHead>אמצעי תשלום</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessionsToImport.map((session) => {
                            let displayPaymentMethod = 'אחר';
                            if (session.payment_method === 'cash') {
                              displayPaymentMethod = 'מזומן';
                            } else if (session.payment_method === 'bit') {
                              displayPaymentMethod = 'ביט';
                            } else if (session.payment_method === 'transfer') {
                              displayPaymentMethod = 'העברה';
                            }

                            return (
                              <TableRow key={session.id}>
                                <TableCell>
                                  {new Date(session.payment_date).toLocaleDateString('he-IL')}
                                </TableCell>
                                <TableCell>{session.patient_name}</TableCell>
                                <TableCell>₪{session.paid_amount.toLocaleString()}</TableCell>
                                <TableCell>{displayPaymentMethod}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <Button 
                    onClick={handleImport} 
                    disabled={importMutation.isPending}
                    className="w-full"
                  >
                    <Download className="ml-2 h-4 w-4" />
                    {importMutation.isPending ? 'מייבא...' : 'ייבוא נתונים'}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportIncomeFromSessionsModal;
