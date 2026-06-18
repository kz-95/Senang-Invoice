// Type shims for Capacitor packages used in dynamic imports (NodeProvider).
// These packages are only needed for APK builds; the dynamic imports are
// wrapped in try/catch for graceful degradation in web builds.
declare module '@capacitor/core' {
  export const Capacitor: {
    isNativePlatform?: () => boolean
  }
}

declare module 'capacitor-nodejs' {
  export const NodeJS: {
    start(params: { nodeModulesPath: string }): Promise<void>
  }
}
