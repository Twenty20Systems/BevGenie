# BevGenie Design System - Quick Reference

## Color Palette

```
Primary:     Navy      #0A1930  (headers, primary text)
Accent:      Cyan      #00C8FF  (buttons, highlights)
Secondary:   Copper    #AA6C39  (special states)

Backgrounds: White     #FFFFFF  (main bg)
             Lt Gray   #F8F9FA  (secondary bg)
             Med Gray  #EBEFF2  (borders)

Text:        Navy      #0A1930  (primary)
             Dk Gray   #333333  (primary)
             Text Gray #666666  (secondary)
```

## How to Use Colors

### In Components

```typescript
import { COLORS } from '@/lib/constants/colors';

// Use in React
<div style={{ backgroundColor: COLORS.navy }}>
  <h1 style={{ color: COLORS.white }}>Title</h1>
  <button style={{ backgroundColor: COLORS.cyan }}>Click me</button>
</div>

// Or in className-based approach
<div className="bg-white" style={{ borderColor: COLORS.mediumGray }}>
  ...
</div>
```

## Component Colors

### ChatBubble
- Minimized: Navy bubble, cyan border
- Header: Navy background, white text
- User messages: Navy background, white text
- Assistant messages: Light gray background, dark gray text
- Send button: Cyan

### LoadingScreen
- Overlay: Dark navy (95% opacity)
- Card: White background
- Progress: Cyan bar
- Icon: Animated emoji

### Page Sections
- Headers: Navy text
- Buttons: Cyan background
- Cards: White background with gray border
- Accents: Cyan highlights

## Common Patterns

### Button
```typescript
<button style={{ backgroundColor: COLORS.cyan, color: COLORS.white }}>
  Action
</button>
```

### Header
```typescript
<h1 style={{ color: COLORS.navy }}>Title</h1>
```

### Card
```typescript
<div style={{
  backgroundColor: COLORS.white,
  border: `1px solid ${COLORS.mediumGray}`
}}>
  Content
</div>
```

### Border
```typescript
<div style={{ borderColor: COLORS.mediumGray }}>
  ...
</div>
```

## Design Principles

✓ Use Navy for headers and primary text
✓ Use Cyan for interactive elements
✓ Use White for main backgrounds
✓ Use Gray for secondary text and borders
✓ Use Copper only for special states
✓ Maintain consistent spacing
✓ Keep animations smooth (300-500ms)

## Files to Update

When adding new components:
1. Import COLORS from `lib/constants/colors`
2. Use COLORS constants instead of hardcoding hex values
3. Follow existing component patterns
4. Test on multiple browsers
5. Check color contrast (WCAG AA)

## Component Reference

- **ChatBubble**: `components/chat-bubble.tsx`
- **LoadingScreen**: `components/loading-screen.tsx`
- **PageWithChatSidebar**: `components/page-with-chat-sidebar.tsx`
- **DynamicPageRenderer**: `components/dynamic-page-renderer.tsx`

## Resources

- Full Documentation: `DESIGN_SYSTEM_UPDATE.md`
- Implementation Details: `IMPLEMENTATION_COMPLETE.md`
- Color Constants: `lib/constants/colors.ts`

## Quick Commands

```bash
# Check build
npm run build

# Run dev server
npm run dev -- -p 7011

# Check TypeScript
npm run type-check
```

## Latest Commit

- Hash: `a852797`
- Message: Redesign BevGenie chat interface with professional B2B SaaS design system
- Date: 2025-10-29

---

**Status**: ✅ Production Ready
