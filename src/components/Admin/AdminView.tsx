import { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';

export function AdminView() {
  const { isAdmin, users, impersonatedUser, impersonateUser, clearImpersonation } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);

  // If not admin, don't render anything
  if (!isAdmin) return null;

  return (
    <div 
      className={`fixed bottom-0 right-5 w-72 bg-white shadow-lg rounded-t-lg transition-all duration-300 ease-in-out z-50 ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'}`}
    >
      {/* Header - always visible */}
      <div 
        className="px-4 py-2 flex justify-between items-center cursor-pointer bg-blue-50 rounded-t-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
          </svg>
          <span className="ml-2 font-medium text-blue-600">Admin View</span>
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${impersonatedUser ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
          {impersonatedUser ? 'Impersonating' : 'Normal View'}
        </span>
      </div>

      {/* Panel content - only visible when open */}
      <div className={`px-4 py-3 bg-white rounded-b-lg ${isOpen ? 'block' : 'hidden'}`}>
        <div className="mb-2 text-sm text-gray-600">View as another user:</div>
        <select 
          className="w-full mb-3 p-2 border border-gray-300 rounded text-sm"
          value={impersonatedUser?.id || ""}
          onChange={(e) => impersonateUser(e.target.value || null)}
        >
          <option value="">Select user</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.email} {user.fullName ? `(${user.fullName})` : ''}
            </option>
          ))}
        </select>
        
        {impersonatedUser && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-red-500">
              Viewing as: {impersonatedUser.email}
            </div>
            <button 
              className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center"
              onClick={clearImpersonation}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
