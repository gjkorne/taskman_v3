/**
 * User interface aligned with database schema
 */
export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}
