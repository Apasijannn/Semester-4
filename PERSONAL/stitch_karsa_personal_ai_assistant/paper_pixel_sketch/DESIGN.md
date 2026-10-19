---
name: Paper Pixel Sketch
colors:
  surface: '#fdf9ee'
  surface-dim: '#dddacf'
  surface-bright: '#fdf9ee'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3e8'
  surface-container: '#f2eee3'
  surface-container-high: '#ece8dd'
  surface-container-highest: '#e6e2d8'
  on-surface: '#1c1c15'
  on-surface-variant: '#46464c'
  inverse-surface: '#313129'
  inverse-on-surface: '#f4f1e6'
  outline: '#77767d'
  outline-variant: '#c7c6cd'
  surface-tint: '#5a5d70'
  primary: '#181c2c'
  on-primary: '#ffffff'
  primary-container: '#2d3142'
  on-primary-container: '#9599ad'
  inverse-primary: '#c2c5db'
  secondary: '#b71849'
  on-secondary: '#ffffff'
  secondary-container: '#fd5179'
  on-secondary-container: '#5a001e'
  tertiary: '#002217'
  on-tertiary: '#ffffff'
  tertiary-container: '#003a29'
  on-tertiary-container: '#00af82'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee1f8'
  primary-fixed-dim: '#c2c5db'
  on-primary-fixed: '#171b2b'
  on-primary-fixed-variant: '#424658'
  secondary-fixed: '#ffd9dd'
  secondary-fixed-dim: '#ffb2bc'
  on-secondary-fixed: '#400013'
  on-secondary-fixed-variant: '#910034'
  tertiary-fixed: '#54fdc4'
  tertiary-fixed-dim: '#27e0a9'
  on-tertiary-fixed: '#002116'
  on-tertiary-fixed-variant: '#00513b'
  background: '#fdf9ee'
  on-background: '#1c1c15'
  surface-variant: '#e6e2d8'
typography:
  headline-xl:
    fontFamily: Bricolage Grotesque
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  grid-margin: 2rem
  grid-gutter: 1.5rem
  bento-padding: 1.5rem
  stack-xs: 0.25rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

The design system is built on a "Retro Hand-Drawn Bento" philosophy. It merges the rigid, functional logic of 90s graphical user interfaces with the warmth and imperfection of a physical sketchbook. The goal is to evoke nostalgia for the early web while feeling tactile, human, and meticulously organized.

The aesthetic utilizes **Hand-Drawn Brutalism**. It employs strict bento-grid layouts to maintain high information density and clarity, but softens the digital "coldness" with wobbly strokes, paper textures, and high-contrast, offset shadows. This creates a UI that feels like it was drafted by hand on a drafting table rather than rendered by a machine.

**Target Audience:** Creative professionals, educators, and indie developers who value personality, craftsmanship, and a break from the sterile "corporate glass" aesthetic.

## Colors

The palette is rooted in a "Modernized Vintage" spectrum. The base of the design system is a warm, textured cream (`#F8F4E9`) resembling aged paper or early computer beige.

- **Primary (Ink):** A deep charcoal-blue used for borders, text, and hand-drawn strokes.
- **Secondary (Retro Red):** A muted but punchy red for primary actions and highlights.
- **Tertiary (Earthy Green):** Used for success states and organic "doodle" elements.
- **Accents:** A classic "Windows 95" blue and a sun-faded yellow for categorization within the bento grid.

All colors should feel slightly desaturated to maintain the retro-analog vibe. Avoid pure blacks (#000) in favor of the Primary Ink color.

## Typography

This design system uses a high-contrast typographic pairing to reinforce the "Sketch vs. System" narrative.

**Headlines:** `Bricolage Grotesque` provides the quirky, hand-drawn character. It should be used at large scales with tight tracking. The variable nature of the font allows it to feel slightly "squashed" or "stretched," mimicking handwriting variations.

**Body & Data:** `JetBrains Mono` and `Space Mono` provide the "Retro Computing" anchor. These monospaced fonts ensure that while the containers are wobbly, the information inside is legible, structured, and technically precise.

**Styling Note:** Headlines should always be in the Primary Ink color. Links should be underlined with a hand-drawn "wavy" line rather than a straight pixel-perfect stroke.

## Layout & Spacing

The layout follows a **Strict Bento-Grid** model. Content is housed in modular rectangles of varying sizes that fit together like a puzzle. 

- **Desktop:** 12-column grid with fixed gutters. Bento boxes should span 3, 4, 6, or 12 columns.
- **Mobile:** Single column stack. Margin and gutter reduce to 1rem to maximize screen real estate.
- **Wobble Factor:** While the grid logic is strict, the visual borders of each "box" must use an SVG mask or a `border-image` that introduces a slight, 2-3px irregular "wobble" to the lines.

Spacing within boxes should be generous to maintain a clean, "organized desk" feel.

## Elevation & Depth

Depth in this design system is achieved through **Brutalist Hard Shadows** rather than blurs or gradients.

1.  **Hard Offset:** Elements do not "float." Instead, they are "pasted" onto the paper. Use a solid 4px or 8px offset shadow (bottom-right) using the Primary Ink color at 100% opacity.
2.  **Tonal Stacking:** For nested elements, use slightly different paper textures or a very subtle tint of the primary color (2% opacity) to distinguish layers.
3.  **Active States:** When a button or card is pressed, the hard shadow disappears, and the element "moves" 4px down and right to simulate a physical press against the paper surface.

## Shapes

Shapes in the design system are primarily rectangular to suit the Bento grid, but with a "Soft-Hand" finish.

- **Corners:** Use a base 0.25rem radius, but the "wobble" border effect should make corners look slightly inconsistent, as if drawn with a felt-tip pen.
- **Icons:** Must be hand-drawn, monoline illustrations using the Primary Ink color. Avoid standard icon libraries; icons should have open paths and slight overshoots at the junctions.
- **Dividers:** Use "marker-stroke" lines—thick, slightly uneven lines that don't quite reach the edges of the container.

## Components

**Buttons:** 
Rectangular with a thick 2pt Primary Ink border. They feature the signature 4px hard shadow. On hover, the shadow grows to 6px; on click, it shrinks to 0.

**Bento Cards:** 
The primary container. Each card should have a subtle paper grain texture background. Use "Label-Caps" typography in the top-left corner to categorize the card content, often accompanied by a small hand-drawn doodle in the opposite corner.

**Input Fields:** 
Styled like a typewriter entry line. A bottom-border only (wobbly) with a monospaced "blinking block" cursor.

**Chips/Tags:** 
Designed to look like "Washi Tape" or small scraps of paper taped to the UI. Use the Secondary (Red) or Tertiary (Green) colors with slightly jagged edges.

**Checkboxes:** 
When checked, show a hand-drawn "X" or a "scribble-fill" rather than a standard digital checkmark.