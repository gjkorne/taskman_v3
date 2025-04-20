import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface UserOption {
  id: string;
  email: string;
  fullName?: string;
}

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  users: UserOption[];
  impersonatedUser: UserOption | null;
  impersonateUser: (userId: string | null) => void;
  clearImpersonation: () => void;
}

// Create the context with default values
const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  isLoading: true,
  users: [],
  impersonatedUser: null,
  impersonateUser: () => {},
  clearImpersonation: () => {},
});

// Export custom hook for using the admin context
export const useAdmin = () => useContext(AdminContext);

// Provider component that wraps your app and provides the admin context value
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [impersonatedUser, setImpersonatedUser] = useState<UserOption | null>(
    null
  );

  // Check if current user is an admin
  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
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

          // If user is admin, fetch all users
          if (data?.user_roles?.name === 'admin') {
            fetchUsers();
          }
        }
      } catch (error) {
        console.error('Error in admin check:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  // Fetch all users if the current user is an admin
  const fetchUsers = async () => {
    try {
      // Get all user role assignments - this is accessible to admins and already set up with proper policies
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_role_assignments')
        .select('user_id');

      if (assignmentsError) {
        console.error('Error fetching user assignments:', assignmentsError);
        return;
      }

      // Get all unique user IDs from assignments
      const uniqueUserIds = [...new Set(assignments.map((a) => a.user_id))];

      // Create user options with minimal info (we don't have access to emails)
      const userOptions: UserOption[] = uniqueUserIds.map((userId) => ({
        id: userId,
        email: `User ${userId.substring(0, 8)}...`, // Create a display name from ID
        fullName: undefined,
      }));

      // Add currently logged in user if not already in the list
      if (user && !userOptions.some((u) => u.id === user.id)) {
        userOptions.push({
          id: user.id,
          email: user.email || `User ${user.id.substring(0, 8)}...`,
          fullName: undefined,
        });
      }

      // Sort users by email/display name
      userOptions.sort((a, b) => a.email.localeCompare(b.email));

      // Store in state
      setUsers(userOptions);

      // If an impersonated user was previously selected but isn't in the list
      // (e.g., after refresh), clear the impersonation
      if (
        impersonatedUser &&
        !userOptions.some((u) => u.id === impersonatedUser.id)
      ) {
        setImpersonatedUser(null);
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    }
  };

  // Impersonate a user
  const impersonateUser = (userId: string | null) => {
    if (!userId) {
      setImpersonatedUser(null);
      return;
    }

    const selectedUser = users.find((u) => u.id === userId);
    if (selectedUser) {
      setImpersonatedUser(selectedUser);
      // Store in session storage to persist across page refreshes but not browser sessions
      sessionStorage.setItem('impersonatedUserId', selectedUser.id);
    }
  };

  // Clear impersonation
  const clearImpersonation = () => {
    setImpersonatedUser(null);
    sessionStorage.removeItem('impersonatedUserId');
  };

  // Restore impersonation from session storage on page reload
  useEffect(() => {
    if (isAdmin && users.length > 0) {
      const storedUserId = sessionStorage.getItem('impersonatedUserId');
      if (storedUserId) {
        impersonateUser(storedUserId);
      }
    }
  }, [isAdmin, users]);

  // Context value
  const value = {
    isAdmin,
    isLoading,
    users,
    impersonatedUser,
    impersonateUser,
    clearImpersonation,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}
