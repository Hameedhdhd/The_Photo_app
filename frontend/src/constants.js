/**
 * App-wide constants for Rooms and Categories
 */

export const CATEGORIES = [
  { id: 'electronics', label: 'Electronics', icon: 'hardware-chip-outline' },
  { id: 'furniture', label: 'Furniture', icon: 'bed-outline' },
  { id: 'fashion', label: 'Fashion', icon: 'shirt-outline' },
  { id: 'garden', label: 'Home & Garden', icon: 'leaf-outline' },
  { id: 'sports', label: 'Sports', icon: 'bicycle-outline' },
  { id: 'automotive', label: 'Automotive', icon: 'car-outline' },
  { id: 'toys', label: 'Toys', icon: 'cube-outline' },
  { id: 'other', label: 'Other', icon: 'apps-outline' },
];

export const ROOMS = [
  { id: 'kitchen', label: 'Kitchen', icon: 'restaurant-outline' },
  { id: 'bathroom', label: 'Bathroom', icon: 'water-outline' },
  { id: 'living', label: 'Living Room', icon: 'tv-outline' },
  { id: 'bedroom', label: 'Bedroom', icon: 'bed-outline' },
  { id: 'garage', label: 'Garage', icon: 'car-outline' },
  { id: 'office', label: 'Office', icon: 'briefcase-outline' },
  { id: 'other', label: 'Other', icon: 'apps-outline' },
];

export const VALID_ROOM_LABELS = ROOMS.map(r => r.label);
export const VALID_CATEGORY_LABELS = CATEGORIES.map(c => c.label);

export default {
  CATEGORIES,
  ROOMS,
  VALID_ROOM_LABELS,
  VALID_CATEGORY_LABELS,
};
