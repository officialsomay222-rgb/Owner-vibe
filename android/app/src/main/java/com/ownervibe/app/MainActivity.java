package com.ownervibe.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.ownervibe.app.plugins.YtDlpPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(YtDlpPlugin.class);
    }
}
