package com.ownervibe.app.plugins;

import android.content.Context;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.chaquo.python.PyObject;
import com.chaquo.python.Python;
import com.chaquo.python.android.AndroidPlatform;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;

@CapacitorPlugin(name = "YtDlpPlugin")
public class YtDlpPlugin extends Plugin {
    private static final String TAG = "YtDlpPlugin";
    private boolean isInitialized = false;
    private PyObject ytdlpModule;

    @PluginMethod
    public void init(PluginCall call) {
        if (!isInitialized) {
            try {
                Context context = getContext();
                if (!Python.isStarted()) {
                    Python.start(new AndroidPlatform(context));
                }
                Python py = Python.getInstance();
                ytdlpModule = py.getModule("ytdlp_wrapper");
                isInitialized = true;
                Log.d(TAG, "Chaquopy and ytdlp_wrapper initialized successfully");
                call.resolve();
            } catch (Exception e) {
                Log.e(TAG, "Failed to initialize Python environment", e);
                call.reject("Failed to initialize Python environment: " + e.getMessage());
            }
        } else {
            call.resolve();
        }
    }

    @PluginMethod
    public void extractAudioUrl(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized. Call init() first.");
            return;
        }

        String videoId = call.getString("videoId");
        String format = call.getString("format", "bestaudio[ext=m4a]/bestaudio/best");

        if (videoId == null) {
            call.reject("Must provide a videoId");
            return;
        }

        try {
            PyObject result = ytdlpModule.callAttr("extract_info", videoId, format);
            String jsonResult = result.toString();
            JSONObject jsonObject = new JSONObject(jsonResult);

            if (jsonObject.has("error")) {
                call.reject(jsonObject.getString("error"));
            } else {
                JSObject ret = new JSObject();
                ret.put("url", jsonObject.optString("url"));
                ret.put("title", jsonObject.optString("title"));
                call.resolve(ret);
            }
        } catch (Exception e) {
            Log.e(TAG, "Extraction failed", e);
            call.reject("Extraction failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void search(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized. Call init() first.");
            return;
        }

        String query = call.getString("query");
        if (query == null) {
            call.reject("Must provide a search query");
            return;
        }

        try {
            PyObject result = ytdlpModule.callAttr("search", query, 15);
            String jsonResult = result.toString();

            if (jsonResult.startsWith("{") && new JSONObject(jsonResult).has("error")) {
                call.reject(new JSONObject(jsonResult).getString("error"));
                return;
            }

            JSONArray jsonArray = new JSONArray(jsonResult);
            JSArray retArray = new JSArray();
            for (int i = 0; i < jsonArray.length(); i++) {
                retArray.put(jsonArray.getJSONObject(i));
            }

            JSObject ret = new JSObject();
            ret.put("results", retArray);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Search failed", e);
            call.reject("Search failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void downloadAudio(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized. Call init() first.");
            return;
        }

        String videoId = call.getString("videoId");
        String format = call.getString("format", "bestaudio[ext=m4a]/bestaudio/best");

        if (videoId == null) {
            call.reject("Must provide a videoId");
            return;
        }

        try {
            File downloadDir = getContext().getCacheDir();
            String downloadDirPath = downloadDir.getAbsolutePath();

            PyObject result = ytdlpModule.callAttr("download_audio", videoId, downloadDirPath, format);
            String jsonResult = result.toString();
            JSONObject jsonObject = new JSONObject(jsonResult);

            if (jsonObject.has("error")) {
                call.reject(jsonObject.getString("error"));
            } else {
                JSObject ret = new JSObject();
                ret.put("filePath", jsonObject.optString("filePath"));
                call.resolve(ret);
            }
        } catch (Exception e) {
            Log.e(TAG, "Download failed", e);
            call.reject("Download failed: " + e.getMessage());
        }
    }
}
