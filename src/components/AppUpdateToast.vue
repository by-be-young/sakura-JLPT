<template>
  <Transition name="upd-fade">
    <div v-if="show" class="upd-toast">
      <!-- 有新版本 -->
      <template v-if="state.phase === 'available'">
        <div class="upd-title">发现新版本 v{{ state.latest }}</div>
        <div class="upd-desc">当前版本 v{{ state.current }}，点击更新</div>
        <div class="upd-actions">
          <button class="upd-btn primary" @click="update">立即更新</button>
          <button class="upd-btn" @click="dismiss">稍后</button>
        </div>
      </template>

      <!-- 下载中 -->
      <template v-else-if="state.phase === 'downloading'">
        <div class="upd-title">正在下载更新…</div>
        <div class="upd-bar"><div class="upd-bar-inner" :style="{ width: state.progress + '%' }"></div></div>
        <div class="upd-desc">{{ state.progress }}%</div>
      </template>

      <!-- 下载完成 -->
      <template v-else-if="state.phase === 'downloaded'">
        <div class="upd-title">更新已就绪（v{{ state.latest }}）</div>
        <div class="upd-actions">
          <button class="upd-btn primary" @click="installNow">立即重启安装</button>
          <button class="upd-btn" @click="dismiss">稍后</button>
        </div>
      </template>

      <!-- 错误 -->
      <template v-else-if="state.phase === 'error'">
        <div class="upd-title">更新检查失败</div>
        <div class="upd-desc">{{ state.error }}</div>
        <div class="upd-actions">
          <button class="upd-btn" @click="dismiss">关闭</button>
        </div>
      </template>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useUpdater } from '../composables/useUpdater'

const { state, init, startDownload, installNow, dismiss } = useUpdater()

const show = computed(() => ['available', 'downloading', 'downloaded', 'error'].includes(state.phase))

const update = () => {
  if (state.platform === 'electron') {
    startDownload()
  } else {
    startDownload()
  }
}

onMounted(() => {
  // 延迟一点，避免抢占首屏
  setTimeout(init, 2500)
})
</script>

<style scoped>
.upd-toast {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9999;
  width: 300px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(255, 143, 191, 0.35);
  border: 1px solid #ffd9e8;
  padding: 14px 16px;
  font-family: -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
}
.upd-title { font-size: 14px; font-weight: 600; color: #b34a6f; margin-bottom: 4px; }
.upd-desc { font-size: 12px; color: #8a6a75; margin-bottom: 10px; }
.upd-actions { display: flex; gap: 8px; }
.upd-btn {
  flex: 1;
  padding: 6px 0;
  border: 1px solid #ffc3d8;
  border-radius: 8px;
  background: #fff;
  color: #b34a6f;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.upd-btn:hover { background: #fff5f8; }
.upd-btn.primary { background: #ff8fbf; border-color: #ff8fbf; color: #fff; }
.upd-btn.primary:hover { background: #ff7fb4; }
.upd-bar { height: 6px; background: #ffe3ef; border-radius: 3px; margin: 8px 0 4px; overflow: hidden; }
.upd-bar-inner { height: 100%; background: linear-gradient(90deg, #ff9ec6, #ff6fa8); border-radius: 3px; transition: width 0.3s; }
.upd-fade-enter-active, .upd-fade-leave-active { transition: opacity 0.25s, transform 0.25s; }
.upd-fade-enter-from, .upd-fade-leave-to { opacity: 0; transform: translateY(12px); }
</style>
