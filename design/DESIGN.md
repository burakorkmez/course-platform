# Design System: "Night sky + periwinkle glow"

The look comes from `design/landing-page-ref.png`: a near-black navy canvas, one soft periwinkle accent, and light that
glows from a single focal point. Every page (landing, course sales, lesson player, dashboard, admin) uses the same system.

## Where it lives

| What | File |
| --- | --- |
| Tokens (colors, radius, shadows) and signature effects | `app/globals.css` |
| Primitives (shadcn, themed by the tokens) | `components/ui/*` |
| Brand pieces | `components/site-header.tsx` (`Logo`, `SiteHeader`), `components/site-footer.tsx` |
| Course tile | `components/course-card.tsx` |
| Testimonials wall, `Stars` | `components/testimonials.tsx` |
| Curriculum list (done / current / locked / free rows) | `components/curriculum.tsx` |
| `ProgressRing`, `ProgressBar` | `components/progress.tsx` |
| Fake catalog, lessons, student progress | `lib/courses.ts` |
| App pages | `app/courses` (catalog), `app/courses/[course]` (course page), `app/courses/[course]/[lesson]` (player) |
| Images | `public/app-preview.jpg`, `public/courses/*`, `public/avatars/*` (see Imagery) |
| Reference implementation | `app/page.tsx` (landing) |

Tokens use shadcn's names, so `npx shadcn@latest add <component>` gives on-brand components with no extra styling.
Always use tokens (`bg-card`, `text-muted-foreground`, `border`), never raw hex in components.

## Principles

1. **Dark only.** `<html class="dark">` is set in the layout. There is no light theme; the glow aesthetic depends on a dark canvas.
2. **One accent.** Periwinkle (`primary`) is the only color. Use it for the primary action, active/completed states, progress, and links. Everything else is navy and white.
3. **Glow is earned.** At most one glowing focal point per view: the hero globe, the primary CTA, or the featured card. If everything glows, nothing does.
4. **Quiet surfaces.** Cards are barely lighter than the page and use hairline borders. Hierarchy comes from type and spacing, not from boxes.
5. **Decoration never blocks clicks.** Every decorative layer (glows, fades, lines) gets `aria-hidden` and `pointer-events-none`. An invisible glow once sat on top of the hero buttons and made them unclickable.

## Color tokens

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#05060f` | Page canvas |
| `foreground` | `#eef0ff` | Headings, body text |
| `card` / `popover` | `#0b0d1a` | Cards, frames, menus |
| `secondary` / `muted` | `#11142a` | Secondary buttons, tracks (progress bar background), inputs |
| `accent` | `#161a33` | Hover background for rows and ghost/outline buttons |
| `muted-foreground` | `#a3a9c9` | Secondary text, metadata, descriptions |
| `primary` | `#a3b1ff` | Primary buttons, links, checkmarks, progress fill, active row |
| `primary-foreground` | `#0a0c1a` | Text on primary |
| `ring` | `#7c8cff` | Focus rings |
| `glow` | `#5b6cff` | Only inside shadows and gradients (`var(--glow)`), never as a fill |
| `border` | `rgb(163 177 255 / .12)` | Hairlines everywhere (the default for `border`) |
| `input` | `rgb(163 177 255 / .16)` | Input borders |
| `destructive` | `#ff6b7f` | Errors, delete actions |
| `sidebar-*` | as above, `sidebar` is `#080a16` | shadcn Sidebar (lesson player, admin) |
| `chart-1..5` | periwinkle scale | Admin charts |

Tints of the accent go through opacity: `bg-primary/10` (selected row), `border-primary/25` (outline button), `border-primary/40` (hover).

## Typography

The typeface is Geist Sans (`font-sans`, `font-heading`); code and durations use Geist Mono (`font-mono`).

