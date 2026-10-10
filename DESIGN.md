# SkillNexus Design System

Locked on: 2026-10-03
Do not change without explicit decision.

## Brand
- Name: SkillNexus
- Domain: skillnexus.com (to be purchased)
- Tagline: TBD (specific, no vague text)

## Colors

### Light Mode (default)
- Background: #FBFBF9
- Surface: #FFFFFF
- Elevated surface: #F4F3EF
- Text primary: #1A1A1A
- Text secondary: #6B6B6B
- Text tertiary: #A3A3A3
- Border subtle: #E8E6E0
- Border strong: #D4D1C8
- Accent: #0F766E (Deep Emerald)
- Accent hover: #115E59
- Success: #15803D
- Warning: #B45309
- Error: #B91C1C
- Info: #1E40AF

### Dark Mode
- Background: #0F0F0E
- Surface: #1A1A18
- Elevated: #242422
- Text primary: #EDEDE9
- Text secondary: #8A8A85
- Border: #2A2A27
- Accent: #14B8A6

## Typography
- Headings + Body: Inter
- Code / Numbers: JetBrains Mono

## Icons
- Lucide React only

## Layout Rules
- Border radius: cards rounded-xl (12px), buttons rounded-lg (8px), inputs rounded-lg, badges rounded-md
- No rounded-full on buttons
- Shadows: shadow-sm on cards, shadow-md on modals only
- Generous spacing between sections

## Motion
Allowed: hover 150-200ms, focus rings, modal fade 200ms, page fade 150ms, skeleton shimmer, toast slide 250ms
Banned: scroll-triggered animations, parallax, bouncy easing, custom cursor, marquee, autoplay carousels

## Background Animation
- Slow-moving abstract nodes (canvas)
- 20-30 nodes, 2-3px radius
- Drift speed: max 10-20px/sec
- Lines drawn between nodes within proximity, opacity 0.1-0.2
- Node color: accent at 20-30% opacity
- Applied: login/signup page, dashboard edges, empty states
- Not applied: forms, tables, lists

## Copy Rules
Banned words: empower, unlock, seamless, revolutionize, next-level, cutting-edge, next-gen, journey, in today's fast-paced world
Every sentence needs a verb and a concrete noun
No em dashes. Use period, comma, or colon.
No emojis in UI. Zero.

## Banned Visual Elements
- Purple/pink gradients
- Pill-shaped buttons everywhere
- Fake reviews, testimonials, metrics
- AI-generated images, stock photos
- Custom cursor animation
- Scroll-triggered animations on every section
- Video backgrounds
- Particle.js library

## Launch Blockers
- Custom domain pointed (skillnexus.com)
- Custom favicon (ico + png + apple-touch-icon)
- Remove platform AI badge (Vercel/Netlify)
- Privacy Policy page (real content)
- Terms & Conditions page (real content)
- Working contact email

## Naming Conventions
- Folders: skillnexus-backend, skillnexus-frontend
- Database: skillnexus
- Console logs: "SkillNexus ..."
- UI text: "SkillNexus"