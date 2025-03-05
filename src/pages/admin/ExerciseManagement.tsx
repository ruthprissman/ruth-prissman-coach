
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ExerciseList from '@/components/admin/ExerciseList';
import AddExerciseDialog from '@/components/admin/AddExerciseDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const ExerciseManagement: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <AdminLayout title="ניהול תרגילים">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">מאגר תרגילים</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          הוסף תרגיל חדש
        </Button>
      </div>

      <ExerciseList refreshTrigger={refreshTrigger} />

      <AddExerciseDialog 
        isOpen={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)}
        onExerciseAdded={handleRefresh}
      />
    </AdminLayout>
  );
};

export default ExerciseManagement;
