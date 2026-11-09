import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cauefeliciano.despensa",
  appName: "Despensa",
  webDir: "dist",
  android: {
    // Keep the WebView's IndexedDB/localStorage (the app's data) on the device.
    allowMixedContent: false,
  },
};

export default config;
