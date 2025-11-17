# Character Capacity Feature

## Overview
The template editor now automatically calculates and displays the character capacity for each placeholder based on its dimensions, font size, and font family.

## Features

### 1. **Smart Character Calculation**
The system calculates:
- **Total Character Capacity**: Maximum number of characters that can fit in the placeholder
- **Characters Per Line**: How many characters fit on a single line
- **Number of Lines**: How many lines of text the placeholder can hold

### 2. **Real-Time Updates**
The character capacity updates automatically when you:
- Resize the placeholder (drag the bottom-right corner)
- Change the font size
- Change the font family
- Adjust placeholder dimensions

### 3. **Font-Aware Calculations**
Different fonts have different character widths:
- **Helvetica/Arial**: ~0.55x font size per character
- **Times Roman**: ~0.50x font size (more compact)
- **Courier**: ~0.60x font size (monospace, wider)
- **Bold variants**: Slightly wider than regular

### 4. **Visual Display**

#### On the Canvas
Each placeholder overlay shows:
```
[Placeholder Label]  200x30
                     ~25 chars
```

#### In the Editor Panel
Detailed breakdown:
```
Character Capacity:
  Total: ~25 characters
  Per Line: ~25 chars
  Lines: ~1 lines
  💡 Resize placeholder to adjust capacity
```

## How It Works

### Calculation Formula
```typescript
// Average character width
avgCharWidth = fontSize × fontWidthRatio

// Characters per line
charsPerLine = (width - padding) / avgCharWidth

// Number of lines
lines = (height - padding) / (fontSize × 1.2)

// Total capacity
capacity = charsPerLine × lines
```

### Font Width Ratios
```typescript
Helvetica: 0.55
Helvetica-Bold: 0.58
Times-Roman: 0.50
Courier: 0.60 (monospace)
Arial: 0.55
```

## Usage Guide

### For Template Creators
1. **Add a placeholder** - See initial capacity estimate
2. **Resize to fit your needs** - Watch capacity update in real-time
3. **Choose appropriate font** - Smaller fonts = more characters
4. **Plan your fields** - Know exactly how much text will fit

### For API Integration
When filling templates via API, you can now:
- Validate input length before submission
- Truncate text intelligently to fit
- Warn users when text exceeds capacity
- Auto-adjust font size if needed

### Example Use Cases

#### Name Field
```
Width: 200px, Height: 30px, Font: 11pt Helvetica
Capacity: ~25 characters
Perfect for: First/Last names
```

#### Address Field
```
Width: 300px, Height: 60px, Font: 10pt Helvetica
Capacity: ~100 characters
Perfect for: Full addresses (2 lines)
```

#### Comments Box
```
Width: 400px, Height: 120px, Font: 9pt Times-Roman
Capacity: ~400 characters
Perfect for: Multi-line descriptions
```

## Benefits

### 1. **Professional Output**
- No text overflow or truncation issues
- Perfectly sized placeholders for content
- Consistent, polished appearance

### 2. **Better Planning**
- Know exactly how much text will fit
- Design forms with appropriate field sizes
- Avoid surprises during automation

### 3. **API-Ready**
- Validate input before filling
- Provide character limits to users
- Auto-adjust or warn about oversized content

### 4. **User-Friendly**
- Visual feedback on every resize
- Real-time capacity updates
- Clear, easy-to-understand metrics

## Tips

### Maximize Character Capacity
- Use smaller font sizes (but keep readable!)
- Choose compact fonts (Times Roman > Helvetica)
- Make placeholders wider and taller
- Reduce padding where possible

### Optimize for Readability
- Don't go below 8pt font size
- Leave some padding for visual clarity
- Use 1-2 lines for short fields
- Use multiple lines for longer content

### Best Practices
1. **Test with real content** - Fill with actual data to verify
2. **Add buffer space** - Don't max out capacity exactly
3. **Consider line breaks** - Real text may not fill lines perfectly
4. **Account for variation** - Different characters have different widths

## Integration with Font Detection

The character capacity feature works seamlessly with the font detection system:

1. **Font analysis** suggests optimal font size
2. **Character capacity** shows what that size can hold
3. **User adjusts** based on both recommendations
4. **System validates** that content will fit

## Future Enhancements

Planned improvements:
- [ ] More accurate character width detection per font
- [ ] Support for custom fonts
- [ ] Preview of actual text at calculated capacity
- [ ] Auto-suggest optimal placeholder size for known content
- [ ] Export capacity limits with template metadata

---

**Note**: Character capacities are approximate and based on average character widths. Actual capacity may vary slightly depending on specific character combinations (e.g., "www" vs "iii").
