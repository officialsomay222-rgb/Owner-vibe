package com.ownervibe.app.plugins;

import android.content.Context;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.yausername.youtubedl_android.YoutubeDL;
import com.yausername.youtubedl_android.YoutubeDLException;
import com.yausername.youtubedl_android.YoutubeDLRequest;
import com.yausername.youtubedl_android.YoutubeDLResponse;
import kotlin.jvm.functions.Function3;
import kotlin.Unit;

import java.io.File;

@CapacitorPlugin(name = "YtDlpPlugin")
public class YtDlpPlugin extends Plugin {
    private static final String TAG = "YtDlpPlugin";
    private boolean isInitialized = false;

    @PluginMethod
    public void init(PluginCall call) {
        new Thread(() -> {
            try {
                Context context = getContext();
                YoutubeDL.getInstance().init(context);
                try {
                    YoutubeDL.getInstance().updateYoutubeDL(context, com.yausername.youtubedl_android.YoutubeDL.UpdateChannel._STABLE);
                } catch (Exception e) {
                    Log.w(TAG, "Failed to update youtube-dl, using bundled version", e);
                }
                isInitialized = true;
                call.resolve();
            } catch (Exception e) {
                Log.e(TAG, "Failed to initialize YoutubeDL", e);
                call.reject("Failed to initialize YoutubeDL", e);
            }
        }).start();
    }

    @PluginMethod
    public void extractAudioUrl(PluginCall call) {
        String videoId = call.getString("videoId");
        String format = call.getString("format", "251");

        if (videoId == null) {
            call.reject("Must provide videoId");
            return;
        }

        if (!isInitialized) {
            call.reject("Plugin not initialized");
            return;
        }

        new Thread(() -> {
            try {
                String videoUrl = "https://www.youtube.com/watch?v=" + videoId;
                YoutubeDLRequest request = new YoutubeDLRequest(videoUrl);
                request.addOption("-f", format);
                request.addOption("--print", "url");

                YoutubeDLResponse response = YoutubeDL.getInstance().execute(request);
                String url = response.getOut().trim();

                if (url.isEmpty()) {
                    call.reject("Could not extract URL");
                } else {
                    JSObject ret = new JSObject();
                    ret.put("url", url);
                    call.resolve(ret);
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to extract audio URL", e);
                call.reject("Failed to extract audio URL", e);
            }
        }).start();
    }

    @PluginMethod
    public void downloadAudio(PluginCall call) {
        String videoId = call.getString("videoId");
        String format = call.getString("format", "251");

        if (videoId == null) {
            call.reject("Must provide videoId");
            return;
        }

        if (!isInitialized) {
            call.reject("Plugin not initialized");
            return;
        }

        new Thread(() -> {
            try {
                Context context = getContext();
                // Save to private internal storage documents
                File docDir = context.getExternalFilesDir(android.os.Environment.DIRECTORY_DOCUMENTS);
                if (docDir == null) {
                    docDir = context.getFilesDir();
                }

                String fileName = videoId + ".%(ext)s";
                String destPath = new File(docDir, fileName).getAbsolutePath();

                String videoUrl = "https://www.youtube.com/watch?v=" + videoId;
                YoutubeDLRequest request = new YoutubeDLRequest(videoUrl);
                request.addOption("-f", format);
                request.addOption("-o", destPath);

                YoutubeDL.getInstance().execute(request, String.valueOf(videoId), new Function3<Float, Long, String, Unit>() {
                    @Override
                    public Unit invoke(Float progress, Long etaInSeconds, String line) {
                        JSObject ret = new JSObject();
                        ret.put("progress", progress);
                        ret.put("videoId", videoId);
                        notifyListeners("downloadProgress", ret);
                        return Unit.INSTANCE;
                    }
                });

                String ext = format.equals("251") ? "webm" : "m4a";
                String finalPath = new File(docDir, videoId + "." + ext).getAbsolutePath();

                JSObject ret = new JSObject();
                ret.put("filePath", finalPath);
                call.resolve(ret);

            } catch (Exception e) {
                Log.e(TAG, "Failed to download audio", e);
                call.reject("Failed to download audio", e);
            }
        }).start();
    }
}