| Role | Classes |
| --- | --- |
| Display (hero h1) | `font-heading text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.04em] leading-[1.05]` |
| Section title (h2) | `font-heading text-3xl sm:text-4xl font-semibold tracking-tight` |
| Card title (h3) | `font-heading text-lg font-medium tracking-tight` |
| Eyebrow | `text-sm font-medium text-primary` |
| Lead paragraph | `text-base sm:text-lg text-muted-foreground` |
| Body | `text-sm` (app UI) or `text-base` (marketing) |
| Meta | `text-xs text-muted-foreground` |

For accent words in a heading, wrap one or two words in `<span className="text-gradient">`, never the whole line.

## Layout and spacing

- Container: `mx-auto max-w-6xl px-4 sm:px-6`. Use `max-w-5xl` for media frames and `max-w-2xl` for centered text blocks.
- Section rhythm: `py-24` between marketing sections. Section heading block: `mb-12`, centered.
- Card padding: `p-5` for tiles; shadcn `Card` uses `[--card-spacing:--spacing(6)]` for roomy cards.
- Grids: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`.
- Build mobile-first for student pages. Admin can be desktop-first.

## Radius and borders

`--radius` is `0.75rem`. Use `rounded-lg` for buttons and inputs, `rounded-xl` for cards, `rounded-2xl` for large tiles and media frames, and `rounded-full` for pills and avatars.
Borders are always the 1px hairline `border` token.

## Elevation and glow

| Name | How | Where |
| --- | --- | --- |
| `shadow-glow` | theme shadow: inset top highlight + primary ring + soft `--glow` bloom | Primary buttons (built in) |
| Hover lift | `hover:border-primary/40 hover:shadow-[0_8px_40px_-12px_var(--glow)]` | Clickable tiles (`CourseCard`) |
| Featured | `ring-primary/50 shadow-[0_0_60px_-15px_var(--glow)]` | One highlighted card per group (Lifetime plan) |
| Frame glow | `shadow-[0_-10px_60px_-20px_var(--glow)]` plus a 1px `via-primary` gradient line on the top edge | Product/video frames |

## Components

**Button** (`components/ui/button.tsx`)
- `default`: a lavender gradient with a glow. Use it for the one main action on a view.
- `outline`: dark glass with a periwinkle hairline. Use it for secondary actions next to a primary one.
- `ghost`: nav items and toolbar actions. `secondary`: low-emphasis actions inside cards. `destructive`: delete.
- Sizes: `sm`, `default`, `lg` (app UI), `xl` (marketing CTAs), plus the `icon*` sizes.
- For a link that looks like a button, use `<Link className={buttonVariants({ variant, size })}>`. `buttonVariants` merges classes, so it's safe to add your own.
- Trailing icons get `data-icon="inline-end"` (leading ones get `inline-start`) so the padding adjusts.

**Badge**: `default` for small labels ("New", "Best value", "Free preview"). The hero pill is `variant="outline"` with `border-primary/30 bg-primary/10 h-8 px-3 text-sm` and a `Sparkles` icon.

**Card**: shadcn `Card` / `CardHeader` / `CardContent` / `CardFooter`. The footer renders as a subtle tray; put the card's action there.

**CourseCard**: a 16:9 thumbnail (with a glow + play icon fallback when there's no thumbnail), a title, a 2-line description, and a lessons/duration meta row. Use it for the landing grid and the dashboard.

**Testimonials**: three columns that scroll up endlessly at different speeds and fade out at the top and bottom (one column on mobile, two on `md`, three on `lg`). Each column renders its cards twice, with the copy `aria-hidden`, and `animate-marquee-up` moves it by half its height. It pauses on hover or with the round pause toggle under it (a native checkbox the columns read through `group-has-checked`), and stays still under reduced motion, where the toggle is hidden. A card holds stars, the quote, a 40px avatar with `ring-primary/30`, and a name and role. The layout follows Efferd's "Testimonials Columns" on 21st.dev, with framer-motion replaced by a CSS keyframe. **The quotes and faces are placeholders. Replace them with real student reviews before launch.**

**Feature card (bento)**: `rounded-2xl border bg-card` with the title and description on top and a small mock of the real UI at the bottom (curriculum rows, progress ring, code panel, video frame). Grid: `md:grid-cols-2 lg:grid-cols-3`, with wide cards on `md:col-span-2`. Give a mock `flex-1` when it should fill the leftover height.

**Closing CTA**: a `rounded-3xl border bg-card` card with a `glow-planet` rising from the bottom (`absolute top-[68%] left-1/2 -z-10 w-176 -translate-x-1/2 sm:w-272`), an h2 with one `text-gradient` phrase, and a default + outline button pair.

**Avatar stack**: `flex -space-x-2` of `size-8 rounded-full ring-2 ring-background` images, next to `<Stars />` and a one-line caption.

**SiteHeader / SiteFooter / Logo**: the marketing shell. The logo is a 4-point star in `text-primary` with a glow drop-shadow, next to an uppercase wordmark.

**SectionHeading** (in `app/page.tsx`): eyebrow + h2 + lead. Move it to `components/` the first time a second page needs it.

## Signature effects (in `globals.css`)

- **Hero globe video** (`public/hero-globe.mp4` + `public/hero-globe.jpg` poster): a full-screen, muted, looping `<video>` behind the hero content, `absolute inset-0 -z-10 object-cover`. The hero section uses `-mt-18 min-h-svh` so it slides under the header. Its `<source>` has `media="(prefers-reduced-motion: no-preference)"`, so reduced-motion users get the still poster and never download the video. It lives in `components/hero-video.tsx` with a round outline pause button (`absolute right-4 bottom-20`, hidden under reduced motion). On top go a fixed-size dark radial scrim behind the text (`ellipse 38rem 24rem`, `rgb(5 6 15 / .85)` fading out) and a `from-background` fade over the bottom third so the globe melts into the page. Text on the video is one step brighter than usual (`text-foreground/80` for the lead instead of `text-muted-foreground`). The product preview overlaps the fade with `-mt-16`.
- `glow-planet`: the dark disc with the glowing rim, in CSS. Give it a width and a position; the closing CTA uses it, and it's the cheap way to echo the globe on pages without video (checkout success, empty states).
- `text-gradient`: a lavender to periwinkle gradient for the accent words in a heading.
- Media frame: `rounded-2xl border bg-card/60 p-2`, with the frame glow above and a `bg-linear-to-t from-background` fade over the bottom third.

## Motion

Motion is slow and subtle, and all of it turns off under `prefers-reduced-motion`.

| What | How |
| --- | --- |
| Hero entrance | The `rise` class string in `app/page.tsx` (tw-animate-css fade + slide up, 700ms), staggered with `delay-100` to `delay-700` |
| Scroll reveal | The `reveal` utility on section headings and grids. It's a native scroll-driven animation (`animation-timeline: view()`); browsers without support just show the content |
| Marquee | `animate-marquee-up`, with `--duration` set on the track |
| Hover | Color, border and shadow transitions. The only scaling is on thumbnails (`scale-105`) and the play button (`scale-110`) |

Scroll reveal measures against the viewport, so page-level wrappers use `overflow-x-clip`, never `overflow-hidden`. `overflow-hidden` creates a scroll container, which breaks `reveal` and `position: sticky`.

## Imagery

All images are AI-generated in two styles that match the palette. Generate new ones in the same style:
- **Thumbnails and illustrations**: minimal isometric 3D, frosted glass objects with glowing periwinkle (`#7c8cff`) edges and rim light, on a deep navy-black (`#05060f`) background, centered with generous empty space, no text or logos.
- **People**: photorealistic head-and-shoulders portraits on a seamless dark navy backdrop with a subtle periwinkle rim light.

