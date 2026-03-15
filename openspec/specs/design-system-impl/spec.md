## ADDED Requirements

### Requirement: CSS custom properties SHALL implement all design system tokens

The file `apps/server/web/app.css` SHALL define CSS custom properties for all foundation tokens (background, foreground, card, muted, accent, border, primary, secondary, destructive, success, warning), all 7 attention state tokens (`--state-working` through `--state-paused`), and all 7 stage tokens (`--stage-inbox` through `--stage-done`) in both `:root` (light) and `.dark` (dark) scopes. Values SHALL match `docs/DESIGN_SYSTEM.md` exactly.

#### Scenario: Light mode tokens are defined
- **WHEN** the application loads without the `.dark` class on `<html>`
- **THEN** `--background` resolves to `220 14% 96%`
- **AND** `--primary` resolves to `192 90% 42%`
- **AND** `--stage-build` resolves to `192 90% 42%`
- **AND** `--state-blocked` resolves to `0 72% 50%`

#### Scenario: Dark mode tokens are defined
- **WHEN** the `.dark` class is present on `<html>`
- **THEN** `--background` resolves to `222 20% 7%`
- **AND** `--primary` resolves to `192 90% 50%`

### Requirement: Tailwind SHALL be configured with design system overrides

The Tailwind configuration SHALL extend the theme with font families (Chakra Petch for display, Outfit for body, JetBrains Mono for code) and SHALL override all border-radius values to `0`.

#### Scenario: Border radius is zero throughout
- **WHEN** a component uses Tailwind's `rounded-lg`, `rounded-md`, or `rounded-sm` classes
- **THEN** the computed border-radius is `0px`

#### Scenario: Font families are available
- **WHEN** a component uses the `font-display` class
- **THEN** the computed font-family starts with `Chakra Petch`

### Requirement: Google Fonts SHALL be loaded in the HTML shell

The `apps/server/web/index.html` file SHALL include `<link>` tags that load Chakra Petch (weights 400, 500, 600, 700), Outfit (weights 400, 500, 600), and JetBrains Mono (weights 400, 500, 700) from Google Fonts.

#### Scenario: Fonts load on page request
- **WHEN** the browser requests the application root
- **THEN** the HTML response includes link tags for Chakra Petch, Outfit, and JetBrains Mono from Google Fonts

### Requirement: A cn() utility SHALL be available for class name composition

The file `apps/server/web/lib/utils.ts` SHALL export a `cn()` function that merges class names using `clsx` and `tailwind-merge`, following the shadcn/ui convention.

#### Scenario: cn() merges and deduplicates Tailwind classes
- **WHEN** `cn("px-2 py-1", "px-4")` is called
- **THEN** the result is `"py-1 px-4"` (px-4 overrides px-2)

### Requirement: The old custom CSS SHALL be removed

The file `apps/server/web/styles.css` SHALL be deleted. All styling SHALL use the new CSS custom properties and Tailwind utility classes.

#### Scenario: No legacy styles remain
- **WHEN** the project is built
- **THEN** no file named `styles.css` exists under `apps/server/web/`
- **AND** no component imports `styles.css`
