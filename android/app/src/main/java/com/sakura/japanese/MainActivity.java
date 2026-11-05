package com.sakura.japanese;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // 小组件深链白名单：只允许这两个路由（其余一律忽略，防外部注入）
    private static final String[] WIDGET_PATHS = { "/words/review", "/words/learn" };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SakuraNativePlugin.class);
        super.onCreate(savedInstanceState);
        handleWidgetIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleWidgetIntent(intent);
    }

    /**
     * 小组件点击进入应用后，把 Web 端 hash 路由切到目标页。
     * 冷启动时页面尚未加载完成，轮询等 document.readyState 变为 complete 再执行，
     * 幂等且只针对白名单路径。
     */
    private void handleWidgetIntent(Intent intent) {
        if (intent == null || bridge == null || bridge.getWebView() == null) return;
        final String path = intent.getStringExtra(SakuraWidgetProvider.EXTRA_PATH);
        if (path == null) return;
        boolean allowed = false;
        for (String p : WIDGET_PATHS) {
            if (p.equals(path)) {
                allowed = true;
                break;
            }
        }
        if (!allowed) return;

        bridge.getWebView().post(() -> {
            for (int i = 0; i < 8; i++) {
                final int attempt = i;
                bridge.getWebView().postDelayed(() -> {
                    if (bridge == null || bridge.getWebView() == null) return;
                    String js = "(function(){"
                            + "if(document.readyState!=='complete'){return false;}"
                            + "var t='" + path + "';"
                            + "if(window.location.hash!=='#'+t){window.location.hash=t;}"
                            + "return true;})();";
                    bridge.getWebView().evaluateJavascript(js, null);
                    // 尝试次数足够后停止
                    if (attempt >= 7) {
                        bridge.getWebView().evaluateJavascript(
                                "(function(){var t='" + path + "';"
                                        + "if(window.location.hash!=='#'+t){window.location.hash=t;}})();", null);
                    }
                }, 400L * i);
            }
        });
    }
}
