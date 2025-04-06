import { useState } from 'react';
import { DensitySelector } from '../components/UI/DensitySelector';

/**
 * MinimalSettingsPage
 * 
 * A simplified settings page that doesn't rely on any complex context providers.
 * This is used as a fallback when the regular Settings page cannot be accessed.
 */
export function MinimalSettingsPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState('general');

  // Tabs for the settings page
  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'about', label: 'About' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Settings (Minimal Mode)</h1>
        <div className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
          Limited Functionality
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="your-email@example.com"
                  readOnly
                />
                <p className="mt-1 text-sm text-gray-500">
                  Cannot be changed in minimal mode
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Preferences</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Enable Notifications
                  </label>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input 
                      type="checkbox" 
                      id="toggle"
                      className="sr-only"
                    />
                    <label 
                      htmlFor="toggle" 
                      className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                    >
                      <span className="block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out"></span>
                    </label>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Toggle is non-functional in minimal mode</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appearance Settings */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Theme</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Mode
                </label>
                <div className="flex space-x-4">
                  {['light', 'dark', 'system'].map((theme) => (
                    <button
                      key={theme}
                      className={`px-4 py-2 rounded-md ${
                        theme === 'light'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Button selection is non-functional in minimal mode
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UI Density (Functional)
                </label>
                <DensitySelector showLabels={true} />
                <p className="mt-1 text-sm text-gray-500">
                  Density selector is fully functional
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">About TaskMan</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-700">
                  Version: 3.0.0
                </p>
                <p className="text-gray-700 mt-2">
                  TaskMan is a powerful task management application with time tracking, 
                  analytics, and visualization features.
                </p>
                <div className="mt-4">
                  <h3 className="text-md font-medium text-gray-700 mb-2">Troubleshooting</h3>
                  <p className="text-sm text-gray-600">
                    You're seeing this minimal settings page because the full settings page 
                    could not be loaded. This is likely due to an issue with the application state
                    or a conflict between different parts of the application.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    To resolve this issue, you can try:
                  </p>
                  <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                    <li>Refreshing the page</li>
                    <li>Clearing your browser cache</li>
                    <li>Logging out and logging back in</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MinimalSettingsPage;
