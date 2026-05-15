import React from 'react';
import Animated, { FadeInDown, FadeInUp, SlideInRight, SlideOutLeft } from 'react-native-reanimated';

export const PageTransition = ({
  children,
  type = 'fadeInUp',
  duration = 400,
  delay = 0,
}) => {
  const animationMap = {
    fadeInUp: FadeInUp.duration(duration).delay(delay),
    fadeInDown: FadeInDown.duration(duration).delay(delay),
    slideInRight: SlideInRight.duration(duration).delay(delay),
  };

  const animation = animationMap[type] || animationMap.fadeInUp;

  return (
    <Animated.View entering={animation}>
      {children}
    </Animated.View>
  );
};

export default PageTransition;
