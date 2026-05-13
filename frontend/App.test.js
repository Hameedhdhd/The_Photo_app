import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import App from './App';

// Mock Expo Image Picker
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchCameraAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{ uri: 'file://mock-image-uri.jpg' }]
  })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{ uri: 'file://mock-image-uri.jpg' }]
  })),
}));

// Mock Supabase
jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signOut: jest.fn(() => Promise.resolve()),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
      })),
      insert: jest.fn(() => ({
        execute: jest.fn(() => Promise.resolve({ data: null, error: null }))
      })),
    })),
  },
}));

// Mock fetch API globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      title: "Mock AI: Vintage Lamp",
      description_en: "A beautiful vintage lamp perfect for your desk.",
      description_de: "Eine wunderschöne Vintage-Lampe.",
      price: "45 EUR",
      category: "Furniture",
      item_id: "ITEM-TEST01",
      room: "Living Room",
    }),
  })
);

describe('<App />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login screen', () => {
    const { getByText } = render(<App />);
    expect(getByText('Login')).toBeTruthy();
  });

  it('renders app title on login', () => {
    const { getByText } = render(<App />);
    expect(getByText('List It Fast')).toBeTruthy();
  });
});