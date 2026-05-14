package com.ownervibe.app.plugins;

import android.content.Context;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "YtDlpPlugin")
public class YtDlpPlugin extends Plugin {
    private static final String TAG = "YtDlpPlugin";
    private boolean isInitialized = false;

    @PluginMethod
    public void init(PluginCall call) {
        call.reject("Not implemented (Chaquopy pivot)");
    }

    @PluginMethod
    public void extractAudioUrl(PluginCall call) {
        call.reject("Not implemented (Chaquopy pivot)");
    }

    @PluginMethod
    public void downloadAudio(PluginCall call) {
        call.reject("Not implemented (Chaquopy pivot)");
    }
}
