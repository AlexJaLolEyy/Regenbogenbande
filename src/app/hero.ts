import { heroui } from "@heroui/react";

/**
 * HeroUI theme mirroring the semantic tokens in globals.css.
 * Base is neutral / accent-agnostic: primary = inverted neutral
 * (charcoal on light, bone on dark). Accent themes are layered on top via
 * `[data-accent]` in globals.css and are never part of the base palette.
 */

const scale = (c: Record<string, string>) => c;

export default heroui({
  themes: {
    light: {
      colors: {
        background: "#EFEBE1",
        foreground: "#23262E",
        divider: "#EAE5D9",
        focus: "#23262E",
        content1: "#FBFAF5",
        content2: "#F6F3EC",
        content3: "#EFEBE1",
        content4: "#E0DACC",
        default: scale({
          50: "#FBFAF5",
          100: "#F6F3EC",
          200: "#EAE5D9",
          300: "#E0DACC",
          400: "#928C7E",
          500: "#6E6A5F",
          600: "#55524A",
          700: "#3C3B37",
          800: "#2B2D33",
          900: "#23262E",
          DEFAULT: "#E0DACC",
          foreground: "#23262E",
        }),
        primary: { DEFAULT: "#23262E", foreground: "#F6F3EC" },
        secondary: { DEFAULT: "#E0DACC", foreground: "#23262E" },
        success: { DEFAULT: "#3F7D5B", foreground: "#FFFFFF" },
        warning: { DEFAULT: "#C08A3E", foreground: "#23262E" },
        danger: { DEFAULT: "#B4433E", foreground: "#FFFFFF" },
      },
    },
    dark: {
      colors: {
        background: "#12151C",
        foreground: "#E7E9EE",
        divider: "#20252F",
        focus: "#E7E9EE",
        content1: "#1C212C",
        content2: "#171B24",
        content3: "#232936",
        content4: "#2A303D",
        default: scale({
          50: "#12151C",
          100: "#171B24",
          200: "#1C212C",
          300: "#2A303D",
          400: "#6B7385",
          500: "#98A1B2",
          600: "#B6BDCB",
          700: "#D0D5DF",
          800: "#E1E4EA",
          900: "#E7E9EE",
          DEFAULT: "#2A303D",
          foreground: "#E7E9EE",
        }),
        primary: { DEFAULT: "#E7E9EE", foreground: "#12151C" },
        secondary: { DEFAULT: "#2A303D", foreground: "#E7E9EE" },
        success: { DEFAULT: "#3F7D5B", foreground: "#FFFFFF" },
        warning: { DEFAULT: "#C08A3E", foreground: "#12151C" },
        danger: { DEFAULT: "#B4433E", foreground: "#FFFFFF" },
      },
    },
  },
});
