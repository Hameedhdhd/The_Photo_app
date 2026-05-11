import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import App from './App';

describe('<App />', () => {
  it('renders correctly', () => {
    const { getByText } = render(<App />);
    
    // Check if main UI elements are present
    expect(getByText('The Photo App')).toBeTruthy();
    expect(getByText('Snap an item. Sell it instantly.')).toBeTruthy();
    expect(getByText('Take a Photo')).toBeTruthy();
  });

  it('button is pressable', () => {
    const { getByText } = render(<App />);
    const button = getByText('Take a Photo');
    
    // Fire a press event (it doesn't do anything yet, but we verify it can be pressed)
    fireEvent.press(button);
  });
});
