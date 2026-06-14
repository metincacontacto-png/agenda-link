# Design Specification: Responsive Premium Landing Page Layout

Make the booking landing page have a premium look and a responsive layout that adapts to both mobile and desktop screens, avoiding a narrow single column on desktop screens.

## 1. Goal & Requirements
- **Goal:** Redesign the landing page layout (`src/app/[slug]/page.tsx`) so that on computer screens (desktop) it expands to a wider, multi-column grid rather than being constrained to a mobile-oriented 480px width, while preserving the mobile-first styling on smaller screens.
- **Visual Presence:** Use modern web design elements (glassmorphic cards, CSS transitions, hover states, premium layouts) to create a striking first impression.
- **Responsiveness:** Maintain a clean, single-column layout on mobile devices (`max-width: 767px`), and transition to a multi-column structure on tablets/desktops (`min-width: 768px`).

## 2. Layout Structure (HTML & CSS)
On desktop screens (`@media (min-width: 768px)`):
- The page container (`.container`) will expand from `480px` to `1024px` maximum width.
- The banner Hero section (`.landingHero`) will increase in height (e.g. `320px`) and size of elements to have a stronger visual impact.
- Introduce a grid wrapper (`.landingLayoutGrid`) for the sections under the Hero.
  - **Left Column (approx. 40% width):** Includes "Sobre Nosotros" (About us), quick contact grid (Phone, Hours, Address), and advantages ("¿Por qué elegirnos?").
  - **Right Column (approx. 60% width):** Includes "Nuestros Servicios" / "Nuestra Carta" (Services/Menu) and "Opiniones de Clientes" (Testimonials).
- The testimonials carrusel will be styled with proper padding and visual indicators to prevent hard clipping.
- The floating action bar (`.floatingCTA`) will be adjusted so that it doesn't span the entire screen width on desktop, centering nicely inside the desktop viewport.

## 3. Style Upgrades
- Apply the `.glassCard` layout token from `globals.css` to sections (`.landingSection`, `.contactPill`, `.testimonialCard`, `.landingServiceCard`) to establish visual depth.
- Standardize padding, margin, shadows, and borders with responsive spacing.
- Introduce micro-interactions (hover transformations, smooth scale transitions, box-shadow animations).

## 4. Verification Plan
- **Manual Verification:** Open the web app on desktop and verify the grid layout. Toggle device toolbar in browser devtools to ensure it scales correctly down to mobile (single column) and back to desktop.
- **Build & Compilation:** Run `npm run build` or dev server checks to ensure no TypeScript or CSS compiler errors exist.
