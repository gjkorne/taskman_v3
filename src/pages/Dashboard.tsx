import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Dashboard component
 * 
 * This component is kept for backward compatibility.
 * All dashboard functionality has been migrated to HomePage.
 * This component simply redirects to the home page.
 */
const Dashboard: React.FC = () => {
  // Log message for debugging purposes
  useEffect(() => {
    console.log('Dashboard component has been deprecated. Redirecting to HomePage...');
  }, []);

  // Redirect to the home page
  return <Navigate to="/" replace />;
};

export default Dashboard;
