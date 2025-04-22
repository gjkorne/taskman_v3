# Technical Debt & Roadmap

This document tracks our ongoing refactoring, improvements, and technical debt items.

## 1. Component complexity & duplication (Done)

- [x] Extract `useTaskGrouping` hook
- [x] Split `TaskContainer` into container & presentation components (`GridView`, `ListView`)

## 2. Context & State Separation (Done)

- [x] Combined `TaskDataProvider` & `TaskUIProvider` into `TaskProvider`
- [x] Exposed `useTaskApp` façade
- [x] Replace direct imports of `useTaskApp` with `useTaskData` and `useTaskUI` in all components
- [x] Move filter/search out of TaskContext into `FilterSortContext`
- [x] Deprecate and remove legacy task context hooks (`useTaskContext`, `useTaskData`) after full migration

## 3. Styling consistency (Done)

- [x] Build design system layer (`<Card>`, `<Badge>`, utilities)

## 4. Testing gaps (In progress)

- [x] Vitest tests for components & contexts
- [ ] Unit/snapshot tests for `TaskContainer`, `TaskCard`, grid layout
- [ ] E2E tests for create/edit/delete/filter flows
- [ ] Unit tests for dashboard page and custom hooks (`useTaskMetrics`, `useProductivityTrends`, `useOpenTasksByProject`, etc.)

## 5. Performance & re-renders (Pending)

- [ ] Wrap `TaskCard` in `React.memo`
- [ ] Consider virtualization (`react-window`) for long lists
- [ ] Memoize filtered/grouped selectors
- [ ] Memoize context values in `createDataContext` to prevent unnecessary re-renders

## 6. Type-safety & schema drift (Pending)

- [ ] Generate TS types from Supabase schema (`supabase-cli`)
- [ ] Audit repo methods & components for nullable fields and updated names
- [ ] Add TS types for time session context values and hook payloads

## 7. Data layer & caching (Pending)

- [ ] Include filter/search params in React-Query cache keys
- [ ] Consider pagination/infinite scrolling
- [ ] Extend React-Query cache keys to include `TimeSession` query keys and calculators

## 8. Offline & sync robustness (Partially done)

- [x] IndexedDB polyfill (`setupTests.ts`)
- [ ] Conflict resolution UI for sync failures
- [ ] Tests for offline queue behavior

## 9. Supabase migrations & indexes (Pending)

- [ ] Add DB indexes on `due_date`, `status`, `category_name`
- [ ] Create migrations for new features (tags, projects)

## 10. Service & repository interfaces (Done)

- [x] Consolidated on repository-pattern taskService
- [ ] Audit for any direct API leaks

## 11. Next Steps

- [x] Ensure app compiles cleanly after provider nesting fixes
- [x] Continue migrating `useTaskApp` → `useTaskData`/`useTaskUI`
- [x] Deprecate and remove legacy hooks (`useTaskContext`, `useTaskApp`)
- [ ] Add unit and E2E tests for new hooks and components
- [ ] Wrap heavy components with `React.memo` and virtualize long lists
- [ ] Enhance React-Query cache keys for filters and TimeSession data
- [ ] Finalize offline sync UI and conflict resolution flows
- [ ] Update documentation (README, technical debt, component docs)
