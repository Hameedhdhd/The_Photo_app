# Premium Components & Utilities Reference

## 🎯 New Files Added

### Utilities
```
src/utils/
├── haptics.js                    # Haptic feedback system
└── DebugLogger.js               # (existing)

src/hooks/
├── useScrollAnimation.js         # Scroll-linked animations
└── (new directory)

src/components/
├── Toast.js                      # Toast notification system
├── Skeleton.js                   # Loading skeleton components
├── PremiumCard.js               # Glassmorphism cards
└── PageTransition.js            # Page transition animations

Documentation
├── PREMIUM_FEATURES.md          # Feature guide with examples
├── UPGRADE_SUMMARY.md           # What's been added
└── BEST_PRACTICES.md            # How to maintain premium feel
```

## 📚 Component API Reference

### Toast System
```javascript
import { useToast } from '../components/Toast';

const { showToast } = useToast();
showToast(message, type, duration);

// Message: string (max 50 chars recommended)
// Type: 'success' | 'error' | 'warning' | 'info'
// Duration: number in ms (default: 3000)

// Examples
showToast('Saved!', 'success');              // 3s
showToast('Error', 'error', 5000);           // 5s
showToast('Copying...', 'info', 2000);       // 2s
```

### Haptic Feedback
```javascript
import { triggerHaptic } from '../utils/haptics';

triggerHaptic(type);

// Types:
// 'light'      - Subtle tap for selections
// 'medium'     - Standard press feedback
// 'heavy'      - Strong confirmation
// 'success'    - Positive completion
// 'warning'    - Alert/caution
// 'error'      - Failed action
// 'selection'  - Option picked

// Auto-catches errors - no try/catch needed
```

### Skeleton Loaders
```javascript
import {
  Skeleton,
  SkeletonCard,
  SkeletonListingCard,
} from '../components/Skeleton';

// Quick loaders
<SkeletonListingCard />       // Listing card shape
<SkeletonCard />              // Generic card shape

// Custom skeleton
<Skeleton
  width="100%"
  height={20}
  borderRadius={8}
  style={styles.customSkeleton}
/>
```

### Enhanced Button
```javascript
import Button from '../components/Button';

<Button
  title="Save"
  onPress={handlePress}
  variant="primary"             // primary|secondary|accent|danger|dark|ghost
  size="large"                  // small|medium|large
  icon="save"                   // Ionicon name
  iconRight={false}             // icon position
  loading={isLoading}           // Shows spinner
  disabled={false}
  fullWidth={true}
  style={customStyle}
  textStyle={customTextStyle}
  activeOpacity={0.7}
/>

// Now includes:
// - Spring animations on press
// - Haptic feedback (varies by variant)
// - Smooth scale transitions
// - Better visual feedback
```

### Premium Card
```javascript
import { PremiumCard } from '../components/PremiumCard';

<PremiumCard
  shadow="md"        // sm|md|lg|xl
  glass={true}       // Enable blur/glass effect
  elevation={true}   // Show shadow elevation
  style={customStyle}
>
  <Text>Content</Text>
</PremiumCard>
```

### Empty State
```javascript
import EmptyState from '../components/EmptyState';

<EmptyState
  icon="inbox-outline"           // Ionicon name
  title="No Items"               // Main heading
  subtitle="Create your first"   // Description
  iconBgColor={colors.infoLight}
  iconColor={colors.primary}
  gradient={true}                // Use gradient background
  action={<Button title="Create" />}  // Optional action
/>

// Now includes:
// - Staggered animations
// - Gradient backgrounds
// - Better visual hierarchy
```

### Loading Spinner
```javascript
import {
  LoadingOverlay,
  LoadingScreen,
} from '../components/LoadingSpinner';

// Full-screen overlay with message
<LoadingOverlay message="Analyzing..." />

// Full screen loading state
<LoadingScreen message="Loading..." />

// Now includes:
// - Pulsing animations
// - Rotating logo
// - Better visual polish
```

### Page Transitions
```javascript
import PageTransition from '../components/PageTransition';

<PageTransition
  type="fadeInUp"    // fadeInUp|fadeInDown|slideInRight
  duration={400}
  delay={0}
>
  <View>Content</View>
</PageTransition>
```

