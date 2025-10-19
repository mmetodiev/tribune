# Reader View Enhancements

## Changes Made

### 1. Column Layout Controls
Added a column layout switcher in the article reader header that allows users to choose between 1, 2, or 3 column layouts.

### 2. Font Size Controls  
Added font size adjustment controls next to the column layout controls, allowing users to choose between small, medium, and large text sizes.

**Column Layout Features:**
- Three icon buttons using Lucide React icons:
  - `AlignLeft` icon for single column
  - `Columns2` icon for two columns
  - `Columns3` icon for three columns
- Active selection highlighted with dark grey background (`bg-gray-800`)
- Vertical divider lines between columns in multi-column mode
- Container width adjusts automatically:
  - 1 column: max-width-4xl (narrowest, most readable)
  - 2 columns: max-w-6xl (medium width)
  - 3 columns: max-w-7xl (widest for all columns)
- Column spacing:
  - 2 columns: 8-unit gap
  - 3 columns: 6-unit gap

**Font Size Features:**
- Three icon buttons using the `Type` icon from Lucide at different sizes:
  - Small font: `Type` icon at 12px (w-3 h-3)
  - Medium font: `Type` icon at 16px (w-4 h-4) - default
  - Large font: `Type` icon at 20px (w-5 h-5)
- Active selection highlighted with dark grey background (`bg-gray-800`)
- Dynamically adjusts all typography:
  - Body text uses Tailwind's `prose-sm`, `prose-base`, or `prose-lg`
  - Headings scale proportionally (H1, H2, H3)
  - Spacing adjusts (margins, padding, gaps)
  
**Common Features:**
- Clean, minimal design without text labels
- Tooltips on hover for accessibility
- Smooth transitions between states
- Consistent dark grey active state

### 3. Reduced Typography Sizes
All text sizes have been reduced for a more compact, newspaper-like reading experience (this is now adjustable via font size controls).

**Default Size Before → After:**
- Main title: `text-6xl` → `text-4xl` (on desktop)
- H1 headings: `text-4xl` → `text-2xl`
- H2 headings: `text-3xl` → `text-xl`
- H3 headings: `text-2xl` → `text-lg`
- Body text: `prose-xl` → `prose-base` (from 20px to 16px)
- Metadata text: Reduced to `text-sm` and `text-xs`
- Spacing: Reduced margins and padding throughout

**Benefits:**
- More content visible on screen
- Better suited for multi-column layouts
- Faster reading in column format
- More traditional newspaper feel

## Technical Implementation

### Icon Library
- Uses `lucide-react` for clean, minimal icons
- Column icons: `AlignLeft`, `Columns2`, `Columns3` (all 16x16px)
- Font size icons: `Type` at three different sizes (12px, 16px, 20px)

### State Management
```typescript
const [columns, setColumns] = useState<1 | 2 | 3>(1);
const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
```

### Dynamic Styling
- Active state uses dark grey (`bg-gray-800`) for both column and font controls
- Container width changes based on column count
- CSS columns property applied conditionally for multi-column layouts
- Column rules (dividers) added between columns
- Font size dynamically switches between `prose-sm`, `prose-base`, and `prose-lg`
- Heading sizes, spacing, and margins scale with font size selection
- All typography uses Tailwind's prose utilities with custom overrides

### Responsive Behavior
- Controls are optimized for mobile and desktop
- "View Original" link shows shorter text on mobile
- Layout label hidden on small screens
- Column layout works seamlessly across screen sizes

## Usage

1. **Open any article** in the reader view
2. **Look at the header** - you'll see two groups of controls in the center

**Column Layout Controls (Left Group):**
3. **Click the single line icon** (AlignLeft) for traditional single-column reading (default)
4. **Click the two column icon** (Columns2) for newspaper-style two-column layout
5. **Click the three column icon** (Columns3) for compact three-column layout

**Font Size Controls (Right Group):**
6. **Click the small "A" icon** for compact text (prose-sm)
7. **Click the medium "A" icon** for standard text (prose-base, default)
8. **Click the large "A" icon** for larger, more readable text (prose-lg)

9. **Hover over any icon** to see tooltips explaining each option
10. **Mix and match** - combine any column layout with any font size for your perfect reading experience

## Testing

To test the implementation:
```bash
npm run dev
```

Then:
1. Navigate to any article
2. Try switching between 1, 2, and 3 column layouts
3. Try switching between small, medium, and large font sizes
4. Test combinations: 
   - Small font + 3 columns (most compact)
   - Large font + 1 column (most readable)
   - Medium font + 2 columns (balanced)
5. Verify columns have divider lines in multi-column layouts
6. Check that spacing adjusts with font size
7. Test on different screen sizes

Note: Both layout and font size preferences reset when you navigate to a different article (they don't persist).

## Future Enhancements (Optional)

- [ ] Persist both column and font size preferences in localStorage
- [ ] Add keyboard shortcuts:
  - 1, 2, 3 keys for column layout
  - -, =, + keys for font size (or Cmd/Ctrl + -/+)
- [ ] Add 4 or 5 font size options for finer control
- [ ] Responsive column count (auto-adjust based on screen width)
- [ ] Add line height adjustment controls
- [ ] Save per-article reading position

