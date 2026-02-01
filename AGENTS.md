# MyPitch - AI Interviews

## Project overview
MyPitch is a modern SaaS web application scaffold for AI interview practice, built with React + Vite, Material UI, Firebase Authentication, Firestore, and Google Cloud Run.

## Tech stack
- React + TypeScript + Vite
- Material UI (MUI)
- Firebase Authentication (Google + email/password)
- Firestore
- Google Cloud Run
- Google Cloud Functions (example)
- GitHub Actions

## Production URLs (current)
- Frontend: https://mypitch-frontend-810851882971.europe-west4.run.app
- Backend: https://mypitch-backend-810851882971.europe-west4.run.app

## Directory structure
```
.
├── .firebaserc
├── .github
│   └── workflows
│       ├── deploy-backend.yml
│       ├── deploy-frontend.yml
│       └── deploy-functions.yml
├── .gitignore
├── README.md
├── cloudrun
│   ├── backend-service.yaml
│   └── frontend-service.yaml
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── backend
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── src
│   │   └── index.ts
│   └── tsconfig.json
├── frontend
│   ├── .env.example
│   ├── Dockerfile
│   ├── index.html
│   ├── nginx.conf
│   ├── package.json
│   ├── public
│   │   └── favicon.svg
│   ├── src
│   │   ├── App.tsx
│   │   ├── components
│   │   │   └── NavBar.tsx
│   │   ├── context
│   │   │   └── AuthContext.tsx
│   │   ├── firebase.ts
│   │   ├── main.tsx
│   │   ├── pages
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── routes
│   │   │   └── ProtectedRoute.tsx
│   │   ├── styles.css
│   │   ├── theme.ts
│   │   └── vite-env.d.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
└── functions
    ├── package.json
    ├── src
    │   └── index.ts
    └── tsconfig.json
```

## Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud SDK (`gcloud`)
- A Google Cloud project with billing enabled

## Initialization commands
```bash
# create the Vite app
npm create vite@latest frontend -- --template react-ts

# install frontend dependencies
cd frontend
npm install
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled firebase react-router-dom
cd ..

# backend setup
cd backend
npm install
npm install express cors firebase-admin dotenv
npm install -D typescript ts-node-dev @types/express @types/cors @types/node
cd ..

# functions setup
cd functions
npm install
npm install firebase-functions firebase-admin
npm install -D typescript
cd ..
```

## Environment variables
Frontend: `frontend/.env`
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_API_BASE_URL=http://localhost:8080
VITE_PUBLIC_APP_URL=http://localhost:5173
```

Backend: `backend/.env`
```
PORT=8080
CORS_ORIGIN=http://localhost:5173
PUBLIC_APP_URL=http://localhost:5173
```

## Local development
```bash
# frontend
cd frontend
npm run dev

# backend
cd backend
npm run dev
```

For local Firestore access from the backend:
```bash
gcloud auth application-default login
```

## Firebase setup
```bash
firebase login
firebase use --add
firebase init firestore functions
```

Enable Google and email/password providers:
- Firebase Console -> Authentication -> Sign-in method

Firestore rules are in `firestore.rules`.

## Google Cloud setup
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

gcloud services enable run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  iam.googleapis.com

# create artifact registry for docker images
gcloud artifacts repositories create mypitch \
  --repository-format=docker \
  --location=us-central1
```

## Build and deploy: Cloud Run
Frontend (Cloud Run):
```bash
cd frontend

docker build \
  --build-arg VITE_FIREBASE_API_KEY=YOUR_KEY \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=YOUR_DOMAIN \
  --build-arg VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID \
  --build-arg VITE_FIREBASE_APP_ID=YOUR_APP_ID \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET=YOUR_BUCKET \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID \
  --build-arg VITE_API_BASE_URL=YOUR_BACKEND_URL \
  -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/mypitch/mypitch-frontend:latest .

docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/mypitch/mypitch-frontend:latest

gcloud run deploy mypitch-frontend \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/mypitch/mypitch-frontend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

Backend (Cloud Run):
```bash
cd backend

docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/mypitch/mypitch-backend:latest .

docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/mypitch/mypitch-backend:latest

