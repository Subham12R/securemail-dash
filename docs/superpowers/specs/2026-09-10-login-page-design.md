# Design Specification: White Theme Animated Login Page

## 1. Overview
This specification defines the integration of a split-screen login page for SecureMailScope, styled in a clean white/light theme. The page features a dedicated sign-in form on the left (with email input and magic link submission) and an animated, interactive dithered pixel canvas on the right accompanied by a customer testimonial and enterprise brand badges. Per requirements, 3rd-party logins (Google, Apple, GitHub) are completely omitted.

## 2. Requirements & Constraints
1. **White/Light Theme Aesthetic**: Clean, modern white backdrop (`#ffffff`) on the form panel and subtle off-white/light-zinc (`#f8fafc` / `#f4f4f5`) on the canvas panel with contrasting slate dither dots (`#cbd5e1` to `#94a3b8`).
2. **Animated Dithered Pixel Background**: Authentic ordered 4×4 Bayer matrix dithering over an animated multi-frequency wave field, rendered via high-performance HTML5 2D canvas with mouse-reactive stippling.
3. **No 3rd-Party Logins**: Omit all OAuth/social providers; provide a streamlined work email magic link flow.
4. **App Integration**:
   - Resides at `/login` (`app/login/page.tsx`).
   - Root layout (`app/layout.tsx`) dynamically bypasses the dashboard sidebar and capture queue drawer when viewing `/login`.
   - Sidebar's "Logout" button links directly to `/login`.
5. **SecureMailScope Branding**: Custom testimonial and iconography tailored to cryptographic email security analysis.

---

## 3. Architecture & Routing

### 3.1 App Shell Adaptation
Currently, `app/layout.tsx` renders `<Sidebar />` and live capture queue providers unconditionally:
```tsx
<body className="flex h-screen w-full flex-col overflow-hidden bg-white">
  <div className="flex min-h-0 min-w-0 flex-1">
    <Sidebar />
    <CaptureQueueProvider>
      <LiveDataRefreshProvider />
      {children}
    </CaptureQueueProvider>
  </div>
  <Toaster position="top-right" richColors closeButton />
</body>
```

To support full-screen unauthenticated views without sidebar clutter:
- Create a client shell component (`components/layout/app-shell.tsx`) that checks `usePathname()`.
- If `pathname === "/login"`, it renders `{children}` directly without `<Sidebar />` or dashboard-specific providers.
- If `pathname !== "/login"`, it mounts `<Sidebar />` and the standard dashboard shell.
- `app/layout.tsx` wraps the body content inside this shell.

### 3.2 Logout Navigation
In `components/ui/sidebar.tsx`, convert the static logout container into an accessible Next.js `<Link href="/login">` or button that navigates to `/login`.

---

## 4. Component Structure

```
app/
├── login/
│   └── page.tsx                     # Main login page (metadata, layout split)
components/
├── layout/
│   └── app-shell.tsx                # Route-aware wrapper separating dashboard from auth
└── login/
    ├── dither-canvas.tsx            # HTML5 Canvas 2D animated dither engine
    ├── login-form.tsx               # Work email magic link input & state handling
    └── enterprise-logos.tsx         # Vector SVG logos for enterprise trust footer
```

### 4.1 `app/login/page.tsx`
- Split-screen layout:
  - Left column: `w-full md:w-1/2 lg:w-[45%] flex flex-col justify-between p-8 md:p-12 lg:p-16 bg-white min-h-screen z-10`.
  - Right column: `hidden md:flex flex-1 relative overflow-hidden bg-zinc-50 border-l border-zinc-200/80 min-h-screen`.
- Renders `<LoginForm />` inside the left column.
- Renders `<DitherCanvas />` and testimonial/enterprise overlay inside the right column.

### 4.2 `components/login/dither-canvas.tsx` (Canvas Dither Engine)
- **Canvas Size & Resolution**:
  - Automatically measures parent container using a `ResizeObserver`.
  - Configures canvas buffer scaled by `window.devicePixelRatio` for razor-sharp rendering on Retina displays.
  - Computes dithering at a stepped pixel scale (`step = 3px` or `4px`), ensuring retro graininess and virtually zero CPU/GPU overhead.
- **Ordered Bayer Dithering Matrix (4×4)**:
  Normalized Bayer threshold matrix:
  ```
  M = [
    [  0/16,  8/16,  2/16, 10/16 ],
    [ 12/16,  4/16, 14/16,  6/16 ],
    [  3/16, 11/16,  1/16,  9/16 ],
    [ 15/16,  7/16, 13/16,  5/16 ]
  ]
  ```
