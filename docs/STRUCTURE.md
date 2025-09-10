# Mindful Commune AI — Codebase Structure

This document describes the current structure after reorganizing into a feature-first layout and adding backend scaffolding.

## Top-level
- `index.html`: Vite entry HTML
- `package.json` / `package-lock.json`: dependencies & scripts
- `vite.config.ts`, `tsconfig*.json`, `tailwind.config.ts`, `postcss.config.js`, `eslint.config.js`: build, typing, styling, linting
- `public/`: static assets (served as-is)

## Frontend (`src/`)
- `main.tsx`: React bootstrap
- `App.tsx`: App shell/routing composition
- `index.css`, `App.css`: global styles
- `assets/`: static images, media
- `lib/`: shared utilities
  - `apiClient.ts`: minimal `fetch` wrapper
  - `utils.ts`: general helpers
- `hooks/`: cross-cutting React hooks
  - `use-toast.ts`: toast utilities
  - `use-mobile.tsx`: responsive detection
- `components/`: shared, cross-feature components
  - `Header.tsx`: global header with compose entry
  - `HeroSection.tsx`: landing page hero
  - `LeftSidebar.tsx`: shared navigation sidebar
  - `ui/`: design system primitives (shadcn-style)
- `features/`: feature-first domains
  - `journaling/`
    - `components/`
      - `JournalFeed.tsx`: feed + search/tabs + inline editor entry
      - `JournalPost.tsx`: post card
      - `CreatePostModal.tsx`: modal-based post creation
      - `RedditStylePostEditor.tsx`: rich editor
      - `index.ts`: barrel exports
    - `services/`: API stubs (`index.ts`)
    - `routes/`: placeholder for feature route configs
    - `types/`: feature-specific types
  - `community/`
    - `components/`
      - `CommunitySidebar.tsx`: community suggestions/filters
      - `index.ts`: barrel exports
    - `services/`, `routes/`, `types/`: placeholders
  - `chatbot/`
    - `components/`, `services/`, `routes/`, `types/`: placeholders for conversational UI
- `pages/`: route-level screens that compose features
  - `Index.tsx`: landing page (uses `Header`, `HeroSection`)
  - `Communities.tsx`: communities view (uses `Header`, `LeftSidebar`, `CommunitySidebar`, `JournalFeed`, `RedditStylePostEditor`)
  - `NotFound.tsx`: 404 page

### Imports and path aliases
- `tsconfig.json` configures `@/*` to map to `src/*`.
- Feature components are imported via barrels, e.g.:
  - `import { JournalFeed, RedditStylePostEditor } from "@/features/journaling/components"`.
  - `import { CommunitySidebar } from "@/features/community/components"`.

### Styling
- TailwindCSS with utilities applied in components.
- UI primitives in `components/ui/` ensure consistency and a11y.

## Backend (scaffold only)
- `backend/`: monorepo-like structure for services
  - `README.md`: conventions
  - `journaling/`, `community/`, `chatbot/`: per-feature service folders
    - Each suggests `src/{controllers,routes,services,models,utils}` and `tests/`.

## Conventions
- Feature-first organization: colocate `components/`, `services/`, `routes/`, `types/` per domain under `src/features/<domain>/`.
- Keep truly shared UI in `components/ui/` and cross-feature sections (e.g., `Header`, `HeroSection`, `LeftSidebar`) in `components/`.
- Prefer barrel files (`index.ts`) for ergonomic imports and controlled public APIs.
- New API accessors go under `<feature>/services/` and should use `lib/apiClient.ts`.

## Where to add code
- New domain/feature: create `src/features/<new-feature>/{components,services,routes,types}`.
- New page: add under `src/pages/` and compose from features.
- Shared hook/utility: `src/hooks/` or `src/lib/` respectively.
- Backend endpoints: implement inside `backend/<feature>/src/` following the suggested layout.

## Scripts
- `npm run dev`: start Vite dev server
- `npm run build`: production build
- `npm run preview`: preview production build

## Notes
- We removed unused `LoadingSpinner.tsx`. Keep an eye on unused files by running TypeScript and build checks.
- If routing grows, consider centralizing route config and lazy-loading feature routes under `features/<domain>/routes`. 