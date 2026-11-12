package com.sakura.japanese;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * 樱花日语 · 桌面单词卡小组件（主包内置）。
 *
 * 渲染逻辑：
 *  - 无快照：显示「打开应用同步」，点击打开应用；
 *  - 有快照：按池内顺序轮换展示一个单词 —— 待复习池（tag=review）在前，其次未学池（tag=new），
 *    词池由前端按「当前难度」生成；
 *  - 右上角 ↻：切到池内下一个词（advance），完全不打开应用；
 *    数据超过 24h 依然可以换词，只在页脚标注「N 天前同步」；
 *  - 系统周期刷新（updatePeriodMillis）：只重绘当前词，不推进游标；
 *  - 主区域点击：有待复习词 → /words/review，否则 → /words/learn。
 */
public class SakuraWidgetProvider extends AppWidgetProvider {

    static final String ACTION_REFRESH = "com.sakura.japanese.WIDGET_REFRESH";
    static final String EXTRA_PATH = "sakura_path";
    static final long STALE_MS = 24L * 60 * 60 * 1000;

    private static final String PREFS = "sakura_widget_state";
    private static final String KEY_CURSOR = "cursor_";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            appWidgetManager.updateAppWidget(id, buildViews(context, id, false));
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager mgr, int appWidgetId, Bundle newOptions) {
        // 桌面拉伸 / 换网格后按新尺寸重绘
        mgr.updateAppWidget(appWidgetId, buildViews(context, appWidgetId, false));
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_REFRESH.equals(intent.getAction())) {
            AppWidgetManager mgr = AppWidgetManager.getInstance(context);
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SakuraWidgetProvider.class));
            for (int id : ids) {
                mgr.updateAppWidget(id, buildViews(context, id, true));
            }
        }
    }

    private RemoteViews buildViews(Context context, int widgetId, boolean advance) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_word);
        String path = "/";
        String footer = "";

        Snapshot snap = readSnapshot(context);
        boolean supported = SakuraNativePlugin.isWidgetSupportedDevice();
        if (!supported) {
            views.setTextViewText(R.id.widget_word, "🌸");
            views.setTextViewText(R.id.widget_kana, "本机暂未适配小组件");
            views.setTextViewText(R.id.widget_meaning, "设置页可查看支持的品牌");
            views.setViewVisibility(R.id.widget_badge, View.GONE);
            views.setViewVisibility(R.id.widget_refresh, View.GONE);
            footer = "点击打开樱花日语";
        } else if (snap == null) {
            views.setTextViewText(R.id.widget_word, "🌸");
            views.setTextViewText(R.id.widget_kana, "打开应用同步");
            views.setTextViewText(R.id.widget_meaning, "长按编辑 · 添加单词卡片");
            views.setViewVisibility(R.id.widget_badge, View.GONE);
            views.setViewVisibility(R.id.widget_refresh, View.GONE);
            footer = "点击打开樱花日语";
        } else if (snap.pool.isEmpty()) {
            views.setTextViewText(R.id.widget_word, "🌸");
            views.setTextViewText(R.id.widget_kana, snap.level + " 级暂无待练单词");
            views.setTextViewText(R.id.widget_meaning, "去背词页开始学习");
            views.setViewVisibility(R.id.widget_badge, View.GONE);
            views.setViewVisibility(R.id.widget_refresh, View.GONE);
            path = "/words/learn";
            footer = snap.level + " 级 · 点击去背词";
        } else {
            Word w = pickWord(context, widgetId, snap, advance);
            if (w == null) {
                views.setTextViewText(R.id.widget_word, "🌸");
                views.setTextViewText(R.id.widget_kana, "暂无单词");
                views.setTextViewText(R.id.widget_meaning, "去背词页添加新词");
                views.setViewVisibility(R.id.widget_badge, View.GONE);
                views.setViewVisibility(R.id.widget_refresh, View.GONE);
                path = "/words/learn";
                footer = "点击去背词";
            } else {
                views.setTextViewText(R.id.widget_word, w.kanji);
                views.setTextViewText(R.id.widget_kana, w.kana);
                views.setTextViewText(R.id.widget_meaning, w.meaning);
                views.setTextViewText(R.id.widget_badge, "review".equals(w.tag) ? "待复习" : "新词");
                views.setInt(R.id.widget_badge, "setBackgroundResource",
                        "review".equals(w.tag) ? R.drawable.widget_badge_review : R.drawable.widget_badge_new);
                views.setViewVisibility(R.id.widget_badge, View.VISIBLE);
                // ↻ 常驻：数据过期时也能在桌面换词，不必打开应用
                views.setViewVisibility(R.id.widget_refresh, View.VISIBLE);
                path = snap.dueCount > 0 ? "/words/review" : "/words/learn";
                footer = buildFooter(snap, w);
            }
        }
        views.setTextViewText(R.id.widget_footer, footer);

        // 主区域点击：打开应用并深链到对应页面
        Intent app = new Intent(context, MainActivity.class);
        app.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        app.putExtra(EXTRA_PATH, path);
        PendingIntent openPi = PendingIntent.getActivity(
                context, 0, app,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, openPi);

        // ↻ 换下一个：仅重绘组件，不打开应用
        Intent refresh = new Intent(context, SakuraWidgetProvider.class).setAction(ACTION_REFRESH);
        PendingIntent refreshPi = PendingIntent.getBroadcast(
                context, 1, refresh,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_refresh, refreshPi);
        return views;
    }

    /** 页脚：难度 · 进度 · （过期时）同步时间 */
    private String buildFooter(Snapshot s, Word w) {
        String level = s.level == null || s.level.isEmpty() ? "" : s.level + " · ";
        String progress = s.dueCount > 0
                ? "还有 " + s.dueCount + " 个待复习"
                : "未学 " + s.newCount + " 个";
        if (!s.stale) return level + progress;
        long days = s.ageMs / (24L * 60 * 60 * 1000);
        long hours = s.ageMs / (60L * 60 * 1000);
        String sync = days >= 1 ? days + " 天前同步" : Math.max(1, hours) + " 小时前同步";
        return level + progress + " · " + sync;
    }

    /**
     * 池内顺序轮换取词：advance=true 时前进一位（↻ 按钮），false 时保持当前位（系统重绘）。
     * 游标按 appWidgetId 存 SharedPreferences；池长度变化或越界时回到第 0 个。
     */
    private Word pickWord(Context context, int widgetId, Snapshot s, boolean advance) {
        List<Word> ordered = new ArrayList<>();
        for (JSONObject o : s.pool) {
            Word w = new Word();
            w.kanji = o.optString("kanji", "");
            w.kana = o.optString("kana", "");
            w.meaning = o.optString("meaning", "");
            w.tag = o.optString("tag", "new");
            ordered.add(w);
        }
        int n = ordered.size();
        if (n == 0) return null;

        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int cur = sp.getInt(KEY_CURSOR + widgetId, -1);
        int next;
        if (cur < 0 || cur >= n) {
            next = 0;
        } else if (advance) {
            next = (cur + 1 >= n) ? 0 : cur + 1;
        } else {
            next = cur;
        }
        sp.edit().putInt(KEY_CURSOR + widgetId, next).apply();
        return ordered.get(next);
    }

    private Snapshot readSnapshot(Context context) {
        try {
            File f = new File(context.getFilesDir(), SakuraNativePlugin.SNAPSHOT_FILE);
            if (!f.exists()) return null;
            byte[] buf = new byte[(int) f.length()];
            try (FileInputStream in = new FileInputStream(f)) {
                int off = 0;
                while (off < buf.length) {
                    int n = in.read(buf, off, buf.length - off);
                    if (n < 0) break;
                    off += n;
                }
            }
            JSONObject root = new JSONObject(new String(buf, 0, buf.length, StandardCharsets.UTF_8));
            Snapshot s = new Snapshot();
            s.level = root.optString("level", "");
            s.dueCount = root.optInt("dueCount", 0);
            s.newCount = root.optInt("newCount", 0);
            long generated = root.optLong("generatedAt", 0);
            s.ageMs = generated <= 0 ? Long.MAX_VALUE : Math.max(0L, System.currentTimeMillis() - generated);
            s.stale = generated <= 0 || s.ageMs > STALE_MS;
            JSONArray arr = root.optJSONArray("pool");
            if (arr != null) {
                for (int i = 0; i < arr.length(); i++) {
                    s.pool.add(arr.getJSONObject(i));
                }
            }
            return s;
        } catch (Exception e) {
            return null;
        }
    }

    static class Word {
        String kanji;
        String kana;
        String meaning;
        String tag;
    }

    static class Snapshot {
        boolean stale;
        long ageMs;
        String level = "";
        int dueCount;
        int newCount;
        final List<JSONObject> pool = new ArrayList<>();
    }
}
