package io.ionic.starter;

import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "DeviceName")
public class DeviceNamePlugin extends Plugin {

    @PluginMethod
    public void getDeviceName(PluginCall call) {

        String deviceName = null;

        // Android system device name
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            deviceName = android.provider.Settings.Global.getString(
                    getContext().getContentResolver(),
                    "device_name"
            );
        }

        // Fallback to Bluetooth name
        if (deviceName == null || deviceName.trim().isEmpty()) {
            deviceName = Build.MODEL;
        }

        // Final fallback
        if (deviceName == null || deviceName.trim().isEmpty()) {
            deviceName = "Android Device";
        }

        JSObject result = new JSObject();
        result.put("name", deviceName.trim());

        call.resolve(result);
    }
}