- **Hero video**: Kling 3.0 (`pro` = 1080p, 10s, sound off) animating `design/globe.png` with a locked camera. It's made loopable by crossfading the last 2s into the first 2s, then encoded without audio:
  `ffmpeg -i raw.mp4 -filter_complex "[0:v]split[x][y];[x]trim=start=2,setpts=PTS-STARTPTS[a];[y]trim=end=2,setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=2:offset=<duration-4>,format=yuv420p[v]" -map "[v]" -an -c:v libx264 -preset slow -crf 28 -movflags +faststart public/hero-globe.mp4`, and the poster is its first frame (`ffmpeg -i public/hero-globe.mp4 -frames:v 1 -q:v 4 public/hero-globe.jpg`).

- **Sign-in scene** (`public/sign-in-scene.mp4` + `.jpg`): the same pipeline, 1:1, starting from a generated still of the brand star rising over a city-lit planet with an orbital ring.

Use `next/image` everywhere. Always pass `sizes` with `fill`, and use `alt=""` when a caption next to the image already names it.

## App patterns (for upcoming pages)

- **Player layout** (`app/courses/[course]/[lesson]`): a sticky `h-16` top bar (logo, breadcrumbs, search, avatar), then `grid grid-cols-1 xl:grid-cols-[19rem_minmax(0,1fr)_20rem]`: the curriculum on the left, the lesson in the middle, progress and up next on the right. Side columns are `xl:sticky xl:top-16 xl:h-[calc(100svh-4rem)] xl:overflow-y-auto`. Below `xl` everything stacks with the lesson first (`order-first xl:order-none`).
- **Auth pages** (`app/sign-in`): a split screen, `grid min-h-svh lg:grid-cols-2`. The form column (logo, h1 with one `text-gradient` word, social buttons, a short benefits list) sits on the left; on the right a looping video panel (`lg:m-3 lg:rounded-3xl lg:border`) carries a testimonial over a `from-background` gradient. Below `lg`, the same panel becomes an `opacity-25` background behind the form.
- **Grids that hold long content always get `grid-cols-1` at the base.** Without it the implicit column grows to its widest child and the page scrolls sideways on phones.

