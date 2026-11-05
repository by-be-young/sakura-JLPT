package com.sakura.japanese;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * 樱花日语 · 桌面单词卡小组件（主包内置，P0）。
 *
 * 渲染逻辑：
 *  - 无快照 / 快照超过 24h：显示「打开应用同步」提示，点击打开应用；
 *  - 有快照：随机展示一个单词 —— 待复习池（tag=review）优先，其次未学池（tag=new），
 *    与前端 wordStore 的 isDueForReview 口径一致（错≥2 次或距上次复习≥2 天）；
 *  - 主区域点击：有待复习词 → /words/review，否则 → /words/learn；
 *  - 右上角 ↻ 按钮：原地换一个词（不打开应用）。
 */
public class SakuraWidgetProvider extends AppWidgetProvider {

    static final String ACTION_REFRESH = "com.sakura.japanese.WIDGET_REFRESH";
    static final String EXTRA_PATH = "sakura_path";
    static final long STALE_MS = 24L * 60 * 60 * 1000;

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            appWidgetManager.updateAppWidget(id, buildViews(context));
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_REFRESH.equals(intent.getAction())) {
            AppWidgetManager mgr = AppWidgetManager.getInstance(context);
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SakuraWidgetProvider.class));
            onUpdate(context, mgr, ids);
        }
    }

    private RemoteViews buildViews(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_word);
        String path = "/";
        String footer = "";

        Snapshot snap = readSnapshot(context);
        if (snap == null) {
            views.setTextViewText(R.id.widget_word, "🌸");
            views.setTextViewText(R.id.widget_kana, "打开应用同步");
            views.setTextViewText(R.id.widget_meaning, "长按编辑 · 添加单词卡片");
            views.setViewVisibility(R.id.widget_badge, View.GONE);
            views.setViewVisibility(R.id.widget_refresh, View.GONE);
            footer = "点击打开樱花日语";
        } else if (snap.stale) {
            views.setTextViewText(R.id.widget_word, "🌸");
            views.setTextViewText(R.id.widget_kana, "数据超过 24 小时未更新");
            views.setTextViewText(R.id.widget_meaning, "打开应用同步最新进度");
            views.setViewVisibility(R.id.widget_badge, View.GONE);
            views.setViewVisibility(R.id.widget_refresh, View.GONE);
            footer = "点击打开樱花日语";
        } else {
            Word w = pickWord(snap);
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
                views.setViewVisibility(R.id.widget_refresh, View.VISIBLE);
                path = snap.dueCount > 0 ? "/words/review" : "/words/learn";
                footer = snap.dueCount > 0
                        ? "还有 " + snap.dueCount + " 个待复习"
                        : "未学 " + snap.newCount + " 个 · 点击开始";
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

        // ↻ 换一个：仅重绘组件，不打开应用
        Intent refresh = new Intent(context, SakuraWidgetProvider.class).setAction(ACTION_REFRESH);
        PendingIntent refreshPi = PendingIntent.getBroadcast(
                context, 1, refresh,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_refresh, refreshPi);
        return views;
    }

    private Word pickWord(Snapshot s) {
        List<Word> review = new ArrayList<>();
        List<Word> fresh = new ArrayList<>();
        for (JSONObject o : s.pool) {
            Word w = new Word();
            w.kanji = o.optString("kanji", "");
            w.kana = o.optString("kana", "");
            w.meaning = o.optString("meaning", "");
            w.tag = o.optString("tag", "new");
            if ("review".equals(w.tag)) review.add(w);
            else fresh.add(w);
        }
        Random r = new Random();
        if (!review.isEmpty()) return review.get(r.nextInt(review.size()));
        if (!fresh.isEmpty()) return fresh.get(r.nextInt(fresh.size()));
        return null;
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
            s.dueCount = root.optInt("dueCount", 0);
            s.newCount = root.optInt("newCount", 0);
            long generated = root.optLong("generatedAt", 0);
            s.stale = generated <= 0 || (System.currentTimeMillis() - generated) > STALE_MS;
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
        int dueCount;
        int newCount;
        final List<JSONObject> pool = new ArrayList<>();
    }
}
