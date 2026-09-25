package io.ionic.starter;

import android.os.Bundle;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {

        // Register custom DeviceName plugin
        registerPlugin(DeviceNamePlugin.class);

        super.onCreate(savedInstanceState);

        getBridge().getWebView()
                .getSettings()
                .setMixedContentMode(
                        WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                );
    }
}