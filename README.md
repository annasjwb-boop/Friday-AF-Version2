# AidFinder

A local, browser-based **mobile application prototype** built with Vite, React,
and TypeScript. It runs in a desktop browser but is designed exclusively as a
mobile app experience. On desktop it renders inside a simulated device viewport;
on narrow browser widths it becomes an edge-to-edge responsive mobile website.

This is a mobile web prototype, not a native iOS application. There is no Expo,
React Native, iOS Simulator, backend, or database.

## Requirements

- Node.js 18+ and npm (developed on Node 22, npm 10).

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Then open the printed local URL, by default:

```text
http://localhost:5173
```

## Other commands

```bash
npm run build   # type-check and produce a production build
npm run lint    # run oxlint
npm run preview # preview the production build locally
```

## Project structure

```text
src/
  app/
    App.tsx           App shell: simulator + header + content + tab bar
    routes.tsx        Route definitions (path, title, element)
    App.css           App layout styles
  components/
    mobile/           The simulator shell (kept separate from screens)
      MobileSimulator.tsx
      MobileHeader.tsx
      MobileTabBar.tsx
    ui/               Reusable interface primitives
      Button.tsx
      Card.tsx
      IconButton.tsx
      TextField.tsx
  screens/            One file per application screen
    HomeScreen.tsx
    ExploreScreen.tsx
    ProfileScreen.tsx
  styles/
    globals.css       Global resets and base styles
    tokens.css        Design tokens (colors, spacing, radii, typography...)
  types/              Shared TypeScript types
  data/               Realistic sample data
```

## How the mobile simulator behaves

`components/mobile/MobileSimulator.tsx` wraps the whole app.

- **Desktop (>= 500px):** the app is centered in a ~390 x 844 device frame with
  rounded corners, a subtle border and shadow, a minimal status bar, and a home
  indicator. The page outside the device does not scroll; scrolling happens
  inside the app content area.
- **Narrow (< 500px):** the device frame is removed. The app fills the browser
  viewport edge-to-edge, safe-area spacing is preserved, and it works as a
  responsive mobile website.

The simulator never requires horizontal browser scrolling.

## How to add a screen

1. Create `src/screens/YourScreen.tsx`. Import `./screen.css` for shared screen
   layout classes (`.screen`, `.screen__placeholder`, etc.).
2. Build the screen using primitives from `components/ui` and tokens from
   `styles/tokens.css`.

## How to add a route

1. Import your screen in [`src/app/routes.tsx`](src/app/routes.tsx).
2. Add an entry to the `routes` array with `path`, `title`, and `element`. The
   `title` is shown in the header; routing and the header update automatically.
3. To surface it in the bottom navigation, add a tab in
   [`src/components/mobile/MobileTabBar.tsx`](src/components/mobile/MobileTabBar.tsx).

## How to add a reusable component

1. Create `src/components/ui/YourComponent.tsx` plus a matching
   `YourComponent.css`.
2. Style it exclusively with design tokens so it stays consistent across
   screens.
3. Reuse it instead of duplicating markup once the same pattern appears in more
   than one place.

## Design guidance

See [`AGENTS.md`](AGENTS.md) for conventions when extending this prototype.
