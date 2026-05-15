import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = toastId.current++;
    const toast = { id, message, type };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastOverlay toasts={toasts} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const ToastOverlay = ({ toasts }) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <ToastItem key={toast.id} toast={toast} index={index} />
      ))}
    </View>
  );
};

const ToastItem = ({ toast, index }) => {
  const opacity = new Animated.Value(0);

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity]);

  const toastColors = {
    success: { bg: colors.success, text: colors.white, icon: '✓' },
    error: { bg: colors.error, text: colors.white, icon: '✕' },
    warning: { bg: colors.warning, text: colors.white, icon: '!' },
    info: { bg: colors.primary, text: colors.white, icon: 'ℹ' },
  };

  const config = toastColors[toast.type] || toastColors.info;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity,
          backgroundColor: config.bg,
          transform: [{ translateY: index * 10 }],
        },
      ]}
    >
      <Text style={[styles.icon, { color: config.text }]}>{config.icon}</Text>
      <Text style={[styles.message, { color: config.text }]}>{toast.message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.page,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginVertical: spacing.sm,
    ...shadows.md,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: spacing.md,
  },
  message: {
    flex: 1,
    ...typography.small,
    fontWeight: '500',
  },
});
