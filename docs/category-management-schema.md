# Category Management System: Schema Design

This document outlines the database schema design for the Taskman category management system, explaining the rationale behind each design decision.

## Core Principles

Our schema design is guided by the following principles:

1. **Single Source of Truth**: All category data comes from the database, eliminating inconsistencies
2. **Relational Integrity**: Proper relationships between entities to maintain data consistency
3. **Performance**: Optimized for common query patterns
4. **Flexibility**: Accommodates future feature expansion
5. **Security**: Enforces user data isolation

## Database Tables

### 1. Categories Table

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Index for faster lookups by user_id
CREATE INDEX idx_categories_user_id ON categories(user_id);
```

#### Rationale

- **UUID Primary Key**: Provides globally unique identifiers, making it easier to sync across devices and prevents enumeration attacks
- **User Association**: Each category belongs to a specific user, enforcing data isolation
- **Cascading Deletion**: When a user is deleted, their categories are automatically removed
- **Unique Constraint**: Prevents duplicate category names for the same user
- **Color Field**: Allows visual differentiation of categories
- **Timestamps**: Track creation and modification times for auditing and sorting
- **Index on user_id**: Optimizes the common query pattern of "get all categories for a user"

### 2. User Preferences Table

```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hidden_categories JSONB DEFAULT '[]',
  quick_task_categories JSONB DEFAULT '[]',
  default_quick_task_category UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Rationale

- **User ID as Primary Key**: One preferences record per user
- **JSONB for Arrays**: Stores lists of category IDs in a flexible format
- **Default Values**: Ensures new users have sensible defaults
- **Foreign Key to Default Category**: Maintains referential integrity
- **SET NULL on Delete**: If a default category is deleted, the preference is cleared rather than causing an error
- **Timestamps**: Track when preferences were last updated

### 3. Tasks Table

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_category_id ON tasks(category_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

#### Rationale

- **Category as Foreign Key**: Tasks reference categories by ID, not by name
- **SET NULL on Delete**: If a category is deleted, tasks retain their data but lose the category association
- **User Association**: Each task belongs to a specific user
- **Cascading Deletion**: When a user is deleted, their tasks are automatically removed
- **Strategic Indexes**: Optimized for filtering tasks by category, status, and due date

## Migration from Previous Schema

The key differences from the previous schema:

1. **Category References by ID, Not Name**: 
   - Old approach: Tasks stored category names as strings
   - New approach: Tasks reference category IDs
   - Benefit: Renaming a category automatically updates all tasks

2. **Structured User Preferences**:
   - Old approach: Mixed storage in localStorage and database
   - New approach: All preferences in a dedicated database table
   - Benefit: Consistent access across devices, better data integrity

3. **No Z-Prefix Workarounds**:
   - Old approach: Used z-prefix naming conventions to handle special categories
   - New approach: All categories are treated equally in the database
   - Benefit: Simpler code, no special cases to maintain

## Benefits of This Schema

### 1. Data Integrity

- Foreign key constraints ensure referential integrity
- No duplicate categories per user
- Consistent handling of deletion scenarios

### 2. Performance

- Indexed for common query patterns
- Efficient joins between tasks and categories
- Optimized for filtering and sorting

### 3. Simplicity

- Clean, normalized structure
- No special cases or workarounds
- Intuitive relationships between entities

### 4. Scalability

- Handles large numbers of categories and tasks
- Accommodates future feature additions
- Supports multi-device synchronization

## Implementation Considerations

When implementing this schema:

1. **Database Migrations**: Create scripts to safely migrate existing data
2. **Default Categories**: Implement logic to create default categories for new users
3. **Validation**: Add constraints to ensure valid data (e.g., category name length)
4. **Error Handling**: Gracefully handle constraint violations
5. **Performance Monitoring**: Watch for slow queries as data grows

## Conclusion

This schema design addresses the core issues identified in the previous implementation:

1. It establishes a single source of truth for category data
2. It ensures consistent category representation across components
3. It eliminates the need for special handling of category names
4. It provides a solid foundation for building a simplified category management system

By implementing this schema, we can create a more maintainable, consistent, and user-friendly category management experience in Taskman.