gcloud run deploy mypitch-backend \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/mypitch/mypitch-backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars CORS_ORIGIN=YOUR_FRONTEND_URL
```

## Environment variables and secrets
Backend env vars in Cloud Run:
```bash
gcloud run services update mypitch-backend \
  --region us-central1 \
  --set-env-vars CORS_ORIGIN=YOUR_FRONTEND_URL
```

Frontend variables are compiled at build time. Set them as Docker build args or GitHub Actions secrets.

## Local testing
```bash
curl http://localhost:8080/api/health
```

## Cloud testing
```bash
gcloud run services describe mypitch-backend --region us-central1 --format='value(status.url)'
```

## Cloud Functions example deployment
```bash
cd functions
npm run build
firebase deploy --only functions
```

## CI/CD (GitHub Actions)
Workflows in `.github/workflows/` build and deploy frontend and backend to Cloud Run. Set these secrets in GitHub:
- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_SA_KEY`
- `FRONTEND_URL` (used for backend `CORS_ORIGIN`, backend `PUBLIC_APP_URL`, and frontend `VITE_PUBLIC_APP_URL`)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_API_BASE_URL`
- `FIREBASE_PROJECT_ID`
- `GEMINI_API_KEY`

For functions deployment:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_TOKEN`

## Linking Firebase config with frontend
Firebase web config is in Firebase Console -> Project settings -> General -> Your apps. Copy values into `frontend/.env` or GitHub Actions secrets.

## Development commands
```bash
cd frontend
npm run dev

cd backend
npm run dev
```

## Job statuses
Use these canonical statuses across the app:
- `open` — accepting candidates
- `paused` — temporarily closed to new invites
- `closed` — role filled, no new invites
- `archived` — hidden from active lists

## Live style guide (internal only)
- Route: `/styleguide`
- Enabled only when `VITE_ENABLE_STYLE_GUIDE=true` in your local `.env`
- Do not set this env var in production builds


## Common architecture rules (front-end)

Use these rules when composing new UI and features:

- **Page vs. component boundary:** Pages orchestrate data fetching and routing; components are pure UI + local state.
- **Single responsibility:** One component = one purpose. Extract repeated UI into shared components early.
- **Data flow:** Keep server data in the page (or a page-level hook). Pass down via props; avoid global state unless multiple pages need it.
- **API integration:** Centralize HTTP logic in `frontend/src/api/`. Do not call `fetch` directly inside UI components.
- **Validation:** Validate user input at the component boundary before calling the API.
- **Error handling:** Show user-facing errors near the action; log full errors in console.
- **Loading states:** Always provide explicit loading/empty states for async views.
- **Styling:** Prefer MUI `sx` or theme overrides; avoid custom CSS unless needed globally.
- **Reusability:** Use shared components for cards, tables, dialogs, and forms once patterns repeat.

## Loader usage (consistent UX)

Use the shared loader component for all loading states:

- **Component:** `frontend/src/components/ui/Loader.tsx`
- **Variants:**
  - `page` — full-page loading (route-level fetches).
  - `section` — loading inside a card/section.
  - `inline` — loading inside buttons or small UI areas.

Guidelines:
- Always show a short label (e.g., "Loading jobs…", "Saving…").
- Avoid raw spinners in pages; use the Loader component for consistency.

## Table layout (consistent UI)

Use the shared table wrapper for consistent headers and spacing:

- **Component:** `frontend/src/components/ui/TableCard.tsx`
- **Usage:** Wrap tables and empty states inside `TableCard` for a consistent header layout.


# Material UI

This is the documentation for the Material UI package.
It contains comprehensive guides, components, and utilities for building user interfaces.

## Components