These match `public/app-preview.jpg`, so the real app should look like the landing page promises.

- **Curriculum list**: section headers `text-sm font-medium` with a `4/10` count in `text-muted-foreground`. Rows are `rounded-lg px-3 py-2 hover:bg-accent`.
  - Completed: `Check` in a `bg-primary` circle.
  - Current: row `bg-primary/10 text-foreground` with a `PlayCircle` icon.
  - Locked: `Lock` in `text-muted-foreground`.
  - Durations: `font-mono text-xs text-muted-foreground`, right-aligned.
- **Progress**: track `bg-muted`, fill `bg-primary`, `h-1.5 rounded-full`. Show the percentage in `text-sm font-medium`.
- **Video frame**: `rounded-xl border bg-black overflow-hidden`, 16:9.
- **Lesson actions**: "Mark complete" uses the `default` button and "Next lesson" uses `outline`.
- **Tabs, forms, dialogs, tables, sidebar**: add the shadcn component and don't restyle it; the tokens already fit.
- **Empty states**: a centered `text-muted-foreground` message, a lucide icon at `size-10 text-primary/60`, and one `default` button.
- **Status badges (admin)**: `published` uses `default`, `draft` uses `secondary`, `archived` uses `outline`.

## Icons

Use lucide-react only. Icons are `size-4` inline and `size-3.5` in meta rows, with the default stroke width (1.25 for large decorative icons).
Color them with `text-primary` for positive/active states and `text-muted-foreground` for everything else.

## Don'ts

- No new hues (no green for "done"; completion is periwinkle).
- No pure `#000` or `#fff` fills. Use `background` and `foreground`.
- No glow on more than one element per view, and no glow on body text.
- No heavy borders or drop shadows on cards; use the hairline plus spacing.
- No hardcoded hex in components. If a value is missing, add a token to `globals.css` and to this file.
- No decorative layer without `pointer-events-none`.
- No `overflow-hidden` on page-level wrappers; use `overflow-x-clip`.
- No fake testimonials, ratings or numbers in production. The placeholders must be swapped for real ones before launch.
