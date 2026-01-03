import React from 'react';
import { StyleSheet, SafeAreaView, Platform, StatusBar, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

// Production URL
const APP_URL = 'https://hseplanv-2-next-js.vercel.app';

// Super-clean UserAgent (Generic Android Chrome) to avoid "WebView" detection
const USER_AGENT = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

// JavaScript to hide WebView artifacts from Google
const antiDetectionScript = `
  // 1. Overwrite UserAgent in JS world too
  Object.defineProperty(navigator, 'userAgent', { get: () => "${USER_AGENT}" });
  
  // 2. Hide "navigator.webdriver" (key bot detection signal)
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  
  // 3. Fake Plugins/Languages if empty
  if (!navigator.plugins || navigator.plugins.length === 0) {
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
  }
  true; // Note: this is required for injectedJavaScript
`;

export default function App() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <WebView
                source={{ uri: APP_URL }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
                allowsBackForwardNavigationGestures={true}
                userAgent={USER_AGENT}
                injectedJavaScript={antiDetectionScript}
                onContentProcessDidTerminate={() => Alert.alert("WebView Crash", "Reloading...")}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    webview: {
        flex: 1
    }
});
