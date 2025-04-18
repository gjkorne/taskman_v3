# TaskMan v3 Modular Context Refactoring Progress

_Last updated: 2025-04-18_

## **Current Objective**
Refactor all major contexts in TaskMan v3 to use a modular, maintainable, and scalable structure, following the patterns established in the time session context. This includes:
- Extracting queries, mutations, and utilities into separate files
- Using grouped return objects (`queries`, `mutations`, `calculators`, `fetchers`, etc.)
- Improving error handling and notification consistency
- Ensuring type safety and maintainability

## **What Has Been Completed**
### Modularization of `timeSession` Context
- Split logic into:
  - `useTimeSessionDataHook.ts` (main hook, composes everything)
  - `timeSessionQueries.ts` (query hooks & query keys)
  - `timeSessionMutations.ts` (mutation hooks)
  - `timeSessionUtils.ts` (shared helpers: error handling, invalidation)
  - `types.ts` (types/interfaces)
- Fixed all related TypeScript and runtime errors
- Ensured all consumers import `TIME_SESSION_QUERY_KEYS` from `timeSessionQueries.ts`

## **Next Steps (for Future Sessions)**
1. **Test the App**
   - Run the app and verify that the time session features work as expected.
   - Check for any runtime or type errors.
2. **Refactor Other Contexts**
   - Repeat the modularization process for:
     - `task` context
     - `category` context
     - `settings` context
   - For each context:
     - Extract queries, mutations, and utils into separate files
     - Ensure grouped return structure and type safety
     - Add/adjust error handling and notifications
3. **Run Type Checking**
   - Use `tsc` or your IDE to ensure all contexts are type-safe.
4. **Update Documentation**
   - Add/expand context-specific README sections as needed.
5. **User Testing**
   - Test the app's main flows and ensure no regressions.

## **How to Resume**
- Review this file for the last progress checkpoint.
- Pick the next context (task, category, or settings) and start modularizing it as above.
- Use the `timeSession` context as a template for best practices.
- If you encounter errors, check import/export paths and type signatures.

---

_This file is updated as progress is made. Check here to quickly resume or onboard new contributors to the refactor._
