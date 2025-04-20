**_Before Moving On_**

### **Comprehensive Plan for Immediate Improvements**

**Objective:** Enhance the MVP’s core functionality while maintaining flexibility for future phases.

---

### **1. Key Areas for Change**

#### **A. Schema Future-Proofing**

**Problem:** Missing fields for projects/subtasks may force disruptive migrations later.  
**Solution:** Add nullable columns to support future features without breaking current functionality.

#### **B. Timer Robustness**

**Problem:** Single-task timer lacks resilience for edge cases (offline, crashes).  
**Solution:** Strengthen state management and recovery flows.

#### **C. Basic Task Organization**

**Problem:** Flat task lists become unwieldy as volume grows.  
**Solution:** Implement lightweight organization (tags, manual sorting).

#### **D. Offline Baseline**

**Problem:** No offline support risks data loss.  
**Solution:** Cache tasks/timers in IndexedDB with minimal sync logic.

#### **E. User Feedback Loop**

**Problem:** Lack of insights into pain points.  
**Solution:** Add analytics for core actions (task creation, timer usage).

---

### **2. Implementation Plan**

#### **A. Schema Future-Proofing**

**Steps:**

1. Add nullable columns to `tasks`:
   ```sql
   ALTER TABLE tasks
     ADD COLUMN project_id UUID,
     ADD COLUMN parent_task_id UUID,
     ADD COLUMN is_pending_sync BOOLEAN DEFAULT false;
   ```
2. Document reserved fields in a `SCHEMA.md` file.

**Benefits:**

- Avoids migrations when activating Phases 4–8.
- Maintains backward compatibility.

**Outcome Metrics:**

- Zero schema changes required for future phases.

**Challenges:**

- Risk of unused fields cluttering the database.  
  **Mitigation:** Annotate fields as `-- RESERVED FOR FUTURE USE` in schema docs.

---

#### **B. Timer Robustness**

**Steps:**

1. **State Management:**
   - Refactor Zustand store to track timer state transitions:
     ```ts
     interface TimerState {
       status: 'idle' | 'running' | 'paused';
       activeTaskId: string | null;
       startTime: number | null;
       elapsed: number;
     }
     ```
2. **Crash Recovery:**
   - Persist timer state to `localStorage` every 15 seconds.
   - On app load, check for unresolved timers and prompt: _"Resume timer for [Task X]?"_

**Benefits:**

- Prevents data loss during crashes/refreshes.
- Smoother UX for interrupted workflows.

**Outcome Metrics:**

- Reduction in user-reported timer resets (track via `event_logs`).

**Challenges:**

- `localStorage` writes may block UI.  
  **Mitigation:** Throttle writes with `requestIdleCallback`.

---

#### **C. Basic Task Organization**

**Steps:**

1. **Manual Sorting:**
   - Add a `manual_sort_order INT` column to `tasks`.
   - Implement drag-and-drop in the UI (e.g., `react-dnd`).
2. **Tag Filtering:**
   - Extend `custom_tags text[]` to support UI-based filtering:
     ```tsx
     <FilterBar tags={['work', 'personal']} />
     ```

**Benefits:**

- Users can prioritize tasks without complex projects/subtasks.
- Faster navigation than scrolling through flat lists.

**Outcome Metrics:**

- Increased task engagement (measured via `task_updated` events).

**Challenges:**

- Drag-and-drop complexity.  
  **Mitigation:** Use a library like `dnd-kit` for accessibility.

---

#### **D. Offline Baseline**

**Steps:**

1. **Cache Tasks:**
   - Store tasks in IndexedDB on first load with a `last_synced_at` timestamp.
2. **Queue Writes:**
   - Log unsynced changes (e.g., new tasks) in a `pending_operations` table.
3. **Sync on Reconnect:**
   - Merge changes using Supabase’s upsert:
     ```ts
     await supabase.from('tasks').upsert(pendingTasks);
     ```

**Benefits:**

- Users can create/edit tasks offline.
- Builds foundation for Phase 6 (Advanced Offline).

**Outcome Metrics:**

- Successful sync rate after offline periods (log errors to `event_logs`).

**Challenges:**

- Conflict resolution for concurrent edits.  
  **Mitigation:** Use `modified_at` timestamps for last-write-wins.

---

#### **E. User Feedback Loop**

**Steps:**

1. **Track Core Actions:**
   - Log events to `event_logs`:
     ```sql
     INSERT INTO event_logs (user_id, event_type, metadata)
     VALUES (
       auth.uid(),
       'timer_started',
       '{"task_id": "x", "duration": 120}'
     );
     ```
2. **Add Feedback Widget:**
   - Embed a simple _"Was this helpful?"_ prompt after key actions.

**Benefits:**

- Data-driven prioritization of future features.
- Identifies UX pain points early.

**Outcome Metrics:**

- Event volume per action (e.g., `timer_started` vs. `timer_abandoned`).

**Challenges:**

- Privacy concerns.  
  **Mitigation:** Anonymize logs and add opt-out in settings.

---

### **3. Expected Outcomes & Measurement**

| **Improvement**    | **Success Metrics**                       | **Tool**              |
| ------------------ | ----------------------------------------- | --------------------- |
| Schema Flexibility | Zero schema changes for Phases 4–8        | Supabase Migrations   |
| Timer Reliability  | ↓ 50% in crash-related timer resets       | `event_logs`          |
| Task Organization  | ↑ 30% in task updates (sorting/filtering) | Task update analytics |
| Offline Usability  | 90%+ sync success after offline periods   | Sync error logs       |
| Feedback Quality   | 100+ logged events/week                   | Supabase Analytics    |

---

### **4. Risk Mitigation Strategies**

| **Risk**               | **Strategy**                                    |
| ---------------------- | ----------------------------------------------- |
| Schema bloat           | Annotate reserved fields clearly.               |
| UI performance lag     | Virtualize task lists with `react-window`.      |
| Offline sync conflicts | Use timestamp-based last-write-wins.            |
| Low user feedback      | Incentivize feedback (e.g., "What’s missing?"). |

---

### **Prioritized Roadmap**

1. **Week 1:** Schema changes + timer state refactor.
2. **Week 2:** Manual task sorting + offline caching.
3. **Week 3:** Feedback system + analytics dashboard.

By focusing on these **high-leverage, low-risk improvements**, you’ll create a more robust MVP while preserving optionality for future phases.