- [App Bar React component](https://mui.com/material-ui/react-app-bar.md): The App Bar displays information and actions relating to the current screen.
- [Backdrop React Component](https://mui.com/material-ui/react-backdrop.md): The Backdrop component narrows the user's focus to a particular element on the screen.
- [Bottom Navigation React component](https://mui.com/material-ui/react-bottom-navigation.md): The Bottom Navigation bar allows movement between primary destinations in an app.
- [Circular, Linear progress React components](https://mui.com/material-ui/react-progress.md): Progress indicators commonly known as spinners, express an unspecified wait time or display the length of a process.
- [CSS Baseline](https://mui.com/material-ui/react-css-baseline.md): The CssBaseline component helps to kickstart an elegant, consistent, and simple baseline to build upon.
- [Detect click outside React component](https://mui.com/material-ui/react-click-away-listener.md): The Click-Away Listener component detects when a click event happens outside of its child element.
- [How to customize](https://mui.com/material-ui/customization/how-to-customize.md): Learn how to customize Material UI components by taking advantage of different strategies for specific use cases.
- [Image List React component](https://mui.com/material-ui/react-image-list.md): The Image List displays a collection of images in an organized grid.
- [InitColorSchemeScript component](https://mui.com/material-ui/react-init-color-scheme-script.md): The InitColorSchemeScript component eliminates dark mode flickering in server-side-rendered applications.
- [Links](https://mui.com/material-ui/react-link.md): The Link component allows you to easily customize anchor elements with your theme colors and typography styles.
- [No SSR React component](https://mui.com/material-ui/react-no-ssr.md): The No-SSR component defers the rendering of children components from the server to the client.
- [Number field React component](https://mui.com/material-ui/react-number-field.md): A React component for capturing numeric input from users.
- [React Accordion component](https://mui.com/material-ui/react-accordion.md): The Accordion component lets users show and hide sections of related content on a page.
- [React Alert component](https://mui.com/material-ui/react-alert.md): Alerts display brief messages for the user without interrupting their use of the app.
- [React Autocomplete component](https://mui.com/material-ui/react-autocomplete.md): The autocomplete is a normal text input enhanced by a panel of suggested options.
- [React Avatar component](https://mui.com/material-ui/react-avatar.md): Avatars are found throughout material design with uses in everything from tables to dialog menus.
- [React Badge component](https://mui.com/material-ui/react-badge.md): Badge generates a small badge to the top-right of its child(ren).
- [React Box](https://mui.com/material-ui/react-box.md): The Box component is a generic, theme-aware container with access to CSS utilities from MUI System.
- [React Breadcrumbs component](https://mui.com/material-ui/react-breadcrumbs.md): A breadcrumbs is a list of links that help visualize a page's location within a site's hierarchical structure, it allows navigation up to any of the ancestors.
- [React Button component](https://mui.com/material-ui/react-button.md): Buttons allow users to take actions, and make choices, with a single tap.
- [React Button Group component](https://mui.com/material-ui/react-button-group.md): The ButtonGroup component can be used to group related buttons.
- [React Card component](https://mui.com/material-ui/react-card.md): Cards contain content and actions about a single subject.
- [React Checkbox component](https://mui.com/material-ui/react-checkbox.md): Checkboxes allow the user to select one or more items from a set.
- [React Chip component](https://mui.com/material-ui/react-chip.md): Chips are compact elements that represent an input, attribute, or action.
- [React Container component](https://mui.com/material-ui/react-container.md): The container centers your content horizontally. It's the most basic layout element.
- [React Dialog component](https://mui.com/material-ui/react-dialog.md): Dialogs inform users about a task and can contain critical information, require decisions, or involve multiple tasks.
- [React Divider component](https://mui.com/material-ui/react-divider.md): The Divider component provides a thin, unobtrusive line for grouping elements to reinforce visual hierarchy.
- [React Drawer component](https://mui.com/material-ui/react-drawer.md): The navigation drawers (or "sidebars") provide ergonomic access to destinations in a site or app functionality such as switching accounts.
- [React Floating Action Button (FAB) component](https://mui.com/material-ui/react-floating-action-button.md): A Floating Action Button (FAB) performs the primary, or most common, action on a screen.
- [React Grid component](https://mui.com/material-ui/react-grid.md): The responsive layout grid adapts to screen size and orientation, ensuring consistency across layouts.
- [React GridLegacy component](https://mui.com/material-ui/react-grid-legacy.md): The Material Design responsive layout grid adapts to screen size and orientation, ensuring consistency across layouts.
- [React Icon Component](https://mui.com/material-ui/icons.md): Guidance and suggestions for using icons with Material UI.
- [React List component](https://mui.com/material-ui/react-list.md): Lists are continuous, vertical indexes of text or images.
- [React Masonry component](https://mui.com/material-ui/react-masonry.md): Masonry lays out contents of varying dimensions as blocks of the same width and different height with configurable gaps.
- [React Menu component](https://mui.com/material-ui/react-menu.md): Menus display a list of choices on temporary surfaces.
- [React Modal component](https://mui.com/material-ui/react-modal.md): The modal component provides a solid foundation for creating dialogs, popovers, lightboxes, or whatever else.
- [React Pagination component](https://mui.com/material-ui/react-pagination.md): The Pagination component enables the user to select a specific page from a range of pages.
- [React Paper component](https://mui.com/material-ui/react-paper.md): The Paper component is a container for displaying content on an elevated surface.
- [React Popover component](https://mui.com/material-ui/react-popover.md): A Popover can be used to display some content on top of another.
- [React Popper component](https://mui.com/material-ui/react-popper.md): A Popper can be used to display some content on top of another. It's an alternative to react-popper.
- [React Portal component](https://mui.com/material-ui/react-portal.md): The Portal component lets you render its children into a DOM node that exists outside of the Portal's own DOM hierarchy.
- [React Radio Group component](https://mui.com/material-ui/react-radio-button.md): The Radio Group allows the user to select one option from a set.
- [React Rating component](https://mui.com/material-ui/react-rating.md): Ratings provide insight regarding others' opinions and experiences, and can allow the user to submit a rating of their own.
- [React Select component](https://mui.com/material-ui/react-select.md): Select components are used for collecting user provided information from a list of options.
- [React Skeleton component](https://mui.com/material-ui/react-skeleton.md): Display a placeholder preview of your content before the data gets loaded to reduce load-time frustration.
- [React Slider component](https://mui.com/material-ui/react-slider.md): Sliders allow users to make selections from a range of values.
- [React Snackbar component](https://mui.com/material-ui/react-snackbar.md): Snackbars (also known as toasts) are used for brief notifications of processes that have been or will be performed.
- [React Speed Dial component](https://mui.com/material-ui/react-speed-dial.md): When pressed, a floating action button can display three to six related actions in the form of a Speed Dial.
- [React Stack component](https://mui.com/material-ui/react-stack.md): Stack is a container component for arranging elements vertically or horizontally.
- [React Stepper component](https://mui.com/material-ui/react-stepper.md): Steppers convey progress through numbered steps. It provides a wizard-like workflow.
- [React Switch component](https://mui.com/material-ui/react-switch.md): Switches toggle the state of a single setting on or off.
- [React Table component](https://mui.com/material-ui/react-table.md): Tables display sets of data. They can be fully customized.
- [React Tabs component](https://mui.com/material-ui/react-tabs.md): Tabs make it easy to explore and switch between different views.
- [React Text Field component](https://mui.com/material-ui/react-text-field.md): Text Fields let users enter and edit text.
- [React Timeline component](https://mui.com/material-ui/react-timeline.md): The timeline displays a list of events in chronological order.
- [React Tooltip component](https://mui.com/material-ui/react-tooltip.md): Tooltips display informative text when users hover over, focus on, or tap an element.
- [React Transition component](https://mui.com/material-ui/transitions.md): Transitions help to make a UI expressive and easy to use.
- [React Typography component](https://mui.com/material-ui/react-typography.md): Use typography to present your design and content as clearly and efficiently as possible.
- [Textarea Autosize React component](https://mui.com/material-ui/react-textarea-autosize.md): The Textarea Autosize component automatically adjusts its height to match the length of the content within.
- [Toggle Button React component](https://mui.com/material-ui/react-toggle-button.md): A Toggle Button can be used to group related options.

## Design Resources

- [Material UI for Figma](https://mui.com/material-ui/design-resources/material-ui-for-figma.md): Enhance designer-developer collaboration between Material UI and Figma.
- [Material UI Sync plugin 🧪](https://mui.com/material-ui/design-resources/material-ui-sync.md): Sync is a Figma plugin that generates Material UI themes directly from design to code.

## Discover More

- [Showcase](https://mui.com/material-ui/discover-more/showcase.md): Check out these public apps using Material UI to get inspired for your next project.
- [Related projects](https://mui.com/material-ui/discover-more/related-projects.md): A carefully curated list of tools that expand or build on top of Material UI.
- [Roadmap](https://mui.com/material-ui/discover-more/roadmap.md): Keep up with ongoing projects and help shape the future of Material UI.
- [Sponsors and Backers](https://mui.com/material-ui/discover-more/backers.md): Support the development of the open-source projects of the MUI organization through crowdfunding.
- [Vision](https://mui.com/material-ui/discover-more/vision.md): Our vision is to provide an elegant React implementation of the Material Design guidelines that can be customized to fully match your brand.
- [Changelog](https://mui.com/material-ui/discover-more/changelog.md): Material UI follows Semantic Versioning 2.0.0.

## Material UI

- [Material UI components](https://mui.com/material-ui/all-components.md): Every Material UI component available so far.
- [Transfer list React component](https://mui.com/material-ui/react-transfer-list.md): A Transfer List (or "shuttle") enables the user to move one or more list items between lists.
- [Media queries in React for responsive design](https://mui.com/material-ui/react-use-media-query.md): This React hook listens for matches to a CSS media query. It allows the rendering of components based on whether the query matches or not.

## Getting Started

- [Installation](https://mui.com/material-ui/getting-started/installation.md): Install Material UI, the world's most popular React UI framework.
- [Usage](https://mui.com/material-ui/getting-started/usage.md): Learn the basics of working with Material UI components.
- [Model Context Protocol (MCP) for MUI](https://mui.com/material-ui/getting-started/mcp.md): Access the official Material UI docs and code examples in your AI client.
- [Example projects](https://mui.com/material-ui/getting-started/example-projects.md): A collection of examples and scaffolds integrating Material UI with popular libraries and frameworks.
- [New Free React Templates](https://mui.com/material-ui/getting-started/templates.md): Browse our collection of free React templates to get started building your app with Material UI, including a React dashboard, React marketing page, and more.
- [Learning resources](https://mui.com/material-ui/getting-started/learn.md): New to Material UI? Get up to speed quickly with our curated list of learning resources.
- [Design resources](https://mui.com/material-ui/getting-started/design-resources.md): Be more efficient designing and developing with the same library.
- [Frequently Asked Questions](https://mui.com/material-ui/getting-started/faq.md): Stuck on a particular problem? Check some of these common gotchas first in the FAQ.
- [Supported components](https://mui.com/material-ui/getting-started/supported-components.md): The following is a list of Material Design components & features.
- [Supported platforms](https://mui.com/material-ui/getting-started/supported-platforms.md): Learn about the platforms, from modern to old, that are supported by Material UI.
- [Support](https://mui.com/material-ui/getting-started/support.md): Learn how to get support for Material UI components, including feature requests, bug fixes, and technical support from the team.

## Customization

- [Overriding component structure](https://mui.com/material-ui/customization/overriding-component-structure.md): Learn how to override the default DOM structure of Material UI components.
- [Dark mode](https://mui.com/material-ui/customization/dark-mode.md): Material UI comes with two palette modes: light (the default) and dark.
- [Color](https://mui.com/material-ui/customization/color.md): Convey meaning through color. Out of the box you get access to all colors in the Material Design guidelines.
- [Right-to-left support](https://mui.com/material-ui/customization/right-to-left.md): Learn how to implement right-to-left (RTL) text with Material UI to support languages such as Arabic, Persian, and Hebrew.
- [Shadow DOM](https://mui.com/material-ui/customization/shadow-dom.md): The shadow DOM lets you encapsulate parts of an app to keep them separate from global styles that target the regular DOM tree.
- [Default theme viewer](https://mui.com/material-ui/customization/default-theme.md): This tree view allows you to explore how the theme object looks like with the default values.
- [Theming](https://mui.com/material-ui/customization/theming.md): Customize Material UI with your theme. You can change the colors, the typography and much more.
- [Creating themed components](https://mui.com/material-ui/customization/creating-themed-components.md): Learn how to create fully custom components that accept your app's theme.
- [Themed components](https://mui.com/material-ui/customization/theme-components.md): You can customize a component's styles, default props, and more by using its component key inside the theme.
- [Palette](https://mui.com/material-ui/customization/palette.md): The palette enables you to modify the color of the components to suit your brand.
- [Typography](https://mui.com/material-ui/customization/typography.md): The theme provides a set of type sizes that work well together, and also with the layout grid.
- [Spacing](https://mui.com/material-ui/customization/spacing.md): Use the theme.spacing() helper to create consistent spacing between the elements of your UI.
- [Shape](https://mui.com/material-ui/customization/shape.md): The shape is a design token that helps control the border radius of components.
- [Breakpoints](https://mui.com/material-ui/customization/breakpoints.md): API that enables the use of breakpoints in a wide variety of contexts.
- [Container queries](https://mui.com/material-ui/customization/container-queries.md): Material UI provides a utility function for creating CSS container queries based on theme breakpoints.
- [Density](https://mui.com/material-ui/customization/density.md): How to apply density to Material UI components.
- [z-index](https://mui.com/material-ui/customization/z-index.md): z-index is the CSS property that helps control layout by providing a third axis to arrange content.
- [Transitions](https://mui.com/material-ui/customization/transitions.md): These theme helpers allow you to create custom CSS transitions, you can customize the durations, easings and more.
- [CSS Layers](https://mui.com/material-ui/customization/css-layers.md): Learn how to generate Material UI styles with cascade layers.

## Guides

- [Building extensible themes](https://mui.com/material-ui/guides/building-extensible-themes.md): Learn how to build extensible themes with Material UI.
- [Minimizing bundle size](https://mui.com/material-ui/guides/minimizing-bundle-size.md): Learn how to reduce your bundle size and improve development performance by avoiding costly import patterns.
- [Server rendering](https://mui.com/material-ui/guides/server-rendering.md): The most common use case for server-side rendering is to handle the initial render when a user (or search engine crawler) first requests your app.
- [Responsive UI](https://mui.com/material-ui/guides/responsive-ui.md): Material Design layouts encourage consistency across platforms, environments, and screen sizes by using uniform elements and spacing.
- [Testing](https://mui.com/material-ui/guides/testing.md): Write tests to prevent regressions and write better code.
- [Localization](https://mui.com/material-ui/guides/localization.md): Localization (also referred to as "l10n") is the process of adapting a product or content to a specific locale or market.
- [API design approach](https://mui.com/material-ui/guides/api.md): We have learned a great deal regarding how Material UI is used, and the v1 rewrite allowed us to completely rethink the component API.
- [TypeScript](https://mui.com/material-ui/guides/typescript.md): You can add static typing to JavaScript to improve developer productivity and code quality thanks to TypeScript.
- [Composition](https://mui.com/material-ui/guides/composition.md): Material UI tries to make composition as easy as possible.
- [Content Security Policy (CSP)](https://mui.com/material-ui/guides/content-security-policy.md): This section covers the details of setting up a CSP.

## Integrations

- [Next.js integration](https://mui.com/material-ui/integrations/nextjs.md): Learn how to use Material UI with Next.js.
- [Routing libraries](https://mui.com/material-ui/integrations/routing.md): By default, the navigation is performed with a native &lt;a&gt; element. You can customize it, for instance, using Next.js's Link or react-router.
- [Using styled-components](https://mui.com/material-ui/integrations/styled-components.md): Learn how to use styled-components instead of Emotion with Material UI.
- [Style library interoperability](https://mui.com/material-ui/integrations/interoperability.md): While you can use the Emotion-based styling solution provided by Material UI, you can also use the one you already know, from plain CSS to styled-components.
- [Theme scoping](https://mui.com/material-ui/integrations/theme-scoping.md): Learn how to use multiple styling solutions in a single Material UI app.

## Migration

- [Upgrade to Grid v2](https://mui.com/material-ui/migration/upgrade-to-grid-v2.md): This guide explains how and why to migrate from the GridLegacy component to the Grid component.
- [Migration from @material-ui/pickers](https://mui.com/material-ui/migration/pickers-migration.md): <p class="description"><code>@material-ui/pickers</code> was moved to the <code>@mui/lab</code>.</p>
- [Upgrade to v7](https://mui.com/material-ui/migration/upgrade-to-v7.md): This guide explains how to upgrade from Material UI v6 to v7.
- [Upgrade to v6](https://mui.com/material-ui/migration/upgrade-to-v6.md): This guide explains why and how to upgrade from Material UI v5 to v6.
- [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis.md): Learn how to migrate away from recently deprecated APIs before they become breaking changes.
- [Migrating to v5: getting started](https://mui.com/material-ui/migration/migration-v4.md): This guide explains how and why to migrate from Material UI v4 to v5.
- [Migration from v3 to v4](https://mui.com/material-ui/migration/migration-v3.md): Yeah, v4 has been released!
- [Migration from v0.x to v1](https://mui.com/material-ui/migration/migration-v0x.md): Yeah, v1 has been released! Take advantage of 2 years worth of effort.
