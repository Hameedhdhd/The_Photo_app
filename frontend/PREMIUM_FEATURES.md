/**
 * Premium UI Features Guide
 * 
 * This file documents all the premium enhancements added to your Photo app.
 * Copy & adapt these patterns to unlock premium UX throughout your app.
 */

// ─── 1. HAPTIC FEEDBACK ──────────────────────────────────────────
// Makes interactions feel responsive and tactile
//
// Usage:
// import { triggerHaptic } from '../utils/haptics';
//
// triggerHaptic('light');      // Subtle tap
// triggerHaptic('medium');     // Standard press
// triggerHaptic('heavy');      // Strong press
// triggerHaptic('success');    // Success feedback
// triggerHaptic('warning');    // Warning feedback
// triggerHaptic('error');      // Error feedback
// triggerHaptic('selection');  // Selection feedback
//
// Example in button press:
// <Button
//   onPress={() => {
//     triggerHaptic('success');
//     navigateToNextScreen();
//   }}
// />

// ─── 2. TOAST NOTIFICATIONS ─────────────────────────────────────
// Non-intrusive feedback messages
//
// Usage:
// import { useToast } from '../components/Toast';
//
// const { showToast } = useToast();
//
// showToast('Item saved!', 'success');      // 3s duration
// showToast('Error occurred', 'error', 5000); // 5s duration
// showToast('Warning!', 'warning', 2000);
// showToast('Info message', 'info');
//
// Wrap your root component with <ToastProvider> (already done in App.js)

// ─── 3. SKELETON LOADERS ────────────────────────────────────────
// Smooth loading states instead of spinners
//
// Usage:
// import { Skeleton, SkeletonCard, SkeletonListingCard } from '../components/Skeleton';
//
// {isLoading ? (
//   <>
//     <SkeletonListingCard />
//     <SkeletonListingCard />
//     <SkeletonListingCard />
//   </>
// ) : (
//   <YourContent />
// )}
//
// Or custom skeleton:
// <Skeleton width="100%" height={20} borderRadius={8} />

// ─── 4. ENHANCED BUTTONS ─────────────────────────────────────────
// Buttons now have:
// - Smooth spring animations on press
// - Haptic feedback
// - Better visual feedback
//
// Usage (same as before, now with premium feel):
// <Button
//   title="Save Item"
//   onPress={handleSave}
//   variant="primary"      // primary | secondary | accent | danger | dark | ghost
//   size="large"           // small | medium | large
//   icon="save"
//   loading={isLoading}
//   fullWidth
// />

// ─── 5. PREMIUM CARDS ───────────────────────────────────────────
// Cards with glassmorphism effects
//
// Usage:
// import { PremiumCard } from '../components/PremiumCard';
//
// <PremiumCard shadow="lg" glass={true}>
//   <Text>Content with glass effect</Text>
// </PremiumCard>
//
// Or standard card:
// <PremiumCard shadow="md">
//   <Text>Standard premium card</Text>
// </PremiumCard>

// ─── 6. PAGE TRANSITIONS ────────────────────────────────────────
// Smooth animations between screens
//
// Usage:
// import { PageTransition } from '../components/PageTransition';
//
// <PageTransition type="fadeInUp" duration={400}>
//   <View>Your screen content</View>
// </PageTransition>
//
// Types: fadeInUp | fadeInDown | slideInRight

// ─── 7. SCROLL ANIMATIONS ──────────────────────────────────────
// Parallax and scroll-linked effects
//
// Usage:
// import { useScrollAnimation } from '../hooks/useScrollAnimation';
//
// const { scrollY, handleScroll, headerAnimatedStyle } = useScrollAnimation();
//
// <Animated.ScrollView onScroll={handleScroll} scrollEventThrottle={16}>
//   <Animated.View style={headerAnimatedStyle}>
//     <Text>Header that shrinks on scroll</Text>
//   </Animated.View>
// </Animated.ScrollView>

// ─── 8. GRADIENTS ──────────────────────────────────────────────
// Pre-defined gradients for consistent styling
//
// Import from theme:
// import { gradients } from '../theme';
//
// Available gradients:
// - gradients.primary    // Main brand gradient
// - gradients.accent     // Accent gradient
// - gradients.success    // Success gradient
// - gradients.error      // Error gradient
// - gradients.dark       // Dark gradient
// - gradients.light      // Light gradient
// - gradients.hero       // Hero/attention gradient
// - gradients.glass      // Glass effect gradient

// ─── INTEGRATION PATTERNS ──────────────────────────────────────

// PATTERN 1: Premium List Item
// import { ListingCard } from '../components/ListingCard';
//
// const items = [...];
// items.map((item, i) => (
//   <ListingCard
//     key={item.id}
//     item={item}
//     index={i}
//     onPress={handleItemPress}
//     onToggleFavorite={handleToggleFavorite}
//   />
// ))

// PATTERN 2: Form with Premium Feedback
// const { showToast } = useToast();
// const [loading, setLoading] = useState(false);
//
// const handleSubmit = async () => {
//   setLoading(true);
//   triggerHaptic('medium');
//   try {
//     await submitForm(data);
//     triggerHaptic('success');
//     showToast('Saved successfully!', 'success');
//   } catch (error) {
//     triggerHaptic('error');
//     showToast(error.message, 'error');
//   } finally {
//     setLoading(false);
//   }
// };

// PATTERN 3: Empty State with Premium UX
// import EmptyState from '../components/EmptyState';
//
// {items.length === 0 ? (
//   <EmptyState
//     icon="inbox-outline"
//     title="No Items Yet"
//     subtitle="Start by taking a photo to create your first listing"
//     iconBgColor={colors.infoLight}
//     iconColor={colors.primary}
//   />
// ) : (
//   <ItemList items={items} />
// )}

export const PREMIUM_FEATURES = {
  HAPTIC_FEEDBACK: true,
  TOAST_NOTIFICATIONS: true,
  SKELETON_LOADERS: true,
  ENHANCED_ANIMATIONS: true,
  PAGE_TRANSITIONS: true,
  SCROLL_ANIMATIONS: true,
  GLASS_EFFECTS: true,
  PREMIUM_CARDS: true,
  GESTURE_FEEDBACK: true,
};

export default PREMIUM_FEATURES;
