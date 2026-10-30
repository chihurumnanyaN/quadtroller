# Quadtroller design system

Read this before changing the interface. The single dark theme lives in `src/lib/theme/theme.css`; components consume its CSS variables.

## Direction

- Minimal, playful flight controls with a Google-creative feel.
- Landscape-first flight view, usable with touch.
- No decorative details, gradients, shadows, or blur.
- Keep helper text to six words or fewer.

## Palette

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0E0F12` | Page background |
| `--surface` | `#17191D` | Cards and panels |
| `--surface-2` | `#212429` | Secondary controls |
| `--surface-3` | `#2B2F36` | Dividers and tertiary surfaces |
| `--primary` | `#8AB0FF` | Icons and focus |
| `--on-primary` | `#0A1B45` | Text/icons on primary |
| `--primary-container` | `#2A3F6E` | Selected blue controls |
| `--go` | `#C6F135` | Takeoff, connected, active |
| `--on-go` | `#1A2200` | Text/icons on go |
| `--stop` | `#FF6B5B` | STOP only |
| `--on-stop` | `#3A0904` | Text/icons on STOP |
| `--text` | `#F2F3F5` | Primary text |
| `--text-dim` | `rgba(242,243,245,0.6)` | Secondary text |
| `--scrim` | `rgba(0,0,0,0.4)` | Text over video |

Blue, lime, and coral are the only hues. All other UI colors stay neutral.

## Type and shape

- Roboto Flex, bundled locally.
- Four sizes: display 40/800, title 24/700, body 16/500, label 13/600.
- Radius tokens: 16px, 28px, 40px, and full.
- Use an 8px spacing grid and respect safe-area insets.

## Components and motion

- Iconsax Bulk for expressive actions; Solar Bold Duotone for simple utilities.
- Flight HUD uses Material icons from `react-icons/md` only.
- Icon size 24px by default; 32px for primary actions.
- Controls morph between round and squircle when pressed or selected.
- Framer Motion spring: stiffness 500, damping 26; press scale 0.94.
- Sheets slide in with a slight spring overshoot. Honor reduced motion.
- Native haptics: light for buttons/toggles, medium for takeoff/land, heavy for STOP. Browser haptics are a no-op.

## Screen notes

- Home: A surface-2 drone glyph, Connect/Fly, and three small bento tiles.
- Flight: Fullscreen feed, paired sticks, telemetry, camera controls, modes.
- Settings: Stick layout, sensitivity, handedness, inversion, haptics.
- Gallery: Three-column square captures, swipe-close viewer, share, delete.
