import React, { useEffect, useState } from 'react';
import { useSettings } from '../contexts/SettingsCompat';
import { CategorySettings } from '../components/Settings/CategorySettings';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface SettingsPageProps {
  // Add props as needed
}

const SettingsPage: React.FC<SettingsPageProps> = () => {
  // Get settings and update functions from context
  const { settings, updateSetting, saveAllSettings } = useSettings();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if the current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_role_assignments')
          .select('user_roles(name)')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.user_roles?.name === 'admin');
        }
      } catch (err) {
        console.error('Error in admin check:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

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

      {/* Account Settings */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account</h2>

        {user ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center">
                <span className="text-xl font-semibold text-indigo-700">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h3 className="font-medium">{user.email}</h3>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-500">
                    User ID: {user.id.substring(0, 8)}...
                  </span>
                  {loading ? (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Checking permissions...
                    </span>
                  ) : isAdmin ? (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      Admin
                    </span>
                  ) : (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Standard User
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Access Level</h4>
              <p className="text-sm text-gray-600">
                {isAdmin ? (
                  <>
                    <span className="font-medium text-purple-700">Admin:</span>{' '}
                    You have full access to all tasks in the system and can
                    manage other users.
                  </>
                ) : (
                  <>
                    <span className="font-medium text-blue-700">
                      Standard User:
                    </span>{' '}
                    You can only see and manage your own tasks.
                  </>
                )}
              </p>
            </div>

            {isAdmin && (
              <div className="bg-yellow-50 p-3 rounded-md">
                <h4 className="font-medium text-yellow-800 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Admin Features
                </h4>
                <ul className="text-sm text-yellow-700 mt-1 ml-6 list-disc">
                  <li>View and manage all users' tasks</li>
                  <li>
                    Use the Admin View panel at the bottom of the screen to
                    impersonate users
                  </li>
                  <li>Access system-wide reports and analytics</li>
                </ul>
              </div>
            )}

            {/* Account Security */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Account Security</h4>
              <div className="space-y-2">
                <button
                  className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                  onClick={() =>
                    alert(
                      'Password reset functionality would be implemented here'
                    )
                  }
                >
                  Change password
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 text-gray-500">
            Please sign in to view account settings
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Interface</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Theme
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default View
          </label>
          <div className="flex space-x-4">
            {(['list', 'grid'] as const).map((view) => (
              <button
                key={view}
                onClick={() => updateSetting('defaultView', view)}
                className={`px-4 py-2 rounded-md ${
                  settings.defaultView === view
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            UI Density
          </label>
          <div className="flex space-x-4">
            {(['default', 'compact'] as const).map((density) => (
              <button
                key={density}
                onClick={() => updateSetting('uiDensity', density)}
                className={`px-4 py-2 rounded-md ${
                  settings.uiDensity === density
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {density === 'default' ? 'Default (Comfortable)' : 'Compact'}
              </button>
            ))}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {settings.uiDensity === 'default'
              ? 'Default spacing with larger text for better readability'
              : 'Reduced spacing and smaller text for more compact layout'}
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Task Management</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Sort Order
          </label>
          <select
            value={settings.defaultTaskSort}
            onChange={(e) =>
              updateSetting(
                'defaultTaskSort',
                e.target.value as 'due_date' | 'priority' | 'created_at'
              )
            }
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
            <span className="text-sm font-medium text-gray-700">
              Auto-save task drafts
            </span>
          </label>
        </div>

        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.allowTaskSwitching}
              onChange={(e) =>
                updateSetting('allowTaskSwitching', e.target.checked)
              }
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Auto-switch tasks when starting a new timer
            </span>
          </label>
          <p className="text-sm text-gray-500 mt-1 ml-6">
            When enabled, starting a timer on a different task will
            automatically stop the current timer. When disabled, you'll need to
            manually stop the current timer before starting a new one.
          </p>
        </div>
      </div>

      {/* Category Management */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Category Management</h2>
        <div className="mb-4">
          <a
            href="/category-mapping"
            className="inline-block px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors"
          >
            🔄 Map Categories (Move Tasks Between Categories)
          </a>
          <p className="mt-2 text-sm text-gray-600">
            Use this tool to move tasks from one category to another and fix
            synchronization issues.
          </p>
        </div>
        <CategorySettings />
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>

        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) =>
                updateSetting('notificationsEnabled', e.target.checked)
              }
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Enable notifications
            </span>
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
