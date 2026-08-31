<template>
  <div class="note-modal">
    <div class="note-modal-content">
      <h3>📝 为「{{ word.kanji || word.kana }}」添加笔记</h3>
      <textarea v-model="text" rows="4" placeholder="记录记忆技巧、易混淆点、例句等..."></textarea>
      <div class="modal-actions">
        <button class="btn btn-ghost" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
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
</script>

<style scoped>
.note-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.note-modal-content {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  width: 90%;
  max-width: 440px;
}
.note-modal-content h3 { color: #c2556f; margin-top: 0; }
.note-modal-content textarea {
  width: 100%;
  box-sizing: border-box;
  border: 2px solid #ffd3e0;
  border-radius: 12px;
  padding: 10px;
  font-size: 15px;
  font-family: inherit;
  resize: vertical;
}
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
