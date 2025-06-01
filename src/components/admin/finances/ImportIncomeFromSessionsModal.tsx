
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
import { sanitizeNumericInput, validateDate } from '@/utils/inputValidation';

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

  // Query for sessions eligible for import with enhanced security
  const { data: sessionsToImport, isLoading: isSearching, refetch: searchSessions } = useQuery({
    queryKey: ['sessionsForImport', daysBack],
    queryFn: async () => {
      const supabase = supabaseClient();
      
      // Validate and sanitize the daysBack input
      const sanitizedDaysBack = Math.min(Math.max(1, daysBack), 365); // Limit to 1-365 days
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - sanitizedDaysBack);
      
      try {
        validateDate(daysAgo.toISOString());
      } catch (error) {
        throw new Error('Invalid date range for import');
      }
      
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
        .not('payment_date', 'is', null)
        .order('payment_date', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        throw new Error('שגיאה בטעינת נתוני הפגישות');
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
        console.error('Error checking existing transactions:', transactionsError);
        throw new Error('שגיאה בבדיקת עסקאות קיימות');
      }

      const existingSessionIds = new Set(
        existingTransactions?.map(t => t.session_id) || []
      );

      // Filter out sessions that already exist in transactions and validate data
      const eligibleSessions = sessions
        .filter(session => !existingSessionIds.has(session.id))
        .map(session => {
          try {
            // Validate and sanitize session data
            const sanitizedAmount = sanitizeNumericInput(session.paid_amount);
            validateDate(session.payment_date);
            
            return {
              id: session.id,
              payment_date: session.payment_date,
              paid_amount: sanitizedAmount,
              payment_method: session.payment_method,
              patient_id: session.patient_id,
              patient_name: (session.patients as any)?.name || 'לא ידוע'
            };
          } catch (error) {
            console.error(`Invalid session data for session ${session.id}:`, error);
            return null;
          }
        })
        .filter((session): session is SessionForImport => session !== null);

      return eligibleSessions;
    },
    enabled: false // Only run when manually triggered
  });

  // Enhanced mutation with better error handling and validation
  const importMutation = useMutation({
    mutationFn: async (sessions: SessionForImport[]) => {
      const supabase = supabaseClient();
      
      if (!sessions || sessions.length === 0) {
        throw new Error('לא נבחרו פגישות לייבוא');
      }

      // Validate all sessions before import
      const validatedSessions = sessions.map(session => {
        try {
          validateDate(session.payment_date);
          const sanitizedAmount = sanitizeNumericInput(session.paid_amount);
          
          return {
            ...session,
            paid_amount: sanitizedAmount
          };
        } catch (error) {
          throw new Error(`נתונים לא תקינים בפגישה ${session.id}`);
        }
      });
      
      const transactionsToInsert = validatedSessions.map(session => {
        // Map payment method with validation
        let mappedPaymentMethod = 'אחר';
        const validPaymentMethods = ['cash', 'bit', 'transfer'];
        
        if (validPaymentMethods.includes(session.payment_method)) {
          if (session.payment_method === 'cash') {
            mappedPaymentMethod = 'מזומן';
          } else if (session.payment_method === 'bit') {
            mappedPaymentMethod = 'ביט';
          } else if (session.payment_method === 'transfer') {
            mappedPaymentMethod = 'העברה';
          }
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
          category: 'טיפולים',
          client_name: session.patient_name.substring(0, 200) // Limit length
        };
      });

      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (error) {
        console.error('Error inserting transactions:', error);
        throw new Error('שגיאה בשמירת העסקאות: ' + error.message);
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
      console.error('Import error:', error);
      toast({
        title: "שגיאה בייבוא",
        description: error.message || "אירעה שגיאה לא צפויה",
        variant: "destructive"
      });
    }
  });

  const handleSearch = () => {
    // Validate input before search
    if (daysBack < 1 || daysBack > 365) {
      toast({
        title: "שגיאה בנתונים",
        description: "מספר הימים חייב להיות בין 1 ל-365",
        variant: "destructive"
      });
      return;
    }

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