- **Continuous Noise / Wave Equation**:
  At any pixel coordinate $(x, y)$ and time $t$:
  $$I(x, y, t) = 0.5 + 0.25 \cdot \sin(0.008x + 0.006y + 0.6t) + 0.25 \cdot \cos(0.005x - 0.007y - 0.4t)$$
- **Mouse Interaction**:
  Tracks mouse position $(mx, my)$ relative to canvas:
  $$d = \sqrt{(x - mx)^2 + (y - my)^2}$$
  $$ripple = 0.35 \cdot \exp(-d / 120) \cdot \sin(d \cdot 0.08 - t \cdot 3)$$
  $$I_{total}(x, y, t) = \text{clamp}(I(x, y, t) + ripple, 0, 1)$$
- **Thresholding & Color**:
  Let $(bx, by) = (x \pmod 4, y \pmod 4)$.
  If $I_{total}(x, y, t) > M[by][bx]$, draw pixel in light slate (`rgba(100, 116, 139, 0.22)`), else draw in transparent / lighter tone (`rgba(241, 245, 249, 0.6)`).
- **Reduced Motion**:
  Checks `window.matchMedia("(prefers-reduced-motion: reduce)")`. When active, holds $t = 0$ (static crisp pattern).

### 4.3 `components/login/login-form.tsx`
- **Branding Header**:
  - SecureMailScope icon badge (black rounded square with white shield/mail glyph).
  - Title: "Sign in" (`text-2xl font-semibold tracking-tight text-zinc-900`).
  - Subtitle: "Enter your work email to get a magic link." (`text-sm text-zinc-500 mt-1.5`).
- **Form Controls**:
  - Email input with placeholder `name@company.com`, auto-focus, accessible label.
  - Helper copy: "Your magic link stays active for 15 minutes." (`text-xs text-zinc-400 mt-2`).
  - Submit Button: Full-width button "Send magic link" with arrow icon (`ArrowRight` from `lucide-react`).
- **State Machine**:
  1. `idle`: Standard form display.
  2. `submitting`: Disabled input and button with loading spinner (`Loader2` spin).
  3. `sent`: Shows confirmation card with green indicator, displaying the submitted email address, a prominent "Enter Dashboard (Demo) →" link, and a "Resend link" button.
- **Notifications**: Fires `toast.success("Magic link sent to " + email)` on submit.

### 4.4 Testimonial & Badges (Right Panel Overlay)
- **Positioning**: Layered above the canvas via `relative z-10 flex flex-col justify-between h-full p-12 lg:p-16 pointer-events-none`.
- **Testimonial Block**:
  - 5 stars rendered in gold (`text-amber-500 fill-amber-500`).
  - Quote: *“The best security tools disappear into your workflow. SecureMailScope already feels instantaneous.”* (`text-2xl lg:text-3xl font-medium tracking-tight text-zinc-900 max-w-lg`).
  - Author credentials:
    - Profile avatar image/initials.
    - Name: "Sean Bold".
    - Role: "Co-founder • ReUI" (or "Director of Security Engineering").
- **Enterprise Section**:
  - Header: "Trusted by leading teams" (`text-xs font-semibold uppercase tracking-widest text-zinc-500`).
  - SVG Vector Badges: OpenAI, Stripe, Supabase, Slack rendered in monochrome zinc (`text-zinc-600 hover:text-zinc-900 transition-colors`).

---

## 5. Accessibility & Responsiveness
- **Semantic HTML**: `<main>`, `<form>`, `<label>`, `<input type="email">`, `<button>`.
- **Keyboard Navigation**: Standard focus outlines and keyboard submit.
- **Mobile Experience**:
  - `< 768px`: Form takes full width (`w-full`), right canvas panel is gracefully hidden.
  - `>= 768px`: Full 50/50 split layout.
- **Reduced Motion**: Disables animation loop when user prefers reduced motion.

---

## 6. Verification & Validation Plan
1. **Lint & Build**: Execute `npm run lint` and `npx next build` to ensure clean compilation without TypeScript or ESLint errors.
2. **Visual & Behavioral Checks**:
   - Navigate to `http://localhost:3000/login` — verify that the dashboard sidebar is NOT displayed.
   - Verify white theme styling on left and right panels.
   - Move cursor over right panel — verify subtle stippling ripple under cursor.
   - Enter an invalid email — verify inline error message.
   - Submit a valid email — verify loading state, toast, and transition to "Magic link sent" confirmation with working link to `/`.
   - In sidebar on `/`, click "Logout" — verify navigation to `/login`.
