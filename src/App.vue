<template>
  <div ref="appContainer" class="min-h-screen bg-base-100">
    <!-- Header -->
    <header v-if="!isFullscreen" class="sticky top-0 z-30 backdrop-blur-sm bg-base-100/90 border-b border-neutral">
      <div class="navbar px-4">
        <div class="navbar-start">
          <h1 class="text-xl font-bold text-primary">USDM Viewer</h1>
        </div>
        
        <div class="navbar-center">
          <div class="tabs tabs-boxed bg-base-200">
            <button 
              class="tab" 
              :class="{ 'tab-active': activeTab === 'tree' }"
              @click="activeTab = 'tree'"
            >
              Tree
            </button>
            <button 
              class="tab" 
              :class="{ 'tab-active': activeTab === 'mindmap' }"
              @click="activeTab = 'mindmap'"
            >
              Mind-map
            </button>
          </div>
        </div>
        
        <div class="navbar-end gap-2">
          <label class="btn btn-primary btn-sm">
            📂 Open JSON
            <input 
              ref="fileInput"
              type="file" 
              accept=".json,.jsonl,application/json" 
              class="hidden"
              @change="handleFileLoad"
            />
          </label>
          <button class="btn btn-outline btn-sm" @click="resetToFull">
            Reset to full
          </button>
        </div>
      </div>
    </header>

    <!-- Main Layout -->
    <div :class="[
      'flex gap-4 p-4',
      isFullscreen ? 'h-screen' : 'h-[calc(100vh-80px)]'
    ]">
      <!-- Sidebar -->
      <aside v-if="!isFullscreen" class="w-96 bg-base-200 rounded-lg border border-neutral overflow-hidden flex flex-col">
        <!-- Filter Section -->
        <div class="p-4 border-b border-neutral">
          <h3 class="font-bold text-secondary mb-3">Filter key study objects</h3>
          
          <div class="space-y-3">
            <div class="text-sm text-base-content/70">1. Search for specific keys:</div>
            <div class="join w-full">
              <input 
                v-model="keyFilter"
                type="text" 
                placeholder="Filter by key (e.g., arms)"
                class="input input-bordered input-sm join-item flex-1"
                @keyup.enter="applyKeyFilter"
              />
              <button class="btn btn-primary btn-sm join-item" @click="applyKeyFilter">
                Apply
              </button>
            </div>
            
            <div class="text-sm text-base-content/70">2. Or click common study elements:</div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="key in commonKeys"
                :key="key"
                @click="selectCommonKey(key)"
                :aria-label="`Filter by ${key}`"
                :class="[
                  'btn btn-sm rounded-full normal-case px-4 shadow-sm transition-all cursor-pointer',
                  keyFilter === key
                    ? 'btn-primary shadow-md'
                    : 'btn-outline border-base-300 text-base-content/90 hover:border-primary hover:bg-primary/10 hover:text-primary'
                ]"
              >
                {{ key }}
              </button>
            </div>
          </div>
        </div>

        <!-- Mind-map Controls -->
        <div class="p-4">
          <h3 class="font-bold text-secondary mb-3">Hierarchical Mind-map</h3>
          <div class="text-sm text-base-content/70 mb-3">Display mode:</div>
          <div class="space-y-2">
            <button 
              class="btn btn-sm w-full"
              :class="mindmapMode === 'everything' ? 'btn-primary' : 'btn-outline'"
              @click="mindmapMode = 'everything'"
            >
              All Fields
            </button>
            <button 
              class="btn btn-sm w-full"
              :class="mindmapMode === 'nameDescOnly' ? 'btn-primary' : 'btn-outline'"
              @click="mindmapMode = 'nameDescOnly'"
            >
              📝 Name/Description/Text Only
            </button>
          </div>
          
          <div class="mt-4 p-3 bg-base-300 rounded-lg">
            <div class="text-xs font-semibold mb-2">🗺️ Navigation</div>
            <ul class="text-xs space-y-1 text-base-content/70">
              <li>• <strong>Level 1:</strong> Click + to expand children</li>
              <li>• <strong>Level 2:</strong> Click node to drill down</li>
              <li>• <strong>Level 3:</strong> Click to navigate deeper</li>
              <li>• Use breadcrumbs to navigate back</li>
              <li>• Home button returns to root</li>
            </ul>
          </div>
          
          
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 bg-base-200 rounded-lg border border-neutral overflow-hidden flex flex-col">
        <div class="p-4 border-b border-neutral flex justify-between items-center">
          <h2 class="font-bold text-secondary">Viewer</h2>
          <button 
            class="btn btn-sm btn-ghost"
            @click="toggleFullScreen"
            :title="isFullscreen ? 'Exit Full Screen' : 'Full Screen'"
          >
            <svg v-if="isFullscreen" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 14h6m0 0v6m0-6l-7 7m17-11h-6m0 0V4m0 6l7-7"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
            </svg>
          </button>
        </div>

        <!-- Tree View -->
        <div v-if="activeTab === 'tree'" class="flex-1 overflow-auto">
          <TreeView 
            :data="currentData" 
            @node-select="handleNodeSelect"
          />
        </div>

        <!-- Mind-map View -->
        <div v-if="activeTab === 'mindmap'" class="flex-1 overflow-auto">
          <HierarchicalMindMap 
            :data="currentData" 
            :mode="mindmapMode"
            @node-select="handleNodeSelect"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import TreeView from './components/TreeView.vue'
