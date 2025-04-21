# Technical Debt & Roadmap

This document tracks our ongoing refactoring, improvements, and technical debt items.

## 1. Component complexity & duplication (Partially done)

- [ ] Extract `useTaskGrouping` hook
- [ ] Split `TaskContainer` into container & presentation components (`GridView`, `ListView`)

## 2. Context & State Separation (Done/Largely done)

- [x] Combined `TaskDataProvider` & `TaskUIProvider` into `TaskProvider`
- [x] Exposed `useTaskApp` façade
- [x] Remove direct imports of `useTaskData`/`useTaskUI` in components
- [ ] Move filter/search out of TaskContext into `FilterSortContext`

## 3. Styling consistency (Pending)

- [ ] Build design system layer (`<Card>`, `<Badge>`, utilities)

## 4. Testing gaps (In progress)

- [x] Vitest tests for components & contexts
- [ ] Unit/snapshot tests for `TaskContainer`, `TaskCard`, grid layout
- [ ] E2E tests for create/edit/delete/filter flows

## 5. Performance & re-renders (Pending)

- [ ] Wrap `TaskCard` in `React.memo`
- [ ] Consider virtualization (`react-window`) for long lists
- [ ] Memoize filtered/grouped selectors

## 6. Type-safety & schema drift (Pending)

- [ ] Generate TS types from Supabase schema (`supabase-cli`)
- [ ] Audit repo methods & components for nullable fields and updated names

## 7. Data layer & caching (Pending)

- [ ] Include filter/search params in React-Query cache keys
- [ ] Consider pagination/infinite scrolling

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
