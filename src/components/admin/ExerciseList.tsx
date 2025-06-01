import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { Exercise } from '@/types/patient';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Search, SortAsc, SortDesc } from 'lucide-react';
import { format } from 'date-fns';

interface ExerciseListProps {
  refreshTrigger: number;
}

type SortField = 'exercise_name' | 'created_at';
type SortDirection = 'asc' | 'desc';

const ExerciseList: React.FC<ExerciseListProps> = ({ refreshTrigger }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { toast } = useToast();

  useEffect(() => {
    fetchExercises();
  }, [refreshTrigger, sortField, sortDirection]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const supabase = supabaseClient();
      // Simplified query to fetch only exercises without patient relation
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      setExercises(data || []);
    } catch (error: any) {
      console.error('Error fetching exercises:', error);
      toast({
        title: 'שגיאה בטעינת התרגילים',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      toggleSortDirection();
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    const exerciseName = exercise.exercise_name.toLowerCase();
    const description = exercise.description?.toLowerCase() || '';
    const searchLower = searchQuery.toLowerCase();
    
    return exerciseName.includes(searchLower) || description.includes(searchLower);
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'לא ידוע';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return 'תאריך שגוי';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חפש לפי שם תרגיל או תיאור..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={sortField}
            onValueChange={(value) => handleSortChange(value as SortField)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="מיין לפי" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exercise_name">שם תרגיל</SelectItem>
              <SelectItem value="created_at">תאריך יצירה</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortDirection}
            title={sortDirection === 'asc' ? 'סדר עולה' : 'סדר יורד'}
          >
            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם תרגיל</TableHead>
              <TableHead className="hidden md:table-cell">תיאור</TableHead>
              <TableHead>תאריך יצירה</TableHead>
              <TableHead>קובץ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredExercises.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  לא נמצאו תרגילים
                </TableCell>
              </TableRow>
            ) : (
              filteredExercises.map((exercise) => (
                <TableRow key={exercise.id}>
                  <TableCell>{exercise.exercise_name}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate">
                    {exercise.description || '-'}
                  </TableCell>
                  <TableCell>{formatDate(exercise.created_at)}</TableCell>
                  <TableCell>
                    {exercise.file_url ? (
                      <a 
                        href={exercise.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <Download className="mr-1 h-4 w-4" />
                          הורד
                        </Button>
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">📝 תרגיל טקסט בלבד</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ExerciseList;
