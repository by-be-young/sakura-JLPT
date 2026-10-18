<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="modal-card note-modal-card" role="dialog" aria-modal="true" aria-labelledby="word-note-title">
      <div class="modal-head">
        <h3 id="word-note-title" class="modal-title">
          <span class="note-emoji" aria-hidden="true">📝</span>
          <span class="note-title-text">为「{{ word.kanji || word.kana }}」添加笔记</span>
        </h3>
        <button class="modal-close" @click="$emit('close')" title="关闭 (Esc)" aria-label="关闭笔记弹窗">✕</button>
      </div>
      <p class="note-sub">{{ word.kana }}<template v-if="word.meaning"> · {{ word.meaning }}</template></p>
      <textarea v-model="text" rows="5" placeholder="记录记忆技巧、易混淆点、例句等..." aria-label="单词笔记内容"></textarea>
      <div class="note-meta">
        <span>保存后可在单词卡片的「编辑笔记」中查看</span>
        <span class="note-count">{{ text.length }} 字</span>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useWordStore } from '../../store/wordStore'

const props = defineProps({
  word: { type: Object, required: true },
})
const emit = defineEmits(['close', 'saved'])
const store = useWordStore()
const text = ref(store.getNote(props.word.id))

function save() {
  store.setNote(props.word.id, text.value)
  emit('saved')
  emit('close')
}

function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.note-modal-card {
  display: flex;
  flex-direction: column;
}
.modal-head {
  align-items: flex-start;
  margin-bottom: 10px;
}
.modal-close {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}
.modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  line-height: 1.45;
}
.note-emoji {
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
}
.note-title-text {
  min-width: 0;
  overflow-wrap: anywhere;
}
.note-sub {
  margin: 0 0 14px;
  font-size: 12.5px;
  color: var(--text-light);
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.note-modal-card textarea {
  width: 100%;
  min-height: 132px;
  box-sizing: border-box;
  padding: 13px 14px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--text);
  font-size: 15px;
  line-height: 1.75;
  font-family: inherit;
  resize: vertical;
  transition: border-color var(--dur-2), box-shadow var(--dur-2);
}
.note-modal-card textarea::placeholder { color: var(--text-faint); }
.note-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  font-size: 11.5px;
  color: var(--text-faint);
}
.note-count {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 18px;
}
.modal-actions .btn {
  min-width: 96px;
  min-height: 44px;
}
@media (max-width: 640px) {
  .modal-actions .btn { flex: 1; }
}
</style>
