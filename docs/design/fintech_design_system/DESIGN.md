---
name: Fintech Design System
colors:
  surface: '#f7faf9'
  surface-dim: '#d7dbda'
  surface-bright: '#f7faf9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f3'
  surface-container: '#ebeeed'
  surface-container-high: '#e6e9e8'
  surface-container-highest: '#e0e3e2'
  on-surface: '#181c1c'
  on-surface-variant: '#3c4946'
  inverse-surface: '#2d3131'
  inverse-on-surface: '#eef1f0'
  outline: '#6c7a76'
  outline-variant: '#bbcac5'
  surface-tint: '#006b5f'
  primary: '#006b5f'
  on-primary: '#ffffff'
  primary-container: '#00a896'
  on-primary-container: '#00352e'
  inverse-primary: '#59dbc7'
  secondary: '#5a5f5e'
  on-secondary: '#ffffff'
  secondary-container: '#dce1df'
  on-secondary-container: '#5f6462'
  tertiary: '#516161'
  on-tertiary: '#ffffff'
  tertiary-container: '#889998'
  on-tertiary-container: '#213131'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#79f7e3'
  primary-fixed-dim: '#59dbc7'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005047'
  secondary-fixed: '#dfe3e1'
  secondary-fixed-dim: '#c3c7c6'
  on-secondary-fixed: '#181d1c'
  on-secondary-fixed-variant: '#434847'
  tertiary-fixed: '#d4e6e5'
  tertiary-fixed-dim: '#b8cac9'
  on-tertiary-fixed: '#0e1e1e'
  on-tertiary-fixed-variant: '#3a4a49'
  background: '#f7faf9'
  on-background: '#181c1c'
  surface-variant: '#e0e3e2'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding-mobile: 20px
  container-padding-desktop: 40px
  gutter-bento: 24px
  card-padding: 32px
---

## Brand & Style

The design system is engineered to bridge the gap between traditional banking reliability and the agility of modern neobanks. It centers on an **Energetic Professionalism** aesthetic—where precision meets vibrancy.

The visual direction combines **Minimalism** with **Glassmorphism**. High-density information is organized through a Bento-grid layout, utilizing generous whitespace to reduce cognitive load and convey a sense of premium "breathing room." The use of glass-like surfaces for secondary information creates a sophisticated layered depth, signaling a forward-thinking, tech-first approach to finance.

## Colors

The palette is anchored by a deep, energetic teal, used strategically for primary actions and brand emphasis. 

- **Backgrounds:** Use the off-white/light-grey (#F4F7F6) for the main canvas. Pure white (#FFFFFF) is reserved strictly for primary Bento card surfaces.
- **Typography:** The rich charcoal (#1A1F1E) ensures high legibility and a grounded, authoritative feel.
- **Glassmorphism:** Secondary elements utilize semi-transparent white overlays with a 20px background blur to create depth without introducing new colors.
- **Accents:** Use the tertiary teal tint for soft backgrounds behind iconography or subtle data visualizations.

## Typography

The typography system uses **Plus Jakarta Sans** to balance a friendly geometric feel with professional precision. 

To achieve a premium editorial look, all large headlines (32px+) must use negative tracking (-1% to -2%). Small labels and caps-headers should use generous tracking (+5%) to maintain clarity and a sense of luxury. Line heights are kept airy to ensure the interface feels uncluttered, particularly when presenting dense financial data.

## Layout & Spacing

The layout utilizes a **Bento-grid model**. This system organizes content into distinct, modular containers that vary in size but maintain a strict rhythmic alignment.

- **Grid:** A 12-column fluid grid for desktop; a 4-column grid for mobile.
- **Rhythm:** All spacing must be a multiple of 4px.
- **Margins:** High use of whitespace is mandatory. Bento cards should be separated by a 24px gutter to maintain visual independence.
- **Responsive Behavior:** On mobile, Bento cards stack vertically, maintaining the 24px radius and 20px side margins.

## Elevation & Depth

This design system avoids harsh borders in favor of **Subtle Depth**. 

- **Primary Elevation:** Cards and main containers use a soft, multi-layered shadow (0px 10px 30px rgba(26, 31, 30, 0.04)) instead of strokes.
- **Secondary Elevation:** Glassmorphism layers (backdrop-filter: blur(20px)) are used for floating elements, such as navigation bars, modal overlays, or "quick-action" chips.
- **Interaction:** On hover, cards should subtly lift using a slightly more pronounced shadow and a 1% scale-up effect to provide tactile feedback.

## Shapes

The shape language is dominated by **Soft Geometricity**. 

The defining characteristic of the design system is the **24px corner radius** applied to all primary Bento cards. This large radius creates a friendly, modern silhouette that contrasts with the precise, high-end typography. 

- **Buttons:** Use a 12px radius to maintain a distinction from larger containers.
- **Inputs:** Match the button radius (12px) for consistency in the functional layer.
- **Icons:** Should follow a 24px bounding box with a 2px stroke weight and rounded terminals.

## Components

### Buttons
- **Primary:** Solid Teal (#00A896) with white text. No border, soft shadow.
- **Secondary:** Glassmorphic surface with charcoal text.
- **Tertiary:** Text-only with a slight tracking increase for a premium feel.

### Cards (Bento Style)
- Background: #FFFFFF.
- Corner Radius: 24px.
- Padding: 32px.
- Shadow: Soft ambient charcoal tint.

### Inputs & Fields
- Background: Neutral (#F4F7F6) or semi-transparent glass for search bars.
- Focused State: 2px Teal shadow-glow, no solid border change.

### Data Visualization
- Graphs and charts should use the Primary Teal and a palette of analogous greens and blues. 
- Avoid high-contrast clashing colors to maintain the "Professional" attribute.

### Navigation
- Mobile: A bottom navigation bar with a glassmorphism backdrop and high-quality line iconography.
- Desktop: A sidebar with significant top/bottom margins and clear active-state indicators using the Primary Teal.