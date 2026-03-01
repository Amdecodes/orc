ID Formatter Design System
This document outlines the core branding elements, color palettes, and typographic scales used to create the premium, high-tech aesthetic of the ID Formatter platform.

The design fundamentally relies on a "Glassmorphic Tech" aesthetic—using vibrant accent colors against stark light/dark backgrounds, accented by intense blur effects, animated glows, and structured, boxy components.

1. Color Palette
The project utilizes Tailwind CSS custom properties to allow a seamless transition between Light Mode and Dark Mode. You can find these variables configured in 
apps/web/src/app/globals.css
.

Backgrounds
The backgrounds are designed to create layering and depth, often using transparent overlays (backdrop-blur).

bg-page: The base background of the entire document. (Light: Soft grayish-white #F8FAFC | Dark: Deep charcoal/almost black #0B0D12)
bg-surface: Used for cards, containers, and elevated elements. (Light: Pure White #FFFFFF | Dark: Slate #1E2330)
bg-muted: Used for input backgrounds, hover states, or subtle delineations.
Text
Text colors ensure high contrast accessibility in both themes.

text-primary: Headings and primary body text. (Light: Very dark slate #0F172A | Dark: Very light slate #F8FAFC)
text-secondary: Subheadings and secondary descriptive text.
text-muted: Placeholder text, small uppercase tracking text, or disabled states.
Accents
The brand identity is heavily tied to the "Accent" color, which provides the glowing, high-tech energy.

accent-primary / brand-violet: Used interchangeably. Currently set to a warm, energetic amber/orange (#F59E0B), providing a "laser-processing" or "electric" aesthetic.
accent-text: The color of text inside an accent-colored button (always white #FFFFFF for contrast).
Status Colors
Used for the small "traffic light" dots on cards and alerts.

success: Green (#0D9488 / #22C55E)
warning: Orange (#D97706 / #FBBF24)
error: Red (#DC2626 / #F87171)
2. Typography
We pair two Google Fonts to balance technical precision with modern readability:

Space Grotesk

Usage: All Headings (h1 - h6), Logo/Branding text, large numbers.
Characteristics: Geometric, futuristic, slightly wide. It gives the platform its "high-tech" identity.
Example: font-['Space_Grotesk'] font-black tracking-tighter
Inter

Usage: Body text, paragraphs, buttons, input fields, labels.
Characteristics: Highly legible, neutral, standard tech UI font.
Example: font-medium leading-relaxed
Typographic Patterns
Super Headers: Used on the Hero page. Extremely large (text-6xl md:text-8xl), heavy weight (font-black), and tightly tracked (tracking-tighter).
Eyebrow Text: Used for small labels and tags. Tiny size (text-[10px]), heavy weight (font-black), completely uppercase (uppercase), and widely spaced (tracking-[0.3em]).
3. UI Patterns & Effects
To achieve the "Premium AI Tool" aesthetic, the site relies on these specific visual patterns, which are achieved through standard Tailwind utility classes:

Glassmorphism (Frosted Glass)
Used heavily on cards to make them feel like floating UI elements over the glowing background.

Classes: bg-bg-surface/40 backdrop-blur-3xl border border-border/30
Animated Glows
Used behind cards or inside input steps to simulate a "processing engine" energy.

Classes: bg-accent/20 blur-[120px] rounded-full animate-pulse, or using box shadows like shadow-[0_0_15px_rgba(var(--accent),1)].
Neumorphic & Deep Shadows
Cards use deep shadows so they stand out distinctly, especially in light mode.

Classes: shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]
Micro-Interactions
Card hovering is a crucial part of the dynamic feel. Components should react physically when hovered.

Classes: group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-500
4. Logo / Wordmark
The platform is currently identified by the text wordmark National ID Formatter, typically accompanied by a square icon containing a stylized bounding-box SVG. It relies entirely on the Space Grotesk font for brand recognition.