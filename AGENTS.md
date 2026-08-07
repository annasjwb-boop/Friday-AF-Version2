# AidFinder - Agent Guidance

AidFinder is a local, browser-based mobile application prototype. It runs in a
desktop browser but is designed exclusively as a mobile app experience.

## Working principles

- Treat this as a mobile application, even though it runs in a browser.
- Design for a 390px-wide viewport first.
- Do not introduce desktop layouts unless explicitly requested.
- Use reusable components where repetition is visible.
- Do not create abstractions for hypothetical future requirements.
- Use design tokens (`src/styles/tokens.css`) rather than scattered hardcoded
  values.
- Keep interactions functional rather than producing static mockups.
- Use realistic sample data instead of lorem ipsum.
- Preserve the mobile simulator shell across screens.
- Make the smallest reasonable change when modifying an existing screen.
- Do not add a backend unless explicitly requested.
- Do not replace the design system or project structure without explicit
  approval.

## Project structure

```text
src/
  app/            App shell, layout, and route definitions
  components/
    mobile/       Device frame, header, and tab bar (the simulator shell)
    ui/           Reusable interface primitives (Button, Card, etc.)
  screens/        One file per application screen
  styles/         globals.css and design tokens
  types/          Shared TypeScript types
  data/           Realistic sample data
```

## Tech constraints

- Stack: Vite + React + TypeScript, React Router, lucide-react icons.
- Styling: plain CSS with CSS custom properties. Do not add Tailwind or a large
  component library.
- Do not add Expo, React Native, Next.js, a database, or native iOS
  dependencies.
