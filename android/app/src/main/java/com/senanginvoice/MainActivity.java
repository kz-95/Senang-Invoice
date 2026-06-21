package com.senanginvoice;

import android.os.Bundle;
import android.webkit.CookieManager;
import com.getcapacitor.BridgeActivity;
import java.io.File;

public class MainActivity extends BridgeActivity {

    // Recursively delete a directory
    private static void deleteRecursive(File file) {
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) {
                for (File child : children) {
                    deleteRecursive(child);
                }
            }
        }
        file.delete();
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Force-clear stale WebView cache on every launch.
        // The Capacitor WebView caches HTML/JS/CSS at the native level;
        // without this, reinstalled APKs still serve stale pages.
        try {
            // 1. Clear the WebView cache directory
            File webViewCache = new File(getCacheDir(), "WebView");
            deleteRecursive(webViewCache);

            // 2. Clear the Chromium HTTP cache
            File chromiumCache = new File(getCacheDir(), "chromium");
            deleteRecursive(chromiumCache);

            // 3. Clear the old WebView database
            deleteDatabase("webview.db");
            deleteDatabase("webviewCache.db");

            // 4. Clear cookies (can hold stale session state)
            CookieManager.getInstance().removeAllCookies(null);
        } catch (Exception ignored) {
            // Non-critical — app still works, just might show stale content
        }
    }
}
