---
name: nextjs-best-practices
description: Applies best practices for building scalable, performant, and maintainable applications with Next.js using the App Router.
---

# Next.js Best Practices Skill

Use this skill when starting a new Next.js project or reviewing an existing one for architecture, performance, and code quality.

## Core principles

- Prefer **App Router** over Pages Router
- Embrace **Server Components by default**
- Optimize for performance and scalability
- Keep a clear separation of concerns

## Project setup

1. **App Router**
      - Use `/app` directory as the main entry point
      - Use `layout.tsx` for shared UI and providers
      - Keep `page.tsx` focused on composition, not logic

2. **File conventions**
      - Follow Next.js naming conventions strictly
      - Use `loading.tsx`, `error.tsx`, and `not-found.tsx`
      - Keep route segments small and meaningful

3. **Environment variables**
      - Use `.env.local` for secrets
      - Prefix public variables with `NEXT_PUBLIC_`
      - Never expose secrets to the client

## Components

4. **Server vs Client Components**
      - Default to Server Components
      - Use `"use client"` only when needed (state, effects, events)
      - Avoid turning entire trees into Client Components

5. **Component responsibility**
      - Keep components small and focused
      - Separate UI, data fetching, and business logic
      - Avoid heavy logic inside JSX

## Data fetching

6. **Fetching strategy**
      - Fetch data in Server Components whenever possible
      - Use `fetch` with caching and revalidation
      - Prefer `server actions` or route handlers for mutations

7. **Caching and revalidation**
      - Use `force-cache`, `no-store`, and `revalidate` intentionally
      - Avoid unnecessary client-side fetching
      - Understand ISR and streaming

## Performance

8. **Rendering**
      - Prefer static rendering when possible
      - Use dynamic rendering only when required
      - Leverage `Suspense` and streaming

9. **Assets**
      - Use `next/image` for images
      - Use `next/font` for fonts
      - Avoid large client-side bundles

## Routing & navigation

10. **Routing**
       - Use `Link` instead of `<a>`
       - Keep routing logic out of components
       - Prefer route groups and parallel routes when useful

## State management

11. **State strategy**
       - Use local state for local concerns
       - Use React Context sparingly
       - Use Redux/Zustand only for truly global state

## Styling

12. **Styling approach**
       - Prefer CSS Modules or Tailwind
       - Avoid global CSS unless necessary
       - Keep styles colocated with components

## SEO & metadata

13. **Metadata**
       - Use the Metadata API (`generateMetadata`)
       - Avoid manual `<head>` usage
       - Ensure dynamic routes have proper metadata

## Error handling

14. **Errors**
       - Use `error.tsx` for error boundaries
       - Handle loading and error states explicitly
       - Never let async errors crash the entire app

## Security

15. **Security best practices**
       - Validate all user inputs
       - Never trust client data
       - Use server-only code for sensitive logic

## Common mistakes to avoid

- Overusing `"use client"`
- Fetching data in `useEffect` unnecessarily
- Large monolithic components
- Mixing server and client concerns
- Ignoring caching behavior

## How to review a Next.js project

- Are Server Components used correctly?
- Is data fetched in the right layer?
- Is caching intentional and documented?
- Is the folder structure scalable?
- Are performance optimizations applied?
