---
name: Professional Freelance Network
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#00687a'
  on-secondary: '#ffffff'
  secondary-container: '#57dffe'
  on-secondary-container: '#006172'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style
This design system is built for a high-trust, professional freelance marketplace. It blends **Corporate Modern** stability with a **Minimalist SaaS** aesthetic. The goal is to evoke a sense of efficiency, reliability, and modern technological capability. 

The visual narrative focuses on clarity and "breathing room," using generous whitespace to reduce cognitive load during complex tasks like contract management or talent searching. Subtle **Glassmorphism** is applied to elevated card elements to provide a sense of depth and sophistication without distracting from the content.

## Colors
The palette is anchored by **Dark Navy Blue (#0F172A)**, providing a serious, authoritative foundation for navigation and headers. **Cyan Blue (#06B6D4)** serves as the secondary brand color, used for interactive elements, links, and secondary actions to maintain a tech-forward feel.

The **Orange (#F59E0B)** accent is reserved strictly for high-priority Calls to Action (CTAs), such as "Post a Job" or "Submit Proposal," ensuring they stand out against the cooler primary tones. Backgrounds utilize a very light gray (**#F8FAFC**) to differentiate sections from the pure white surfaces of primary cards and content containers.

## Typography
The system uses a pairing of **Manrope** for headlines and **Inter** for body text. Manrope provides a slightly more geometric and modern character for titles, while Inter offers world-class legibility for the dense information typical of marketplace listings and forms.

Type scales are generous to ensure a premium feel. Body text should prioritize the `body-md` size for standard descriptions, while `body-sm` is reserved for metadata, table content, and secondary labels.

## Layout & Spacing
This system utilizes a **12-column fixed grid** for desktop, centering content within a 1280px container. For the dashboard and freelancer search interfaces, a **sidebar-ready layout** is used where a 280px fixed left sidebar houses navigation or filters, while the main content area remains fluid.

Spacing follows an 8px (0.5rem) linear scale. Margins and gutters are kept relatively wide to support the minimal aesthetic and prevent the interface from feeling "cramped" or "cluttered," which is a common pitfall in high-density marketplaces.

## Elevation & Depth
Depth is achieved through **ambient shadows** and **glassmorphism**. 
- **Surface Level 0:** The main page background (#F8FAFC).
- **Surface Level 1:** Primary cards and containers (#FFFFFF) with a very soft, diffused shadow (0px 4px 20px rgba(15, 23, 42, 0.05)).
- **Surface Level 2:** Floating elements, modals, and tooltips with a more pronounced shadow and a subtle backdrop blur (8px) to create the glassmorphic effect.

Borders are kept minimal, using a 1px stroke in a light neutral tone (#E2E8F0) to define sections when shadows are not appropriate.

## Shapes
The system uses a **Rounded** shape language to feel approachable and modern. 
- **Standard components** (Buttons, Inputs, Cards): 12px (0.75rem) to 16px (1rem).
- **Large containers**: 20px (1.25rem).
- **Interactive chips**: Fully rounded (pill-shaped) to distinguish them from buttons.

This consistent use of large radii softens the "corporate" feel of the Dark Navy palette, making the platform feel more like a modern community.

## Components

### Buttons
- **Primary:** Features a subtle linear gradient from Cyan Blue to a slightly darker shade. 16px corner radius. High-contrast white text.
- **Secondary:** Dark Navy Blue outline with a 1px stroke. Transparent background.
- **CTA:** Solid Orange (#F59E0B) to maximize visibility.

### Cards
Cards are the primary content vessel. They feature a white background, 16px corner radius, and the Level 1 ambient shadow. For "Featured" jobs or profiles, use a subtle Cyan Blue border (2px) and a light Cyan tint on the background.

### Forms & Inputs
Inputs use a light gray background with a 1px border that shifts to Cyan Blue on focus. Labels are positioned above the field using `label-md`. Error states use a soft red highlight with clear iconography.

### Tables
Marketplace data (earnings, active jobs) should be presented in clean tables with no vertical borders. Use alternating row highlights or simple horizontal dividers (#F1F5F9). Headers should use the `label-md` style for maximum clarity.

### Sidebar
The navigation sidebar uses the Primary Dark Navy (#0F172A) for high contrast or a clean white version for inner-app dashboards. Icons should be line-art style (24px) with ample padding.