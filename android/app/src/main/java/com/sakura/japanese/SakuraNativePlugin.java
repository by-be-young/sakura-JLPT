package com.sakura.japanese;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

/**
 * 樱花日语 · 本地原生桥（主包内置，P0）。
 *
 * 能力：
 *  - getDeviceInfo     荣耀设备判定（BRAND/MANUFACTURER == HONOR 或指纹 HONOR/ 前缀），
 *                      老荣耀（HUAWEI 品牌字段）默认不兼容；
 *  - writeSnapshot     把背词快照写入应用私有目录 widget_snapshot.json，并触发组件刷新；
 *  - readSnapshot      读取快照（供前端调试/展示）；
 *  - updateWidget      主动刷新桌面小组件；
 *  - setSystemBarsHidden 沉浸式隐藏系统状态栏（API 30+ 用 InsetsController，低版本用系统 UI 标志）。
 */
@CapacitorPlugin(name = "SakuraNative")
public class SakuraNativePlugin extends Plugin {

    static final String SNAPSHOT_FILE = "widget_snapshot.json";

    static boolean isHonorDevice() {
        String brand = Build.BRAND == null ? "" : Build.BRAND;
        String mfg = Build.MANUFACTURER == null ? "" : Build.MANUFACTURER;
        String fp = Build.FINGERPRINT == null ? "" : Build.FINGERPRINT;
        return brand.equalsIgnoreCase("HONOR")
                || mfg.equalsIgnoreCase("HONOR")
                || fp.startsWith("HONOR/");
    }

    @PluginMethod
    public void getDeviceInfo(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("brand", Build.BRAND);
        ret.put("manufacturer", Build.MANUFACTURER);
        ret.put("model", Build.MODEL);
        ret.put("fingerprint", Build.FINGERPRINT);
        ret.put("isHonor", isHonorDevice());
        ret.put("platform", "android");
        call.resolve(ret);
    }

    @PluginMethod
    public void writeSnapshot(PluginCall call) {
        String json = call.getString("json");
        if (json == null || json.isEmpty()) {
            call.reject("json is required");
            return;
        }
        try {
            File f = new File(getContext().getFilesDir(), SNAPSHOT_FILE);
            try (FileOutputStream out = new FileOutputStream(f)) {
                out.write(json.getBytes(StandardCharsets.UTF_8));
            }
            requestWidgetUpdate(getContext());
            JSObject ret = new JSObject();
            ret.put("ok", true);
            ret.put("path", f.getAbsolutePath());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("writeSnapshot failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void readSnapshot(PluginCall call) {
        try {
            File f = new File(getContext().getFilesDir(), SNAPSHOT_FILE);
            if (!f.exists()) {
                call.resolve(new JSObject().put("snapshot", (String) null));
                return;
            }
            byte[] buf = new byte[(int) f.length()];
            try (FileInputStream in = new FileInputStream(f)) {
                int off = 0;
                while (off < buf.length) {
                    int n = in.read(buf, off, buf.length - off);
                    if (n < 0) break;
                    off += n;
                }
                call.resolve(new JSObject().put("snapshot", new String(buf, 0, off, StandardCharsets.UTF_8)));
            }
        } catch (Exception e) {
            call.reject("readSnapshot failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void updateWidget(PluginCall call) {
        requestWidgetUpdate(getContext());
        call.resolve();
    }

    /** 通知 AppWidgetProvider 立即重绘（快照已更新的场景）。 */
    static void requestWidgetUpdate(Context context) {
        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(context);
            ComponentName provider = new ComponentName(context, SakuraWidgetProvider.class);
            int[] ids = mgr.getAppWidgetIds(provider);
            if (ids == null || ids.length == 0) return;
            Intent upd = new Intent(context, SakuraWidgetProvider.class);
            upd.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            upd.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            context.sendBroadcast(upd);
        } catch (Exception ignored) {
            // 组件未添加 / 系统拒绝广播时静默
        }
    }

    @PluginMethod
    public void setSystemBarsHidden(PluginCall call) {        boolean hidden = call.getBoolean("hidden", true);
        try {
            final Window window = getActivity().getWindow();
            window.getDecorView().post(() -> {
                if (Build.VERSION.SDK_INT >= 30) {
                    WindowInsetsController c = window.getInsetsController();
                    if (c != null) {
                        if (hidden) {
                            c.hide(WindowInsets.Type.statusBars());
                            c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                        } else {
                            c.show(WindowInsets.Type.statusBars());
                        }
                    }
                } else {
                    if (hidden) {
                        window.getDecorView().setSystemUiVisibility(
                                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                        | View.SYSTEM_UI_FLAG_FULLSCREEN);
                    } else {
                        window.getDecorView().setSystemUiVisibility(
                                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
                    }
                }
            });
            call.resolve();
        } catch (Exception e) {
            call.reject("setSystemBarsHidden failed: " + e.getMessage());
        }
    }
}
