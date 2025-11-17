# Alignment Guides Feature

## Overview

The Alignment Guides feature provides visual guide lines that help users align placeholders perfectly with each other. When dragging a placeholder, blue guide lines appear showing alignment points with other placeholders, and the dragged placeholder automatically snaps to these alignment points.

## Features

### 1. **Visual Guide Lines**
- **Vertical Lines**: Show alignment with left edge, right edge, and center of other placeholders
- **Horizontal Lines**: Show alignment with top edge, bottom edge, and center of other placeholders
- **Color**: Blue (#3B82F6) with 50% opacity for visibility
- **Display**: Only shown while dragging a placeholder

### 2. **Snap-to-Align**
- **Automatic Snapping**: Placeholders automatically snap to guide lines when within 5px
- **Multi-Point Snapping**: Snaps to left edge, right edge, center (both horizontal and vertical)
- **Closest Snap**: Always snaps to the closest alignment point
- **Smooth Experience**: Snapping feels natural and helps create professional layouts

### 3. **Toggle Control**
- **Button**: "Guides ON/OFF" button in template editor toolbar
- **Visual Feedback**: Button changes color when active (blue when ON, gray when OFF)
- **Default**: Guides are ON by default
- **Persistent**: Can be toggled at any time without losing work

## How It Works

### Guide Line Calculation
```typescript
calculateGuideLines(currentPlaceholderId?: string) {
  // For each placeholder (except the one being dragged):
  // 1. Add left edge position (x)
  // 2. Add right edge position (x + width)
  // 3. Add center position (x + width/2)
  // 4. Add top edge position (y)
  // 5. Add bottom edge position (y + height)
  // 6. Add center position (y + height/2)
}
```

### Snap Logic
```typescript
snapToGuide(value: number, guides: number[], threshold: number = 5) {
  // Check if value is within 5px of any guide line
  // If yes, return guide position
  // If no, return original value
}
```

### Snapping Priority
When dragging, the system checks multiple snap points and uses the closest:
1. **Left edge** of dragged placeholder → Any vertical guide
2. **Right edge** of dragged placeholder → Any vertical guide
3. **Center** of dragged placeholder → Any vertical guide
4. **Top edge** of dragged placeholder → Any horizontal guide
5. **Bottom edge** of dragged placeholder → Any horizontal guide
6. **Center (vertical)** of dragged placeholder → Any horizontal guide

The closest snap point wins!

## User Experience

### Visual Feedback
1. **Status Indicator**: Blue badge showing "Alignment guides active • Drag placeholders to see snap lines"
2. **Guide Lines**: Blue lines appear while dragging
3. **Button State**: Toggle button shows current state with color coding
4. **Smooth Snapping**: No jarring movements, feels natural

### Usage Flow
1. User clicks "Guides ON" button (if not already on)
2. User clicks and drags a placeholder
3. Blue guide lines appear showing alignment with other placeholders
4. Placeholder snaps to closest alignment point when near a guide line
5. User releases mouse, guide lines disappear
6. Placeholder stays in aligned position

## Implementation Details

### Files Modified
- `/app/documents/[id]/edit/page.tsx` - Main implementation

### Key State Variables
```typescript
const [showAlignmentGuides, setShowAlignmentGuides] = useState(true);
const [guideLines, setGuideLines] = useState<{ x: number[], y: number[] }>({ x: [], y: [] });
```

### Key Functions
- `calculateGuideLines(currentPlaceholderId?: string)` - Calculates all guide positions
- `snapToGuide(value: number, guides: number[], threshold: number)` - Snaps value to nearest guide
- Updated `handleMouseDown()` - Triggers guide calculation when dragging starts
- Updated `handleMouseMove()` - Applies snapping logic during drag
- Updated `handleMouseUp()` - Clears guides when dragging ends

### Visual Rendering
```tsx
{showAlignmentGuides && isDragging && (
  <div className="absolute inset-0 pointer-events-none">
    {/* Vertical guide lines */}
    {guideLines.x.map((x, index) => (
      <div className="absolute top-0 bottom-0 w-px bg-blue-500 opacity-50" 
           style={{ left: `${x}px` }} />
    ))}
    {/* Horizontal guide lines */}
    {guideLines.y.map((y, index) => (
      <div className="absolute left-0 right-0 h-px bg-blue-500 opacity-50" 
           style={{ top: `${y}px` }} />
    ))}
  </div>
)}
```

## Benefits

### For Users
- ✅ **Perfect Alignment**: Ensures placeholders line up perfectly
- ✅ **Professional Look**: Creates clean, organized layouts
- ✅ **Faster Editing**: Quick visual feedback speeds up template creation
- ✅ **No Math Required**: Automatic snapping, no manual coordinate entry
- ✅ **Flexible**: Can be turned off if not needed

### For Document Quality
- ✅ **Consistent Spacing**: Placeholders align with existing elements
- ✅ **Visual Hierarchy**: Easy to create aligned rows and columns
- ✅ **Professional Output**: Generated documents look polished
- ✅ **Reduced Errors**: Less chance of misaligned fields

## Usage Tips

### Creating Aligned Columns
1. Place first placeholder
2. Add second placeholder below it
3. Drag second placeholder - it will snap to align with first
4. Result: Perfectly aligned column

### Creating Aligned Rows
1. Place first placeholder
2. Add second placeholder to the right
3. Drag second placeholder - it will snap to align horizontally
4. Result: Perfectly aligned row

### Creating Grids
1. Create first row using horizontal alignment
2. Create second row below, aligning vertically with first row
3. Guides help maintain both horizontal and vertical alignment
4. Result: Clean grid layout

### When to Disable Guides
- **Free-form layouts**: When precise alignment isn't needed
- **Overlapping elements**: When intentionally placing elements off-grid
- **Performance**: On slower devices with many placeholders

## Technical Notes

### Performance
- Guide lines only calculated while dragging
- Cleared immediately on mouse up
- No performance impact when not dragging
- Efficient Set-based deduplication of guide positions

### Snap Threshold
- Default: 5 pixels
- Can be adjusted by modifying `threshold` parameter in `snapToGuide()`
- Smaller threshold = more precise positioning required
- Larger threshold = easier to snap but less precise

### Browser Compatibility
- Works in all modern browsers
- Uses standard CSS positioning
- No external dependencies
- Pure React implementation

## Future Enhancements

Potential improvements:
- [ ] Configurable snap threshold in UI
- [ ] Show distance measurements between placeholders
- [ ] Grid overlay option (e.g., 10px grid)
- [ ] Snap to page margins/edges
- [ ] Keyboard shortcuts for fine-tuning position
- [ ] Undo/redo for placeholder moves
- [ ] Align multiple selected placeholders at once

## Troubleshooting

### Guides Not Appearing
- Check if "Guides ON" button is active (blue)
- Ensure you have at least 2 placeholders
- Make sure you're dragging (not just clicking)

### Snapping Too Aggressive/Not Aggressive Enough
- Modify the `threshold` parameter in `snapToGuide()` function
- Current default is 5px
- Increase for easier snapping, decrease for more precision

### Guide Lines Persist After Dragging
- This is a bug - guides should clear on `handleMouseUp()`
- Check that `setGuideLines({ x: [], y: [] })` is being called

---

**The Alignment Guides feature makes creating professional, pixel-perfect templates fast and easy! 📏✨**
