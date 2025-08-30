<template>
  <div class="tree-node">
    <!-- Node row -->
    <div 
      class="flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-base-300/50"
      :class="{ 'tree-selected bg-base-300': isSelected }"
      @click="selectNode"
    >
      <!-- Twisty -->
      <button 
        v-if="hasChildren"
        class="tree-twisty"
        @click.stop="toggleOpen"
      >
        {{ isOpen ? '−' : '+' }}
      </button>
      <div v-else class="w-4"></div>

      <!-- Key -->
      <span v-if="keyName !== null" class="tree-key">
        {{ JSON.stringify(keyName) }}
      </span>
      
      <!-- Colon -->
      <span v-if="keyName !== null" class="tree-colon">:</span>
      
      <!-- Value -->
      <span :class="valueClass">
        <template v-if="isPrimitive">
          {{ JSON.stringify(value) }}
        </template>
        <template v-else-if="Array.isArray(value)">
          <span class="tree-meta">[{{ value.length }}]</span>
        </template>
        <template v-else>
          <span class="tree-meta">{{ '{' + Object.keys(value || {}).length + '}' }}</span>
        </template>
      </span>
    </div>

    <!-- Children -->
    <div v-if="isOpen && hasChildren" class="tree-children">
      <template v-if="Array.isArray(value)">
        <TreeNode
          v-for="(item, index) in value"
          :key="`${path.join('.')}.${index}`"
          :key-name="index"
          :value="item"
          :path="[...path, index]"
          :depth="depth + 1"
          :is-open="depth < 1"
          @node-select="$emit('node-select', $event)"
        />
      </template>
      <template v-else>
        <TreeNode
          v-for="[key, val] in Object.entries(value || {})"
          :key="`${path.join('.')}.${key}`"
          :key-name="key"
          :value="val"
          :path="[...path, key]"
          :depth="depth + 1"
          :is-open="depth < 1"
          @node-select="$emit('node-select', $event)"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  keyName: {
    type: [String, Number],
    default: null
  },
  value: {
    type: [Object, Array, String, Number, Boolean],
    default: null
  },
  path: {
    type: Array,
    required: true
  },
  depth: {
    type: Number,
    default: 0
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['node-select'])

const isOpenState = ref(props.isOpen)
const isSelected = ref(false)

const isPrimitive = computed(() => {
  return props.value === null || typeof props.value !== 'object'
})

const hasChildren = computed(() => {
  if (isPrimitive.value) return false
  if (Array.isArray(props.value)) return props.value.length > 0
  return Object.keys(props.value || {}).length > 0
})

const valueClass = computed(() => {
  if (props.value === null) return 'tree-value-null'
  const type = typeof props.value
  if (type === 'number') return 'tree-value-number'
  if (type === 'boolean') return 'tree-value-boolean'
  if (type === 'string') return 'tree-value-string'
  return 'tree-value-object'
})

const toggleOpen = () => {
  isOpenState.value = !isOpenState.value
}

const selectNode = () => {
  isSelected.value = true
  emit('node-select', {
    path: props.path,
    value: props.value,
    keyName: props.keyName
  })
  
  // Reset other selections (this is a simple approach)
  // In a more complex app, you'd use a store or parent state management
  setTimeout(() => {
    const allNodes = document.querySelectorAll('.tree-node')
    allNodes.forEach(node => {
      const nodeElement = node.querySelector('.tree-selected')
      if (nodeElement && nodeElement !== event.currentTarget) {
        nodeElement.classList.remove('tree-selected')
      }
    })
  }, 0)
}

// Computed property for open state
const isOpen = computed(() => isOpenState.value)
</script>
