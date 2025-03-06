
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ArticlesList from '@/components/admin/articles/ArticlesList';
import FailedPublicationsPanel from '@/components/admin/articles/FailedPublicationsPanel';
import { Button } from '@/components/ui/button';

const ArticlesManagement: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <AdminLayout title="ניהול מאמרים">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button 
            onClick={() => navigate('/admin/articles/new')} 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            מאמר חדש
          </Button>
        </div>
        
        <FailedPublicationsPanel />
        
        <ArticlesList />
      </div>
    </AdminLayout>
  );
};

export default ArticlesManagement;
