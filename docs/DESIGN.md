> **Note:** written for an earlier version of the project (before the 2026 audit); details may be outdated. See PROJECT.md for the current overview.

# Design Guidelines: Regenbogenbande V2 (Project Lava)

## 1. Core Aesthetic

**"Modern, Alive, Premium"**
The new design moves away from standard layouts to a more immersive, "app-like" experience.

- **Theme**: Dark Mode primarily (for video/media consumption).
- **Background**: "Lava Lamp" Effect.
  - Animated, blurred gradient blobs moving slowly in the background.
  - Colors: Deep Purples, Pinks, Blues (Regenbogen/Rainbow inspired but sophisticated, not childish).
- **Surface / Material**: Glassmorphism.
  - Content sits on translucent "glass" panels.
  - High backdrop blur (`backdrop-filter: blur(20px)`).
  - Subtle white/black semi-transparent backgrounds (`bg-black/30`, `border-white/10`).

## 2. Layout & Typography

### Grid System

- **Video List**:
  - **Desktop**: 4 columns (maximize content density).
  - **Mobile**: 1-2 columns.
- **Container**:
  - Main content centered with glass panels.
  - Sidebars: Potentially reduced or removed to give more "breathing room" to the content.

### Typography

- **Font**: Inter or Geist Sans (Modern, legible).
- **Headings**: Bold, perhaps with subtle gradients matching the background.
- **Body**: Readable gray (`text-default-500` to `300`).

## 3. Component Guidelines

### Cards (Videos)

- **Style**: Glass panel.
- **Shape**: `rounded-2xl` or `3xl`.
- **Behavior**: Hover effects (scale up, glow, or border brighten).
- **Content**:
  - **Thumbnail**: Aspect ratio preserved (16:9 for videos). Rounded corners.
  - **Title**: 1-line truncation with ellipsis.
  - **Metadata**:
    - Rating (Star Icon).
    - Views (Eye Icon).
    - Date (Relative time, e.g., "2 days ago").

### Detail View (Video Player)

- **Player**: Central focus.
  - Max Width: 1920x1080 equivalent resizing (max-width constraints).
  - Shadow: Heavy glow/shadow behind the player to make it "pop" off the glass.
- **Metadata Panel**:
  - Located _below_ the video.
  - **Group 1**: Title, Views, Rating.
  - **Group 2**: "Uploaded by" (Avatar + Name), Date.
  - **Group 3**: Participants (Avatar Stack).

### Inputs & Forms (Upload/Edit)

- **File Input**:
  - **Hide** the native ugly browser input.
  - **Show**: A large, clickable "Drop Zone" area with an icon and "Click to Select File" text.
  - _UX Rule_: During Edit, **File Selection is disabled/removed**. To change a file, the user must upload a new entry (simplifies logic and data integrity).

### Modals & Overlays

- Use HeroUI Modals for all generic interactions (Confirmations, Forms).
- Backdrop: `backdrop-blur-md` to maintain the glassy feel.

## 4. Implementation Phasing

### Phase 1: Global Style System

- Implement `LavaBackground` component.
- Define global CSS variables for "Glass" utility classes.

### Phase 2: Video List Redesign

- Refactor `VideoList` to use the new Grid and Glass Cards.
- Remove side borders if they clutter the view; use negative space instead.

### Phase 3: Detail Views

- Redesign `VideoView`.
- Consolidate metadata into the new "Info Panel" below the content.

### Phase 4: Forms (Upload/Edit)

- Style the Upload forms with the new "Drop Zone" component.
- Refactor Edit pages to remove file input.

## 5. Technical Notes

- **CSS**: Tailwind CSS is the primary driver.
- **Animation**: `framer-motion` (recommended) or localized CSS keyframes for the background blobs.
