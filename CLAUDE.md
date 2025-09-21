# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build static site for deployment (outputs to `./out/`)
- `npm run lint` - Run ESLint with 2-space indentation rule
- `npm start` - Start production server

## Project Architecture

This is a Next.js personal website with a comprehensive MDX blog system, configured for static export deployment. The site uses Catppuccin Mocha dark theme throughout.

### Core Structure
```
src/app/
├── layout.tsx                    # Root layout with Navigation + Footer
├── page.tsx                     # Homepage
├── globals.css                  # Global Catppuccin theme + base styles
├── components/
│   ├── Navigation.tsx           # Responsive navigation with hover effects
│   ├── navigation.module.css    # Navigation-specific styles
│   └── Footer.tsx               # Site footer with social links
└── blog/                        # Complete MDX blog system
    ├── layout.tsx               # Blog-specific layout
    ├── blog.module.css          # Scoped blog styles
    ├── page.tsx                 # Blog listing with preview images
    ├── posts/                   # MDX blog posts with frontmatter
    ├── components/
    │   └── TableOfContents.tsx  # Dynamic TOC with scroll highlighting
    ├── lib/
    │   ├── mdx-utils.ts         # Extract headings for TOC
    │   ├── mdx-remark-directive-blocks.ts    # :::warning :::danger :::hint
    │   └── mdx-remark-image-captions.ts     # Auto image captions
    └── [slug]/
        └── page.tsx             # Dynamic blog post rendering
```

### MDX Processing Pipeline

The blog system uses a sophisticated MDX processing pipeline:

```
Markdown → remark plugins → MDX → rehype plugins → HTML
                ↓                        ↓
        - remarkDirective          - rehypeSlug  
        - remarkDirectiveBlocks    - rehypeHighlight
        - remarkImageCaptions
```

**Key remark plugins:**
- `remarkDirective` + `remarkDirectiveBlocks`: Enables `:::warning`, `:::danger`, `:::hint` syntax
- `remarkImageCaptions`: Automatically converts text following images to `<figcaption>` elements

**Key rehype plugins:**
- `rehypeSlug`: Generates heading IDs for TOC navigation
- `rehypeHighlight`: Syntax highlighting with GitHub Dark theme

### Styling Architecture

- **Global theme**: Catppuccin Mocha colors defined in `src/app/globals.css`
- **CSS Modules**: Component-specific styles (Navigation, Blog content)
- **Tailwind CSS**: Utility classes with Tailwind CSS v4
- **Typography**: Open Sans for text, Geist Mono for code blocks

### TypeScript Configuration

- Path aliases: `@/*` maps to `./src/*`
- Strict TypeScript with Next.js plugin
- Custom interfaces: `TocItem`, `PostMetadata` in blog utilities

### Static Export Configuration

The site is configured for static deployment via `next.config.ts`:
- `output: 'export'` - Generates static files
- `images: { unoptimized: true }` - No image optimization for static hosting
- `pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx']` - MDX support

### Blog Features

**Table of Contents:**
- Dynamic extraction from MDX content headings
- Responsive design: mobile TOC at top, desktop sidebar
- Active section highlighting with IntersectionObserver
- Smooth scrolling with navbar offset compensation

**Content Features:**
- Frontmatter support: title, date, description, tags, preview images
- Automatic image centering and caption generation
- Warning/danger/hint directive blocks with Catppuccin styling
- Syntax highlighting for code blocks

### Asset Organization
```
public/
└── assets/
    └── [post-date-slug]/
        └── img/
            └── [images].jpg
```

## Code Conventions

- 2-space indentation (enforced by ESLint)
- TypeScript strict mode enabled
- CSS Modules for component-specific styles
- Functional React components with hooks
- Next.js App Router conventions
- MDX files in `src/app/blog/posts/` directory