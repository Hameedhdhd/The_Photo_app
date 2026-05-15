# Premium UX Best Practices

## 🎯 Golden Rules for Premium Apps

### 1. **Every Interaction Gets Feedback**
- Button press? → Haptic + Animation
- Form submission? → Toast + Loading state
- Delete action? → Confirmation + Success toast
- Error occurs? → Haptic (warning) + Error toast

### 2. **Never Show Raw Spinners**
```javascript
// ❌ BAD - boring
<ActivityIndicator />

// ✅ GOOD - premium
<Skeleton />  // or SkeletonCard for card layouts
```

### 3. **Animations Should Feel Natural**
- Use spring animations for interactive elements
- Use fades for content reveals
- Use slide for navigation transitions
- Duration: 200-500ms for most interactions

### 4. **Typography Has Hierarchy**
```javascript
// Each text level should be distinct
h1: 32px, 800 weight    // Biggest - page titles
h2: 26px, 700 weight    // Sections
h3: 20px, 700 weight    // Subsections
body: 15px, 400 weight  // Content
caption: 12px, 600 weight, uppercase  // Labels
```

### 5. **Spacing Creates Breathing Room**
```javascript
// Use theme spacing scale consistently
xs: 4px      // Micro spaces
sm: 8px      // Small gaps
md: 12px     // Regular gaps
base: 16px   // Standard padding
lg: 20px     // Large sections
xl: 24px     // Between major sections
```

### 6. **Color Usage Pattern**
- Primary (Indigo) → Main actions, focus states
- Accent (Amber) → Prices, highlights
- Success (Green) → Positive actions, completions
- Error (Red) → Destructive actions, failures
- Neutral (Gray) → Text, backgrounds, borders

### 7. **Toast Messages Are Your Friend**
```javascript
// Instead of alerts:
showToast('Saved!', 'success');           // 3s
showToast('Network error', 'error', 5000); // 5s
showToast('Image added', 'success', 2000); // 2s

// Never use long messages - keep under 50 chars
// ✅ "Saved successfully!"
// ❌ "The item has been saved to your collection and is now live"
```

### 8. **Haptic Feedback Timing**
- Light → Tab switching, subtle feedback
- Medium → Button press, form submission
- Heavy → Confirmations, important actions
- Success → Positive completion
- Warning → Important alerts
- Error → Failed actions
- Selection → Option picking

### 9. **Loading States Matter**
```javascript
// Priority order for loading experience:
1. Skeleton loaders (best) - shows content structure
2. Placeholder content (good) - gray boxes
3. Spinner only (okay) - basic loading
4. No feedback (bad) - user sees nothing

// Always use skeleton when you know the layout
```

### 10. **Empty States Are Opportunities**
```javascript
// Don't just show "No items"
<EmptyState
  icon="inbox-outline"
  title="No Items Yet"
  subtitle="Start creating your first listing"
  action={<Button title="Create Now" />}
/>

// Show an action, not just text
```

## 🎨 Consistency Checklist

### Colors
- [ ] Primary gradient used on main CTAs
- [ ] Accent color for prices/highlights
- [ ] Success/error/warning for states
- [ ] Consistent gray palette for text
- [ ] White/gray50 for backgrounds

### Typography
- [ ] Titles use h3 (20px, 700)
- [ ] Subtitles use small (13px, 500)
- [ ] Body text is 15px regular
- [ ] All caps labels use caption style
- [ ] Font weights: 400/500/600/700/800/900 only

### Spacing
- [ ] Page padding: 16px
- [ ] Card padding: 12px
- [ ] Element gaps: 8-12px
- [ ] Section gaps: 20-24px
- [ ] No arbitrary spacing

### Shadows
- [ ] sm: subtle cards
- [ ] md: standard elevated elements
- [ ] lg: prominent cards, modals
- [ ] xl: overlays, floating actions
- [ ] primary/accent for colored shadows

### Animations
- [ ] Spring (damping: 15, stiffness: 200) for interactions
- [ ] Duration 200-350ms for most animations
- [ ] 400-500ms for page transitions
- [ ] All animations use native driver
- [ ] Haptic feedback accompanies animations

### Border Radius
- [ ] sm: 8px - small badges, buttons
- [ ] md: 12px - input fields, small cards
- [ ] lg: 16px - cards, modals
- [ ] xl: 20px - large modals
- [ ] full: 9999px - circles, pills

## 🚀 Before Shipping Any Feature

### Interaction Checklist
- [ ] Does it give tactile feedback? (haptic)
- [ ] Does it animate smoothly? (spring/fade)
- [ ] Does error show toast? (not alert)
- [ ] Does success show toast? (celebration)
- [ ] Does loading show skeleton? (not spinner)
- [ ] Is the color on-brand? (check theme)
- [ ] Is spacing consistent? (use spacing scale)
- [ ] Is typography hierarchy clear? (use theme)

### Performance Checklist
- [ ] All animations use useNativeDriver
- [ ] Heavy lists use FlatList/SectionList
- [ ] Images are optimized size
- [ ] Haptics wrapped in try-catch
- [ ] No layout shift during loading
- [ ] Scroll performance is 60fps
- [ ] Toast messages auto-dismiss

### UX Checklist
- [ ] Empty states have actions
- [ ] Errors are actionable
- [ ] Loading states show progress
- [ ] Touch targets > 44x44 points
- [ ] No surprise destructive actions
- [ ] Confirmation for important actions
- [ ] Deep links work properly
- [ ] Back button works as expected

## 📋 Template for New Screens

```javascript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Header from '../components/Header';
import { SkeletonListingCard } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { colors, spacing } from '../theme';

export default function YourScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await yourAPI.fetch();
      setData(result);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Your Screen" />
      
      <View style={styles.content}>
        {loading ? (
          <>
            <SkeletonListingCard />
            <SkeletonListingCard />
          </>
        ) : data.length === 0 ? (
          <EmptyState
            icon="inbox-outline"
            title="No Data"
            subtitle="Create your first item"
          />
        ) : (
          <Animated.ScrollView
            entering={FadeInUp.duration(300)}
            contentContainerStyle={styles.list}
          >
            {data.map((item) => (
              <YourCard key={item.id} item={item} />
            ))}
          </Animated.ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  list: { padding: spacing.page, paddingBottom: spacing.xxxl },
});
```

## 🎓 Learning Resources

### Animation Best Practices
- Use spring for interactive elements
- Use timing for automated animations
- Keep duration between 200-500ms
- Test on low-end devices
- Always use native driver

### Color Theory
- Maintain contrast ratios > 4.5:1 for text
- Use color to indicate status, not decoration
- Limit palette to 5-6 colors
- Test with color blindness filters

### Performance
- Profile with React DevTools
- Monitor frame rate (should be 60fps)
- Test loading on slow networks
- Use FlatList for big lists
- Memoize expensive components

---

**Remember:** Premium apps feel responsive, look polished, and respect the user's time and attention.
