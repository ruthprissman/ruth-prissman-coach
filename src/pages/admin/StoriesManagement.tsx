
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StoriesList from '@/components/admin/stories/StoriesList';
import StoryDialog from '@/components/admin/stories/StoryDialog';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';

const StoriesManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
  
  const handleAddStory = () => {
    setSelectedStoryId(null);
    setIsDialogOpen(true);
  };
  
  const handleEditStory = (storyId: number) => {
    setSelectedStoryId(storyId);
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedStoryId(null);
  };
  
  return (
    <AdminLayout title="ניהול סיפורים">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-right">סיפורים</h2>
            <p className="text-muted-foreground text-right">
              הוסף, ערוך או מחק סיפורים שיוצגו באתר
            </p>
          </div>
          <Button onClick={handleAddStory}>
            <PlusIcon className="ml-2 h-4 w-4" />
            הוסף סיפור חדש
          </Button>
        </div>
        
        <StoriesList onEditStory={handleEditStory} />
        
        <StoryDialog 
          isOpen={isDialogOpen} 
          onClose={handleDialogClose} 
          storyId={selectedStoryId} 
        />
      </div>
    </AdminLayout>
  );
};

export default StoriesManagement;
