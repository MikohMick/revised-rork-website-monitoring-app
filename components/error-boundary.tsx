import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface ErrorBoundaryState { hasError: boolean; errorMessage?: string }

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    else if (typeof error === 'string') message = error;
    else {
      try { message = JSON.stringify(error); } catch { message = String(error); }
    }
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown) {
    console.error('[ErrorBoundary] Caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="globalErrorBoundary">
          <Text style={styles.title}>APPLICATION_ERROR</Text>
          <Text style={styles.message} numberOfLines={6}>
            {this.state.errorMessage}
          </Text>
        </View>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    color: '#ff6b6b',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    marginBottom: 8,
  },
  message: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    textAlign: 'center',
    opacity: 0.8,
  },
});
