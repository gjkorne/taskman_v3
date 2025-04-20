# Architecture Overview for TaskMan v3

This document outlines the high-level architecture and design principles of TaskMan v3, structured around modularity, scalability, and future-proofing.

## 1. Layers and Responsibilities

### A. Data Layer

- **Repository Interfaces**: Abstract DB operations behind interfaces (`ITaskRepository`, `IProjectRepository`, etc.).
- **Adapters**:
  - _SupabaseAdapter_: Communicates with remote Supabase backend.
  - _IndexedDBAdapter_: Local cache for offline support.
- **Sync Manager**: Coordinates bi-directional sync between local and remote.

### B. Service Layer

- **Business Logic Services**:
  - _TaskService_, _CategoryService_, _UserService_, _TimeSessionService_.
- **Interfaces**: Each service implements an interface (`ITaskService`, etc.) for DI and mocks.
- **Error Handling**: Centralized via `errorHandling.ts` and `errorUtils.ts`.

### C. State Management

- **React Context & Hooks**:
  - Context providers for each domain (Tasks, TimeSessions, Settings).
  - Custom hooks (`useTaskData`, `useTimeSessionData`, etc.) encapsulate logic.
- **Caching**: React Query caches server state; IndexedDB for local.

### D. Presentation Layer

- **Routing**: React Router v6 with explicit URL routes for all views.
- **Component Library**: Shared UI components under `src/components/Common`.
- **Page Layouts**: Main layout components (`DashboardLayout`, etc.) for consistent look.

### E. Utilities & Shared

- **Form Validation**: Zod schemas in `src/components/TaskForm/schema.ts`.
- **Error Logging**: `logging.ts` and `consoleErrorsButton` for dev UX.
- **Helpers**: `date-fns` utilities, `taskUtils.ts`, etc.

## 2. Workflow & Patterns

- **Dependency Injection**: `ServiceContainer` registers and provides services.
- **Hookable Events**: `BrowserEventEmitter` for cross-layer events.
- **Separation of Concerns**: No UI logic in services or data adapters.
- **Testing**: Vitest for unit tests; React Testing Library for components.

## 3. Future Enhancements

- Introduce caching strategies for large datasets.
- Extend offline sync conflict resolution.
- Extract component library into a standalone package.
- Add support for WebSockets for real-time collaboration.
