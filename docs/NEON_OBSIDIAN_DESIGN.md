# Neon Obsidian Design System

## Overview

The "Neon Obsidian" design system is a modern, dark-themed UI style characterized by deep gradients, glassmorphism, and neon accents. It is built using Tailwind CSS v4.

## Conceptual Description

Imagine a futuristic, polished interface carved out of dark obsidian glass. The background isn't just black; it's a deep, atmospheric void (like outer space or a night sky) that gives depth. Elements on top are made of distinct, semi-transparent dark glass. They are subtle until interacted with—when touched or hovered, they come alive with a vibrant neon purple glow, mimicking bioluminescence or cybernetic energy. The goal is to feel "premium," "mysterious," and "alive."

## Core Principles

### 1. Colors & Gradients

- **Primary Background**: Use deep, rich gradients instead of flat black.
  - Utility: `.bg-neon-gradient`
  - CSS: `linear-gradient(135deg, #0F0C29 0%, #302b63 50%, #24243e 100%)`
- **Surface (Glass)**: Dark, highly transparent surfaces with blur.
  - Base Color: `#1A1A1A` at 80% opacity.
  - Border: White at 10% opacity (`border-white/10`).
- **Accents**: High-contrast neon colors, primarily Purple (`#a855f7`) and Blue.

### 2. Glassmorphism (Obsidian Variant)

We use a specific "Obsidian" glass style that is darker and more opaque than traditional glassmorphism to ensure readability on complex backgrounds.

**Utility Class**: `.glass-card-obsidian`

**Properties**:

- Background: `bg-[#1A1A1A]/80`
- Blur: `backdrop-blur-xl`
- Border: `border border-white/10`
- Hover State:
  - Border: `hover:border-purple-500/50`
  - Shadow: `hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)]` (Neon Glow)

### 3. Typography

- **Headings**: Bold, often with a subtle text glow or gradient.
- **Body**: Clear, sans-serif (Inter/Geist).
- **Text Glow**: Used for emphasis on key elements.
  - Utility: `.text-glow`
  - Shadow: `0 0 10px rgba(168, 85, 247, 0.5)`

## Component Guidelines

### Navigation

- **Style**: Floating glass bar.
- **Links**: "Glass Tiles" - individual rounded rectangles that glow on active/hover.
- **Mobile**: Responsive hamburger menu with a full-screen blurred overlay.
- **Location**: `src/lib/components/navigation/navigation.tsx`

### Cards (Videos, Pictures, Quotes)

- Use `.glass-card-obsidian` as the base.
- **Hover Effects**: Lift up (`y: -5`) and emit a neon glow.
- **Borders**: Subtle white border by default, turns Purple on hover.
- **Shared Component**: `src/lib/components/ui/glass-card.tsx`

### Layout & Shell

- All pages should be wrapped in the `PageShell` component for consistent backgrounds and spacing.
- **Variants**:
  - `default` / `aurora`: Animated Aurora background (Home).
  - `neon`: Static Neon Gradient background (Lists).
- **Sidebar**: The `AppSidebar` is hidden on mobile and replaced by `MobileSidebar` (drawer).

## Implementation Reference

**Tailwind v4 Configuration (`src/app/globals.css`)**:

```css
@utility glass-card-obsidian {
  @apply bg-[#1A1A1A]/80 backdrop-blur-xl border border-white/10 
         hover:border-purple-500/50 
         hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)] 
         transition-all duration-300;
}
```

## Checklist for New Pages

1. [ ] Wrap content in `<PageShell variant="neon">`.
2. [ ] Include `<AppSidebar>` (hidden on mobile) and `<MobileSidebar>` (visible on mobile).
3. [ ] Use `.glass-card-obsidian` for list items.
4. [ ] Ensure text contrast is sufficient against the deep purple background.
