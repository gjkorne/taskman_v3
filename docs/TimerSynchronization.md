# Timer Synchronization Documentation

## Overview

The Timer Synchronization feature enables TassKman to maintain consistent timer state across multiple devices. It addresses the issue where starting a task timer on one device wouldn't reflect on another device, causing confusion and potential data inconsistency.

## Architecture

The implementation follows the offline-second architecture pattern, prioritizing the remote Supabase database as the source of truth while maintaining local state for performance and user experience.

### Key Components

1. **TimeSessionsService**
   - Added a `getActiveSession()` method to query Supabase for active time sessions
   - This method retrieves the most recent uncompleted session (where `end_time` is null)
   - Fetches task details in a separate query to avoid 406 errors

2. **useTimerPersistence Hook**
   - Enhanced to sync with remote session data
   - Maintains timer state in localStorage with the consistent `taskman_` prefix
   - Provides a `syncWithRemote()` function to check for active sessions in Supabase

3. **TimerContext**
   - Periodically checks for active timer sessions from other devices
   - Initial sync occurs when the component mounts
   - Continues periodic checks every 30 seconds while the user is logged in
   - Avoids overwriting an active local timer with remote data

## Data Flow

1. **On Application Load**:
   - The app checks for locally stored timer state in `localStorage`
   - Immediately after, it queries Supabase for any active sessions
   - If an active remote session is found, the local timer state is updated to match

2. **During Timer Operation**:
   - When a timer is started, a record is created in Supabase's `time_sessions` table
   - Local timer state is updated to track elapsed time
   - Timer state is regularly saved to `localStorage` for persistence between page reloads

3. **Cross-Device Synchronization**:
   - If a device detects it is not currently timing any task, it periodically checks for active sessions
   - When an active session is found, it calculates the elapsed time since the session started
   - The timer UI is updated to reflect the current state of the active session

## Implementation Notes

### Storage Keys

- All localStorage keys use the `taskman_` prefix for consistency
- The timer state is stored using the key `taskman_timerState`

### Error Handling

- The system gracefully handles network errors during synchronization
- Errors are logged to the console but don't disrupt the user experience

### Performance Considerations

- Sync checks only happen when necessary to minimize API calls
- The 30-second interval provides a balance between data freshness and API usage

## Future Improvements

1. **Real-time Updates**:
   - Consider implementing Supabase's real-time subscriptions to receive immediate updates
   - This would eliminate the need for polling and reduce API calls

2. **Conflict Resolution**:
   - Implement more sophisticated conflict resolution for cases where two devices start timers simultaneously
   - Currently, the most recently active timer takes precedence

3. **Offline Support**:
   - Enhance the current implementation to better handle offline scenarios
   - Queue timer operations when offline and sync when connection is restored

## Usage Examples

### Starting a Timer

When a user starts a timer:
1. A session record is created in the `time_sessions` table
2. The task status is updated to `ACTIVE`
3. The local timer state is set to `running`

```typescript
// Starting a timer
await startTimer(taskId);
```

### Detecting Active Sessions

When a user opens the app on a different device:
1. The app automatically checks for active sessions
2. If found, it calculates the elapsed time and displays the running timer
3. The user can interact with the timer as if it was started on the current device

```typescript
// This happens automatically but can be triggered manually
await syncWithRemote();
```