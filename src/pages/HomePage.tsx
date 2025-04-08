import { useState } from 'react';
import { QuickTaskModal } from '../components/TaskForm/QuickTaskModal';
import { ModularDashboard } from '../components/Dashboard/ModularDashboard';

const HomePage = () => {
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);

  // Function to handle task creation success
  const handleTaskCreated = () => {
    // Refresh data or show notification if needed
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <ModularDashboard editable={true} />
      
      {/* Quick Task Modal */}
      <QuickTaskModal 
        isOpen={isQuickTaskModalOpen} 
        onClose={() => setIsQuickTaskModalOpen(false)} 
        onTaskCreated={handleTaskCreated} 
      />
    </div>
  );
};

export default HomePage;