### Scroll Animations
```javascript
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const { scrollY, handleScroll, headerAnimatedStyle } = useScrollAnimation();

<Animated.ScrollView
  onScroll={handleScroll}
  scrollEventThrottle={16}
>
  <Animated.View style={headerAnimatedStyle}>
    {/* Shrinks/fades on scroll */}
  </Animated.View>
</Animated.ScrollView>
```

### Updated Header
```javascript
import Header from '../components/Header';

<Header
  title="Title"
  subtitle="Subtitle"
  showMenu={true}
  onMenuPress={() => {}}
  gradient={true}
  // ... other props
/>

// Now includes:
// - Smooth press animations
// - Haptic feedback
// - Better visual feedback
```

### Updated ListingCard
```javascript
import ListingCard from '../components/ListingCard';

<ListingCard
  item={item}
  index={0}
  onPress={handlePress}
  onToggleFavorite={handleToggleFavorite}
/>

// Now includes:
// - Scale animations on press
// - Bounce animation for favorite
// - Haptic feedback
// - Better visual depth
```

## 🎨 Theme Enhancements

### Gradients Available
```javascript
import { gradients } from '../theme';

// All pre-defined:
gradients.primary   // Brand gradient
gradients.accent    // Accent gradient
gradients.success   // Green gradient
gradients.error     // Red gradient
gradients.dark      // Dark gradient
gradients.light     // Light gradient
gradients.hero      // Attention-grabbing
gradients.glass     // For glass effect
```

### Colors Available
```javascript
import { colors } from '../theme';

// Primary brand
colors.primary        // Main brand color
colors.primaryDark    // Darker shade
colors.primaryLight   // Lighter shade

// Semantic
colors.success        // Success state
colors.error          // Error state
colors.warning        // Warning state
colors.info           // Info state

// Neutrals (complete 50-900 scale)
colors.gray50         // Lightest
colors.gray900        // Darkest

// Text
colors.textPrimary    // Main text
colors.textSecondary  // Secondary
colors.textTertiary   // Tertiary

// And more...
```

### Shadows Available
```javascript
import { shadows } from '../theme';

// Standard shadows
shadows.sm            // Subtle
shadows.md            // Standard
shadows.lg            // Prominent
shadows.xl            // Very prominent

// Colored shadows
shadows.primary       // Brand colored
shadows.accent        // Accent colored
```

## 🔧 Provider Setup

### App.js Setup (Already Done)
```javascript
import { ToastProvider } from './src/components/Toast';

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView>
        <ToastProvider>
          <AppNavigator />
        </ToastProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
```

## 📊 Packages Added

```json
{
  "dependencies": {
    "expo-haptics": "^12.x",  // For haptic feedback
    "expo-blur": "^12.x"       // For glassmorphism effects
  }
}
```

## ✅ Integration Checklist

- [x] Haptics utility created
- [x] Toast provider setup
- [x] Skeleton components created
- [x] Button enhanced with animations
- [x] Card components with glass effects
- [x] Empty states improved
- [x] Loading spinners enhanced
- [x] Page transitions created
- [x] Scroll animations hook created
- [x] Theme gradients added
- [x] Header component updated
- [x] ListingCard component updated
- [x] Documentation files created
- [x] All npm packages installed

## 🎯 Quick Integration Example

```javascript
import React, { useState } from 'react';
import { View } from 'react-native';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import { SkeletonListingCard } from '../components/Skeleton';
import { triggerHaptic } from '../utils/haptics';

export default function Example() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    triggerHaptic('medium');
    
    try {
      // Your API call
      await saveData();
      triggerHaptic('success');
      showToast('Saved successfully!', 'success');
    } catch (error) {
      triggerHaptic('error');
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {loading ? (
        <SkeletonListingCard />
      ) : (
        <Button
          title="Save"
          onPress={handleSave}
          loading={loading}
          fullWidth
        />
      )}
    </View>
  );
}
```

---

**All components are production-ready and follow React Native best practices.**
