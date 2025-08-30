<template>
  <div class="p-4 tree-container">
    <TreeNode 
      v-if="data"
      :key-name="null"
      :value="data"
      :path="[]"
      :depth="0"
      :is-open="true"
      @node-select="$emit('node-select', $event)"
    />
    <div v-else class="text-center text-base-content/50 py-8">
      No data loaded. Please open a JSON file.
    </div>
  </div>
</template>

<script setup>

import TreeNode from './TreeNode.vue'

defineProps({
  data: {
    type: [Object, Array, String, Number, Boolean],
    default: null
  }
})

defineEmits(['node-select'])
</script>

<style scoped>
.tree-container {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 0.95rem;
  line-height: 1.35rem;
}
</style>
