# Caching Mechanisms

## Overview

TaskMan v3 implements a flexible, storage-agnostic caching system that enhances performance, enables offline capabilities, and reduces network traffic. The caching mechanism is designed to integrate seamlessly with the service layer and React components.

## Key Components

### 1. CacheService

The core of the caching system is the `CacheService` singleton, which manages multiple cache instances with different configurations:

- **Storage Adapters**: Support for multiple backend storage types (Memory, LocalStorage, SessionStorage, IndexedDB)
- **Expiration Strategies**: Configurable TTL, session-based, and manual expiration
- **Metadata Tracking**: Every cache entry includes timestamps and custom metadata

### 2. React Integration

The caching system integrates with React through custom hooks:

- **useCache**: The primary hook for accessing cache functionality
- **useLocalStorageCache**: Convenience hook for local storage caching
- **useMemoryCache**: For component-level ephemeral caching
- **useSessionCache**: For session-scoped caching

### 3. Service Integration

Cached service implementations wrap standard services to provide transparent caching:

- **CachedTaskService**: Adds caching to the standard TaskService
- **Offline-First Pattern**: Uses cache when offline or for better performance
- **Background Refreshing**: Updates stale cache entries without blocking user interactions

## Implementation Details

### Cache Configuration

```typescript
// Create a new cache
const tasksCache = CacheService.getInstance().getCache<Task[]>({
  name: 'tasks',
  storageType: CacheStorageType.LOCAL_STORAGE,
  expirationStrategy: CacheExpirationStrategy.TIME_BASED,
  ttlMs: 15 * 60 * 1000, // 15 minutes
  serialize: true
});
```

### Using the Cache in Services

Services can implement offline-first behavior with caching:

```typescript
async getTasks(): Promise<Task[]> {
  try {
    // Try cache first
    const cachedResult = await this.cache.get('all_tasks');
    
    if (cachedResult.success && cachedResult.data) {
      // Return cached data and refresh in background if stale
      if (this.isStaleCache(cachedResult.metadata?.lastAccessedAt)) {
        this.refreshTasksInBackground();
      }
      return cachedResult.data;
    }
    
    // No cache, get from API
    return this.refreshTasks();
  } catch (error) {
    // Handle offline by using cache as fallback
    if (error instanceof NetworkError) {
      const cachedResult = await this.cache.get('all_tasks');
      if (cachedResult.success && cachedResult.data) {
        return cachedResult.data;
      }
    }
    throw error;
  }
}
```

### Using the Cache in Components

React components can directly use the cache through hooks:

```typescript
function TaskList() {
  // Use the tasks cache with 15-minute TTL
  const { 
    data: tasks, 
    loading, 
    error,
    getOrSetData
  } = useLocalStorageCache<Task[]>('tasks', 15 * 60 * 1000);
  
  useEffect(() => {
    // Get from cache or load from API if not in cache
    getOrSetData('all_tasks', async () => {
      const taskService = ServiceFactory.getService<ITaskService>('TaskService');
      return taskService.getTasks();
    });
  }, [getOrSetData]);
  
  // Render with cached data
  return (
    <div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}
      {tasks && <TaskListItems tasks={tasks} />}
    </div>
  );
}
```

## Integration with Context Pattern

To maintain consistency with our standardized context pattern, caching should be implemented at the service layer and propagated through contexts:

```typescript
export const TasksProvider: React.FC<TasksProviderProps> = ({ children, service }) => {
  // Use cached service implementation
  const taskService = service || 
    ServiceFactory.getService<CachedTaskService>('TaskService');
  
  // Context implementation uses the cached service
  // Rest of the implementation...
}
```

## Best Practices

### 1. Cache Invalidation

- Use fine-grained cache keys for specific entity types
- Invalidate related cache entries when data changes
- Use the service events system to keep cache in sync

```typescript
// When a task is created, update all relevant caches
taskService.on('task-created', (task: Task) => {
  // Update individual task cache
  this.cache.set(`task_${task.id}`, task);
  
  // Update task list cache
  this.updateTaskListCache(task);
});
```

### 2. Offline Support

- Use the `offlineAccessed` and `needsSync` metadata flags
- Queue operations when offline for later synchronization
- Track and resolve conflicts between offline and online changes

```typescript
// Handling updates in offline mode
if (error instanceof NetworkError) {
  // Update locally and mark for sync
  const updatedTask = { ...cachedTask, ...taskData };
  await this.cache.set(`task_${id}`, updatedTask, { needsSync: true });
  return updatedTask;
}
```

### 3. Performance Optimization

- Use background refreshing for stale cache entries
- Implement debouncing for frequent cache operations
- Consider compression for large cache entries

```typescript
// Refresh stale data in background without blocking
private refreshTasksInBackground(): void {
  this.refreshTasks().catch(error => {
    console.error('Background refresh failed', error);
  });
}
```

## Security Considerations

1. **Sensitive Data**: Never cache sensitive information like authentication tokens or personal identifiable information unless encrypted
2. **Validation**: Always validate data from cache before using it, as it could be tampered with
3. **Quota Management**: Be mindful of storage quotas, especially in browsers

## Implementation Checklist

When implementing caching for a new feature:

- [ ] Identify appropriate cache storage type based on data size and persistence needs
- [ ] Determine proper TTL and expiration strategy
- [ ] Implement background refresh for better user experience
- [ ] Create cached service implementation if needed
- [ ] Add cache invalidation logic for all write operations
- [ ] Consider offline support requirements
- [ ] Add tests for both online and offline scenarios
