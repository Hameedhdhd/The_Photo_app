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
  MediaTypeOptions: { Images: 'Images' }
}));

// Mock fetch API globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      title: "Mock AI: Vintage Lamp",
      description: "A beautiful vintage lamp perfect for your desk.",
      price: "45 EUR",
      category: "Furniture"
    }),
  })
);

describe('<App />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<App />);
    
    expect(getByText('The Photo App')).toBeTruthy();
    expect(getByText('Snap an item. Sell it instantly.')).toBeTruthy();
    expect(getByText('Take a Photo')).toBeTruthy();
    expect(getByText('Choose from Gallery')).toBeTruthy();
  });

  it('camera button triggers image picker and shows results', async () => {
    const { getByText, findByText } = render(<App />);
    const cameraButton = getByText('Take a Photo');
    
    fireEvent.press(cameraButton);
    
    // Since fetch resolves instantly in the mock, it skips loading and goes straight to results
    expect(await findByText('Mock AI: Vintage Lamp')).toBeTruthy();
    expect(await findByText('A beautiful vintage lamp perfect for your desk.')).toBeTruthy();
  });

  it('gallery button triggers image picker and shows results', async () => {
    const { getByText, findByText } = render(<App />);
    const galleryButton = getByText('Choose from Gallery');
    
    fireEvent.press(galleryButton);
    
    // Check that results rendered successfully
    expect(await findByText('Mock AI: Vintage Lamp')).toBeTruthy();
    expect(await findByText('45 EUR')).toBeTruthy();
  });
});
