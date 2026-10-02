package io.ionic.starter;

import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {

        // Register custom DeviceName plugin
        registerPlugin(DeviceNamePlugin.class);

        super.onCreate(savedInstanceState);

        WebSettings settings = getBridge().getWebView().getSettings();

        settings.setMixedContentMode(
                WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        );

        // Same text size on every phone: ignore the system "Font size" setting.
        settings.setTextZoom(100);

        // Stop OEM "force dark" from recolouring the app.
        // The app has its own Dark/Light theme in Settings.
        if (Build.VERSION.SDK_INT >= 33) {
            settings.setAlgorithmicDarkeningAllowed(false);
        } else if (Build.VERSION.SDK_INT >= 29) {
            settings.setForceDark(WebSettings.FORCE_DARK_OFF);
        }
    }
}