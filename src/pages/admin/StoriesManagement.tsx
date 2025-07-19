
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StoriesList from '@/components/admin/stories/StoriesList';
import StoryDialog from '@/components/admin/stories/StoryDialog';
import UploadSignatureDialog from '@/components/admin/UploadSignatureDialog';
import { Button } from '@/components/ui/button';
import { PlusIcon, Upload } from 'lucide-react';

const StoriesManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  
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

  const handleSignatureUploadComplete = (url: string) => {
    console.log('Signature uploaded to:', url);
    setIsSignatureDialogOpen(false);
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsSignatureDialogOpen(true)}
            >
              <Upload className="ml-2 h-4 w-4" />
              העלה חתימה למיילים
            </Button>
            <Button onClick={handleAddStory}>
              <PlusIcon className="ml-2 h-4 w-4" />
              הוסף סיפור חדש
            </Button>
          </div>
        </div>
        
        <StoriesList onEditStory={handleEditStory} />
        
        <StoryDialog 
          isOpen={isDialogOpen} 
          onClose={handleDialogClose} 
          storyId={selectedStoryId} 
        />

        <UploadSignatureDialog
          isOpen={isSignatureDialogOpen}
          onClose={() => setIsSignatureDialogOpen(false)}
          onUploadComplete={handleSignatureUploadComplete}
        />
      </div>
    </AdminLayout>
  );
};

export default StoriesManagement;
