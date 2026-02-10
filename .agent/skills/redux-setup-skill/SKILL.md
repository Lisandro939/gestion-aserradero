---
name: redux-setup
description: Guides the correct implementation of Redux from scratch using Redux Toolkit, following best practices, scalability, and clean architecture.
---

# Redux Setup Skill

Use this skill when initializing Redux in a new project or refactoring an existing one to use Redux properly.

## Goals

- Set up Redux using **Redux Toolkit**
- Avoid boilerplate and anti-patterns
- Ensure scalability and maintainability
- Follow modern Redux best practices

## Setup checklist

1. **Install dependencies**
      - Use `@reduxjs/toolkit` and `react-redux`
      - Avoid legacy `redux` APIs unless strictly necessary

2. **Store configuration**
      - Create a single `store.ts/js` using `configureStore`
      - Enable Redux DevTools (default in development)
      - Export `RootState` and `AppDispatch` (especially for TypeScript)

3. **Slices**
      - Organize state by **feature**, not by type
      - Use `createSlice` for reducers and actions
      - Keep initial state explicit and simple
      - Avoid large monolithic slices

4. **Async logic**
      - Use `createAsyncThunk` for side effects
      - Handle `pending`, `fulfilled`, and `rejected` states
      - Store loading and error states explicitly
      - Never call APIs directly from components

5. **Selectors**
      - Create reusable selectors
      - Avoid accessing state shape directly inside components
      - Prefer memoized selectors when needed

6. **Provider setup**
      - Wrap the app with `<Provider store={store}>`
      - Keep Redux logic out of UI components

## Folder structure recommendation

- `/store`
     - `index.ts` (store configuration)
- `/features`
     - `/auth`
          - `authSlice.ts`
          - `authSelectors.ts`
          - `authThunks.ts` (optional)
     - `/user`
          - `userSlice.ts`

Structure by **domain**, not by Redux concepts.

## Best practices

- Keep Redux state **serializable**
- Do not store UI-only state unless it’s global
- Avoid derived state when it can be computed
- Prefer Redux Toolkit over custom reducers
- Use Redux only when state is truly shared or complex

## Common mistakes to avoid

- Using Redux for every piece of state
- Mutating state outside reducers
- Calling dispatch inside reducers
- Mixing API logic with components
- Overengineering slices too early

## When to use Redux

- Global state shared across many components
- Complex async flows
- Data that must persist across navigation
- Predictable state transitions are required

## How to review a Redux implementation

- Is Redux Toolkit used correctly?
- Is state normalized and minimal?
- Are async flows handled via thunks?
- Is the folder structure scalable?
- Are components clean and mostly presentational?