import HierarchicalMindMap from './components/HierarchicalMindMap.vue'

// Reactive state
const activeTab = ref('tree')
const keyFilter = ref('')
const mindmapMode = ref('everything')
const fileInput = ref(null)
const isFullscreen = ref(false)
const appContainer = ref(null)

const toggleFullScreen = async () => {
  try {
    if (!isFullscreen.value) {
      await appContainer.value.requestFullscreen()
      isFullscreen.value = true
    } else {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      isFullscreen.value = false
    }
  } catch (err) {
    console.error('Error toggling fullscreen:', err)
  }
}

// Listen for fullscreen change events
onMounted(() => {
  const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement
  }
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  return () => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }
})

// Data state
const rootData = ref(null)
const currentData = ref(null)
const selectedNode = reactive({ path: null, value: null })

// Common study elements
const commonKeys = [
  'arms', 'studyDesigns', 'epochs', 'encounters', 
  'activities', 'elements', 'endpoints', 'biomedicalConcepts',
  'eligibilityCriteria', 'objectives'
]

// Initialize with sample data
onMounted(() => {
  const sampleData = {
    study: {
      id: "Study_000001",
      versions: [{
        studyDesigns: [{
          arms: [
            { id: "Arm_1", name: "A" },
            { id: "Arm_2", name: "B" }
          ],
          epochs: [
            { id: "E1" },
            { id: "E2" }
          ]
        }]
      }]
    }
  }
  
  rootData.value = sampleData
  currentData.value = sampleData
})

// Watch for mindmap mode changes
watch(mindmapMode, () => {
  // Trigger re-render of mindmap when mode changes
  if (activeTab.value === 'mindmap') {
    // Force reactivity update
    currentData.value = { ...currentData.value }
  }
})

// File handling
const handleFileLoad = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      rootData.value = data
      currentData.value = data
      // Reset file input
      event.target.value = ''
    } catch (error) {
      alert('Invalid JSON: ' + error.message)
      event.target.value = ''
    }
  }
  reader.readAsText(file)
}

// Drag and drop support
onMounted(() => {
  const handleDragOver = (e) => e.preventDefault()
  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        rootData.value = data
        currentData.value = data
      } catch (error) {
        alert('Invalid JSON: ' + error.message)
      }
    }
    reader.readAsText(file)
  }

  window.addEventListener('dragover', handleDragOver)
  window.addEventListener('drop', handleDrop)

  // Cleanup
  return () => {
    window.removeEventListener('dragover', handleDragOver)
    window.removeEventListener('drop', handleDrop)
  }
})

// Key filtering
const collectByKey = (obj, key, results = []) => {
  if (Array.isArray(obj)) {
    for (const item of obj) {
      collectByKey(item, key, results)
    }
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (k === key) {
        results.push(v)
      }
      collectByKey(v, key, results)
    }
  }
  return results
}

const applyKeyFilter = () => {
  const key = keyFilter.value.trim()
  if (!key) {
    alert('Enter a key name')
    return
  }
  
  if (!rootData.value) {
    alert('No data loaded')
    return
  }

  const results = collectByKey(rootData.value, key)
  currentData.value = results.length === 1 ? results[0] : results
}

const selectCommonKey = (key) => {
  keyFilter.value = key
  applyKeyFilter()
}

const resetToFull = () => {
  if (rootData.value) {
    currentData.value = rootData.value
    keyFilter.value = ''
  }
}

const handleNodeSelect = (node) => {
  selectedNode.path = node.path
  selectedNode.value = node.value
  // Optionally subset to selected node
  // currentData.value = node.value
}
</script>
