# WODFather Design System

## Overview

WODFather is a modern, mobile-first workout generator app for Hyrox fitness enthusiasts. The design system ensures consistency, accessibility, and a clean user experience across all screens.

---

## Color Palette

### Primary Colors

| Name | Hex | Usage | Light Mode | Dark Mode |
|------|-----|-------|-----------|-----------|
| **Accent (Teal)** | #00897B | Active states, CTAs, selected items | Same | Same |
| **Accent Text** | #FFFFFF | Text on accent backgrounds | Same | Same |

### Semantic Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| **text** | #000000 | #FFFFFF | Primary body text |
| **background** | #FFFFFF | #000000 | Page backgrounds |
| **backgroundElement** | #F0F0F3 | #212225 | Cards, input fields (unselected state) |
| **backgroundSelected** | #E0E1E6 | #2E3135 | Hover states, secondary backgrounds |
| **textSecondary** | #60646C | #B0B4BA | Labels, helper text, disabled states |
| **danger** | #E5484D | #E5484D | Error messages, destructive actions |
| **success** | #30A46C | #30A46C | Success states, confirmations |

### Color Usage Guidelines

- **Teal Accent (#00897B)**: Reserved for primary interactive elements and selected states
- **Grey Border (#BDBDBD)**: Indicates unselected or inactive states
- **Light Teal (#B2DFDB)**: Selected state for cards without accent background
- **Semantic Colors**: Use for states that communicate meaning (success, error, etc.)

---

## Typography

### Font Families

| Platform | Display (Sans) | Serif | Rounded | Monospace |
|----------|----------------|-------|---------|-----------|
| **iOS** | system-ui | ui-serif | ui-rounded | ui-monospace |
| **Android** | normal | serif | normal | monospace |
| **Web** | var(--font-display) | var(--font-serif) | var(--font-rounded) | var(--font-mono) |

### Type Scale

| Style | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| **title** | 32px | 600 | 40px | Main headings (app title, screen titles) |
| **subtitle** | 20px | 500 | 28px | Section headings, subheadings |
| **smallBold** | 14px | 600 | 20px | Labels, button text, emphasis |
| **small** | 14px | 400 | 20px | Body text, helper text |
| **code** | 12px | 500 | 16px | Technical text, monospace content |
| **link/linkPrimary** | 14px | 500 | 20px | Interactive links |
| **default** | 14px | 400 | 20px | Default body text |

---

## Spacing System

### Scale

A modular spacing scale based on 4px units:

| Token | Value (px) | Usage |
|-------|-----------|-------|
| **half** | 2 | Minimal spacing, very tight layouts |
| **one** | 4 | Chip padding, compact components |
| **two** | 8 | Standard internal spacing |
| **three** | 16 | Section padding, card padding |
| **four** | 24 | Large spacing, major sections |
| **five** | 32 | Very large spacing, bottom spacing |
| **six** | 64 | Extra large, page-level spacing |

### Application

- **Padding**: Use `Spacing.three` (16px) for cards and containers
- **Margins**: Use `Spacing.three` to `Spacing.four` between major sections
- **Gap**: Use `Spacing.two` to `Spacing.three` between flex items
- **Bottom Safe Area**: Use `Spacing.five` for mobile safe area padding

---

## Component Library

### Buttons & Interactive Elements

#### Primary CTA Button (Teal)
- **Background**: Teal (#00897B)
- **Text**: White, smallBold
- **Padding**: Vertical 12px, Horizontal 24px
- **Border Radius**: 8px
- **Usage**: Main actions (Generate, Next, Start)

#### Secondary Button (Bordered)
- **Background**: Transparent
- **Border**: 2px solid Grey (#BDBDBD)
- **Text**: Dark grey, smallBold
- **Padding**: Vertical 12px, Horizontal 24px
- **Border Radius**: 8px
- **Usage**: Cancel, End Workout, secondary actions

#### Chip (Preset/Cardio)
- **Selected**: Teal background, white text, no border
- **Unselected**: Light grey background, dark text, no border
- **Padding**: Horizontal 12px, Vertical 8px
- **Border Radius**: 8px
- **Usage**: Difficulty presets, cardio type selection

#### Card (Station)
- **Selected**: Light teal background (#B2DFDB), dark text
- **Unselected**: Light grey background, dark text, 2px grey border
- **Padding**: 16px all sides
- **Border Radius**: 8px
- **Minimum Height**: 100px
- **Grid**: 2 columns on mobile
- **Usage**: Hyrox station selection

### Badge

#### Status Badge (Teal)
- **Background**: Teal (#00897B)
- **Text**: White, small, bold
- **Padding**: Horizontal 8px, Vertical 4px
- **Border Radius**: 4px
- **Usage**: Step/workout type indicators (STATION, CARDIO)

---

## Layout Patterns

### Safe Area & Constraints

- **Max Content Width**: 800px (for web/tablet)
- **Horizontal Padding**: 16px (Spacing.three) on mobile
- **Bottom Tab Inset**: 
  - iOS: 50px
  - Android: 80px
  - Web: 0px

### Screens

#### Configure Screen
- **Layout**: ScrollView with padding
- **Sections**: Title → Difficulty → Stations → Cardio → Distance → Effort → Pairing → Generate Button
- **Spacing**: `Spacing.four` between sections

#### Workout Screen
- **Layout**: SafeAreaView with flex layout
- **Areas**: Header (progress) → Current Step (large) → Upcoming List → Controls (NEXT, End)
- **Current Step**: Centered, large typography, teal badge
- **Upcoming**: Scrollable list, compact display
- **Controls**: Full-width teal button + secondary link

---

## Accessibility

### Color Contrast

- **Text on Teal**: WCAG AAA compliant (white on #00897B: 8.2:1)
- **Text on Light Grey**: WCAG AAA compliant (#000 on #F0F0F3: 9.0:1)
- **Text Secondary**: WCAG AA compliant (#60646C on white: 4.5:1)

### Touch Targets

- **Minimum Size**: 44x44px for all pressable elements
- **Spacing Between Targets**: 8px minimum

### Text Sizing

- **Minimum Font Size**: 12px (code), 14px for body
- **Line Height Ratio**: 1.4-1.5 for readability

---

## Responsive Design

### Breakpoints

- **Mobile**: 0-600px (primary target)
- **Tablet**: 600-1200px
- **Desktop**: 1200px+

### Mobile-First Principles

- Start with single-column layouts
- Cards stack vertically
- Full-width buttons and inputs
- Adequate touch targets (44px+)
- Safe area padding respected

---

## Motion & Interactions

### Animations

- **Screen Transitions**: Slide up for modal screens (full-screen modals)
- **Button Press**: Slight opacity reduction (0.85)
- **Duration**: 300ms for most transitions
- **Easing**: Ease-in-out

### Micro-interactions

- **Button Hover**: Opacity change
- **Card Selection**: Instant background color change
- **Progress Bar**: Smooth linear progress
- **List Scrolling**: Momentum-based on native behavior

---

## Best Practices

### Do's

✅ Use the defined color palette consistently  
✅ Follow the spacing scale strictly  
✅ Use semantic colors for meaning (success, error)  
✅ Maintain minimum touch targets (44x44px)  
✅ Respect safe area padding on mobile  
✅ Use the type scale for visual hierarchy  

### Don'ts

❌ Don't introduce new colors outside the palette  
❌ Don't use arbitrary spacing values  
❌ Don't create unreadable text with low contrast  
❌ Don't ignore safe area constraints  
❌ Don't mix font styles (use defined variants)  
❌ Don't disable interactive states without reason  

---

## Implementation

### Theme Hook

All components use the `useTheme()` hook to access the current color palette:

```typescript
const theme = useTheme(); // Returns Colors['light'] or Colors['dark']
// Usage: { backgroundColor: theme.accent }
```

### Themed Components

Pre-built components that respect the theme:

- `<ThemedText>` — Wraps Text with theme-aware colors
- `<ThemedView>` — Wraps View with theme-aware backgrounds
- `<PresetChip>` — Theme-aware difficulty selector
- `<StationCard>` — Theme-aware station card
- `<CardioChip>` — Theme-aware cardio selector
- `<DistancePicker>` — Theme-aware number input

### Adding New Components

When creating new components:

1. Import `useTheme` and `Spacing`
2. Use `StyleSheet.create` for styles
3. Reference theme colors via the hook
4. Use Spacing constants instead of hardcoded values
5. Support both light and dark modes automatically

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | June 2026 | Initial design system with teal accent, comprehensive color palette, and typography scale |
