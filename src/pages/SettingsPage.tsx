import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface SettingsPageProps {
  // Add props as needed
}

const SettingsPage: React.FC<SettingsPageProps> = () => {
  // Get settings and update functions from context
  const { settings, updateSetting, saveAllSettings } = useSettings();
  
  // Function to handle theme change
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    updateSetting('theme', newTheme);
  };

  // Function to save all settings
  const handleSaveSettings = () => {
    saveAllSettings();
    
    // Show a success message
    alert('Settings saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Interface</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
          <div className="flex space-x-4">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`px-4 py-2 rounded-md ${
                  settings.theme === t 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Default View</label>
          <select
            value={settings.defaultView}
            onChange={(e) => updateSetting('defaultView', e.target.value as 'list' | 'grid')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="list">List</option>
            <option value="grid">Grid</option>
          </select>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Task Management</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Sort Order</label>
          <select
            value={settings.defaultTaskSort}
            onChange={(e) => updateSetting('defaultTaskSort', e.target.value as 'due_date' | 'priority' | 'created_at')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="due_date">Due Date</option>
            <option value="priority">Priority</option>
            <option value="created_at">Creation Date</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => updateSetting('autoSave', e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Auto-save task drafts</span>
          </label>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>
        
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => updateSetting('notificationsEnabled', e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Enable notifications</span>
          </label>
        </div>
        
        {settings.notificationsEnabled && (
          <div className="pl-6 mt-2 space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded text-indigo-600 focus:ring-indigo-500"
                defaultChecked
              />
              <span className="text-sm text-gray-700">Task due reminders</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded text-indigo-600 focus:ring-indigo-500"
                defaultChecked
              />
              <span className="text-sm text-gray-700">Timer notifications</span>
            </label>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSaveSettings}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
