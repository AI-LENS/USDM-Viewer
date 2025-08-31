<template>
  <div class="hierarchical-mindmap">
    <!-- Top Controls Bar -->
    <div class="absolute top-2 left-2 right-2 z-10 flex justify-between items-center">
      <!-- Left: Navigation Controls -->
      <div class="flex gap-2">
        <button 
          class="btn btn-xs btn-primary"
          @click="resetView"
          title="Reset to Root"
        >
          🏠 Home
        </button>
        <button 
          class="btn btn-xs btn-secondary"
          @click="goBack"
          :disabled="!canGoBack"
          title="Go Back"
        >
          ← Back
        </button>
      </div>

      <!-- Center: Breadcrumb Navigation -->
      <div class="bg-base-200/90 backdrop-blur-sm rounded px-3 py-1 border border-neutral">
        <div class="breadcrumbs text-xs">
          <ul>
            <li>
              <button class="link link-primary text-xs" @click="navigateToPath([])">
                🏠 Root
              </button>
            </li>
            <li v-for="(segment, index) in currentPath" :key="index">
              <button 
                class="link link-secondary text-xs" 
                @click="navigateToPath(currentPath.slice(0, index + 1))"
              >
                {{ segment }}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Right: Zoom controls + Info -->
      <div class="flex items-center gap-2">
        <div class="join">
          <button class="btn btn-xs join-item" @click="zoomOut">−</button>
          <button class="btn btn-xs join-item" @click="resetZoom">100%</button>
          <button class="btn btn-xs join-item" @click="zoomIn">+</button>
        </div>
        <div class="text-xs text-base-content/70 ml-2">Click nodes with → to drill down</div>
      </div>
    </div>

    <!-- Main SVG Container -->
    <div 
      ref="containerRef" 
      class="w-full h-full bg-gradient-to-r from-base-300 to-base-200 rounded-lg overflow-auto pt-12"
    >
      <svg 
        ref="svgRef"
        class="min-w-[1400px] min-h-[900px]"
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
      >
        <defs>
          <!-- Subtle grid background -->
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="transparent" />
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
          </pattern>

          
          <!-- Gradient for connections -->
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" :stop-color="theme.primary" stop-opacity=".9" />
            <stop offset="100%" :stop-color="theme.secondary" stop-opacity=".5" />
          </linearGradient>
          
          <!-- Drop shadow -->
          <filter id="dropshadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.2"/>
          </filter>

          <!-- (removed gloss to match pill-like clean style) -->
        </defs>
        
        <!-- Background grid -->
        <rect :width="svgWidth" :height="svgHeight" fill="url(#grid)" opacity="0.9" />
        
        <!-- Zoomable content wrapper -->
        <g class="mindmap-content">
          <!-- Connections -->
          <g class="connections">
            <path 
              v-for="connection in connections" 
              :key="connection.id"
              :d="connection.path"
              stroke="url(#connectionGradient)"
              stroke-width="2"
              fill="none"

              class="connection-line"
            />
          </g>
          
          <!-- Nodes -->
          <g class="nodes">
          <g 
            v-for="node in visibleNodes" 
            :key="node.id"
            :transform="`translate(${node.x}, ${node.y})`"
            class="node-group"
            :class="{ 'node-expandable': node.hasChildren }"
            @click="handleNodeClick(node)"
            @mouseenter="handleNodeHover(node, true)"
            @mouseleave="handleNodeHover(node, false)"
          >
            <!-- Hover focus ring -->
            <rect
              v-if="node.isHovered"
              :x="-4"
              :y="-4"
              :width="node.width + 8"
              :height="node.height + 8"
              rx="12"
              ry="12"
              :fill="'none'"
              :stroke="theme.primary"
              stroke-width="1.5"
              opacity="0.6"
            />
            <!-- Node Background -->
            <rect
              :width="node.width"
              :height="node.height"
              :rx="16"
              :ry="16"
              :fill="getNodeColor(node)"
              :stroke="node.isHovered ? theme.accent : getNodeBorderColor(node)"
              :stroke-width="2"
              class="node-rect"
            />
            
            <!-- Drill-down indicator for expandable nodes -->
            <circle
              v-if="node.hasChildren && node.level > 0"
              :cx="node.width - 15"
              :cy="15"
              r="8"
              :fill="theme.primary"
              stroke="#ffffff"
              stroke-width="1"
              class="drill-indicator"
            />
            
            <!-- Drill-down icon -->
            <text
              v-if="node.hasChildren && node.level > 0"
              :x="node.width - 15"
              :y="15"
              text-anchor="middle"
              dominant-baseline="central"
              fill="#ffffff"
              font-size="10"
              font-weight="bold"
              class="drill-icon"
            >
              →
            </text>
            
            <!-- Native tooltip -->
            <title>{{ node.label }} — {{ node.typeLabel }}</title>

            <!-- Node Label and Value -->
            <text
              :x="8"
              :y="24"
              :fill="getNodeTextColor(node)"
              font-size="12"
              class="node-label"
            >
              <tspan font-weight="600">{{ truncateText(node.label, 12) }}</tspan>
              <tspan v-if="node.type === 'primitive' && node.valuePreview" dx="4">:</tspan>
              <tspan v-if="node.type === 'primitive' && node.valuePreview" dx="4" font-weight="normal">{{ truncateText(node.valuePreview, 18) }}</tspan>
              <tspan v-if="node.type !== 'primitive'" dx="4" font-weight="normal" class="text-opacity-60">{{ node.typeLabel }}</tspan>
            </text>
          </g>
          </g>
        </g>
      </svg>
    </div>

    <!-- Node Details Panel -->
    <div 
      v-if="selectedNode"
      class="absolute bottom-4 left-4 right-4 bg-base-200/95 backdrop-blur-sm rounded-lg p-4 border border-neutral max-h-48 overflow-auto z-10"
    >
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold text-primary">{{ selectedNode.label }}</h3>
        <button 
          class="btn btn-xs btn-ghost"
          @click="selectedNode = null"
        >
          ✕
        </button>
      </div>
      
      <div class="text-sm space-y-1">
        <div><strong>Type:</strong> {{ selectedNode.typeLabel }}</div>
        <div><strong>Path:</strong> {{ selectedNode.fullPath.join(' → ') || 'Root' }}</div>
        <div v-if="selectedNode.value !== undefined && selectedNode.type === 'primitive'">
          <strong>Value:</strong>
          <pre class="text-xs bg-base-300 p-2 rounded mt-1 overflow-auto max-h-20">{{ formatValue(selectedNode.value) }}</pre>
        </div>
        <div v-if="selectedNode.childCount > 0">
          <strong>Children:</strong> {{ selectedNode.childCount }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, reactive } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  data: {
    type: [Object, Array, String, Number, Boolean],
    default: null
  },
  mode: {
    type: String,
    default: 'nameDescOnly'
  }
})

const emit = defineEmits(['node-select'])

// Refs
const containerRef = ref(null)
const svgRef = ref(null)
const selectedNode = ref(null)

// State
const currentPath = ref([])
const hoveredNode = ref(null)
const svgWidth = ref(1200)
const svgHeight = ref(800)
const currentScale = ref(1)
let svg = null
let g = null
let zoomBehavior = null
const setupZoom = () => {
  if (!svgRef.value) return
  svg = d3.select(svgRef.value)
  g = svg.select('.mindmap-content')
  zoomBehavior = d3.zoom()
    .scaleExtent([0.4, 3])
    .on('zoom', (event) => {
      currentScale.value = event.transform.k
      g.attr('transform', event.transform)
    })
  svg.call(zoomBehavior)
}

const zoomIn = () => {
  if (!svg) return
  const k = Math.min(3, currentScale.value * 1.2)
  svg.transition().duration(200).call(zoomBehavior.scaleTo, k)
}

const zoomOut = () => {
  if (!svg) return
  const k = Math.max(0.4, currentScale.value / 1.2)
  svg.transition().duration(200).call(zoomBehavior.scaleTo, k)
}

const resetZoom = () => {
  if (!svg) return
  svg.transition().duration(200).call(zoomBehavior.scaleTo, 1)
}

// Resolve CSS variables to real colors to avoid SVG black fills
const isSvgSafeColor = (v) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v) ||
  /^rgb(a)?\(/i.test(v) || /^hsl(a)?\(/i.test(v)

const resolveVar = (name, fallback) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v && isSvgSafeColor(v) ? v : fallback
}

// Clinical theme (resolved to actual color strings at runtime)
const theme = reactive({
  primary: '#6ea8ff',          // matches study element active
  secondary: '#9ec1ff',        // lighter companion
  accent: '#7aa8ff',          // outline/accent
  objectFill: '#a9cafe',      // soft pastel blue
  arrayFill: '#d3e7ff',       // even lighter blue
  primitiveFill: '#ffe3a3',   // gentle amber for values
  valueSpecialFill: '#bbf7d0', // soft mint for id/name/description
  nullFill: '#e5edf6',        // light slate/ice
  stroke: '#8fb3ff'           // border
})

const loadTheme = () => {
  // Use DaisyUI/Tailwind CSS variables if present
  theme.primary = resolveVar('--p', theme.primary)
  theme.secondary = resolveVar('--s', theme.secondary)
  theme.accent = resolveVar('--a', theme.accent)
  theme.objectFill = resolveVar('--b2', theme.objectFill)
  theme.arrayFill = resolveVar('--in', theme.arrayFill)
  theme.primitiveFill = resolveVar('--wa', theme.primitiveFill)
  theme.nullFill = resolveVar('--n', theme.nullFill)
  theme.stroke = resolveVar('--bc', theme.stroke)
}

// Layout constants
const LEVEL_WIDTH = 260  // Increased for better text fit
const NODE_HEIGHT = 36   // Reduced height to be more compact
const NODE_MIN_WIDTH = 220
const NODE_MAX_WIDTH = 260
const VERTICAL_SPACING = 45  // Reduced spacing for compact layout
const HORIZONTAL_SPACING = 40

// Utility functions
const isPrimitive = (value) => {
  return value === null || typeof value !== 'object'
}

// Treat plain objects with purely numeric keys as array-like
const isArrayLikeObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const keys = Object.keys(value)
  if (keys.length === 0) return false
  return keys.every((k) => /^\d+$/.test(k))
}

// Unified entry extractor that preserves ordering for arrays and array-like objects
const getEntriesForNode = (node) => {
  if (Array.isArray(node)) {
    return node.map((item, index) => [index, item])
  }
  if (isArrayLikeObject(node)) {
    return Object.keys(node)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => [Number(k), node[k]])
  }
  if (node && typeof node === 'object') {
    return Object.entries(node)
  }
  return []
}

const shouldIncludeInMindmap = (key, value) => {
  if (props.mode === 'nameDescOnly') {
    const keyLower = String(key).toLowerCase()
    // Only include name, description, and text fields that are primitive
    const shouldInclude = (keyLower === 'name' || 
           keyLower === 'description' || 
           keyLower === 'text') && isPrimitive(value) && value !== null
    console.log(`nameDescOnly mode: key=${key}, value=${value}, shouldInclude=${shouldInclude}`)
    return shouldInclude
  }
  // For 'everything' mode, include all primitive values
  const shouldInclude = isPrimitive(value) && value !== null
  console.log(`everything mode: key=${key}, value=${value}, shouldInclude=${shouldInclude}`)
  return shouldInclude
}

const getNodeType = (value) => {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  return 'primitive'
}

const getNodeColor = (node) => {
  switch (node.type) {
    case 'object': return theme.objectFill
    case 'array': return theme.arrayFill
    case 'primitive': {
      const key = String(node.label || '').toLowerCase()
      if (key === 'id' || key === 'name' || key === 'description') {
        return theme.valueSpecialFill
      }
      return theme.primitiveFill
    }
    case 'null': return theme.nullFill
    default: return theme.secondary
  }
}

const getDisplayType = (nodeType, value) => {
  switch (nodeType) {
    case 'object': return `{${Object.keys(value || {}).length}}`
    case 'array': return `[${value?.length || 0}]`
    case 'primitive': 
      if (typeof value === 'string') return 'string'
      if (typeof value === 'number') return 'number'
      if (typeof value === 'boolean') return 'boolean'
      return 'primitive'
    case 'null': return 'null'
    default: return nodeType
  }
}

const getNodeBorderColor = (node) => {
  return node.hasChildren ? theme.accent : theme.stroke
}

const getNodeTextColor = (node) => {
  // Dark text for light pastel cards
  return '#0f172a'
}

const getValueTextColor = (node) => {
  if (node.type === 'primitive') {
    const key = String(node.label || '').toLowerCase()
    if (key === 'id' || key === 'name' || key === 'description') return '#064e3b' // dark teal on mint
    return '#111827'
  }
  return '#334155'
}

const formatValue = (value) => {
  if (typeof value === 'string' && value.length > 100) {
    return value.substring(0, 100) + '...'
  }
  return JSON.stringify(value, null, 2)
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  const str = String(text)
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - 3) + '...'
}

const getValuePreview = (value, type) => {
  if (type === 'primitive' && value !== undefined) {
    const str = String(value)
    return str.length > 15 ? str.substring(0, 15) + '...' : str
  }
  return undefined // Don't show preview for objects/arrays as it's in the type label
}

// Get current data based on path
const getCurrentData = () => {
  if (!props.data) return null
  
  let current = props.data
  for (const segment of currentPath.value) {
    if (current && typeof current === 'object') {
      current = current[segment]
    } else {
      return null
    }
  }
  return current
}

// Process data for visualization - Always show 3 levels
const processCurrentLevel = () => {
  const currentData = getCurrentData()
  
  if (!currentData) {
    return { nodes: [], connections: [] }
  }
  
  const nodes = []
  const connections = []
  let nodeCounter = 0
  
  // Helper to create a node
  const createNode = (key, value, fullPath, level, x, y) => {
    const nodeType = getNodeType(value)
    const hasChildren = !isPrimitive(value) && (
      Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0
    )
    
    return {
      id: `node-${nodeCounter++}`,
      label: String(key),
      type: nodeType,
      value: value,
      fullPath: [...fullPath],
      level: level,
      x: x,
      y: y,
      width: NODE_MIN_WIDTH,
      height: NODE_HEIGHT,
      hasChildren: hasChildren,
      expanded: true,
      childCount: isPrimitive(value) ? 0 : (Array.isArray(value) ? value.length : Object.keys(value).length),
      typeLabel: getDisplayType(nodeType, value),
      valuePreview: getValuePreview(value, nodeType),
      isHovered: false
    }
  }
  
  // Level 0: Root node
  const rootLabel = currentPath.value.length > 0 ? currentPath.value[currentPath.value.length - 1] : 'Study Data'
  const rootNode = createNode(rootLabel, currentData, currentPath.value, 0, 50, 150)
  nodes.push(rootNode)
  
  if (isPrimitive(currentData)) {
    svgWidth.value = 400
    svgHeight.value = 200
    return { nodes, connections }
  }
  
  // Get all entries from current data
  let allEntries = getEntriesForNode(currentData)
  
  // Apply filtering based on mode
  let filteredEntries = allEntries
  if (props.mode === 'nameDescOnly') {
    // For arrays (like arms data), always show the array items
    // The filtering will happen at level 2 where we look inside each item
    if (Array.isArray(currentData) || isArrayLikeObject(currentData)) {
      filteredEntries = allEntries // Show all array items (0, 1, 2, etc.)
    } else {
      // For objects, filter by key names
      filteredEntries = allEntries.filter(([key, value]) => shouldIncludeInMindmap(key, value))
    }
  } else {
    // Complete Structure mode - show all entries but limit for performance
    filteredEntries = allEntries.slice(0, 15)
  }
  
  let currentY = 50
  
  // If no entries found in nameDescOnly mode, show a message
  if (filteredEntries.length === 0 && props.mode === 'nameDescOnly') {
    const messageNode = createNode(
      'No name/description/text fields found',
      'Switch to Complete Structure to see all fields',
      [...currentPath.value, 'message'],
      1,
      50 + LEVEL_WIDTH,
      currentY
    )
    messageNode.type = 'primitive'
    messageNode.typeLabel = 'info'
    messageNode.hasChildren = false
    nodes.push(messageNode)
    
    // Connection from root to message
    connections.push({
      id: `root-to-${messageNode.id}`,
      path: createConnectionPath(rootNode, messageNode)
    })
  }
  
  // Level 1: Direct children
  filteredEntries.forEach(([key, value], index) => {
    const level1Node = createNode(key, value, [...currentPath.value, key], 1, 50 + LEVEL_WIDTH, currentY)
    nodes.push(level1Node)
    
    // Connection from root to level 1
    connections.push({
      id: `root-to-${level1Node.id}`,
      path: createConnectionPath(rootNode, level1Node)
    })
    
    // Level 2: Show children if they exist
    if (!isPrimitive(value)) {
      let level2Entries = getEntriesForNode(value)
      
      // Apply filtering for level 2
      let filteredLevel2 = level2Entries
      if (props.mode === 'nameDescOnly') {
        // If this level is an array (e.g., arms array), show items and filter inside them
        if (Array.isArray(value) || isArrayLikeObject(value)) {
          filteredLevel2 = level2Entries
        } else {
          filteredLevel2 = level2Entries.filter(([k, v]) => shouldIncludeInMindmap(k, v))
        }
      } else {
        // Complete Structure mode - show all primitives but limit for performance
        filteredLevel2 = level2Entries.filter(([k, v]) => shouldIncludeInMindmap(k, v)).slice(0, 8)
      }
      
      let level2Y = currentY
      filteredLevel2.slice(0, 6).forEach(([subKey, subValue]) => {
        const level2Node = createNode(subKey, subValue, [...currentPath.value, key, subKey], 2, 50 + LEVEL_WIDTH * 2, level2Y)
        nodes.push(level2Node)
        
        connections.push({
          id: `${level1Node.id}-to-${level2Node.id}`,
          path: createConnectionPath(level1Node, level2Node)
        })
        
        // Level 3: Show grandchildren if they exist
        if (!isPrimitive(subValue)) {
          let level3Entries = getEntriesForNode(subValue)
          
          let filteredLevel3 = level3Entries
          if (props.mode === 'nameDescOnly') {
            // If level 3 value is an array, show items; otherwise filter by keys
            if (Array.isArray(subValue) || isArrayLikeObject(subValue)) {
              filteredLevel3 = level3Entries
            } else {
              filteredLevel3 = level3Entries.filter(([k, v]) => shouldIncludeInMindmap(k, v))
            }
          } else {
            // Complete Structure mode - show all primitives but limit for performance
            filteredLevel3 = level3Entries.filter(([k, v]) => shouldIncludeInMindmap(k, v)).slice(0, 4)
          }
          
          let level3Y = level2Y
          filteredLevel3.slice(0, 3).forEach(([subSubKey, subSubValue]) => {
            const level3Node = createNode(subSubKey, subSubValue, [...currentPath.value, key, subKey, subSubKey], 3, 50 + LEVEL_WIDTH * 3, level3Y)
            nodes.push(level3Node)
            
            connections.push({
              id: `${level2Node.id}-to-${level3Node.id}`,
              path: createConnectionPath(level2Node, level3Node)
            })
            
            level3Y += VERTICAL_SPACING * 0.7
          })
          
          level2Y = Math.max(level2Y + VERTICAL_SPACING, level3Y)
        } else {
          level2Y += VERTICAL_SPACING
        }
      })
      
      currentY = Math.max(currentY + VERTICAL_SPACING * 1.5, level2Y)
    } else {
      currentY += VERTICAL_SPACING
    }
  })
  
  // Center root node
  if (nodes.length > 1) {
    const level1Nodes = nodes.filter(n => n.level === 1)
    if (level1Nodes.length > 0) {
      const minY = Math.min(...level1Nodes.map(n => n.y))
      const maxY = Math.max(...level1Nodes.map(n => n.y))
      rootNode.y = (minY + maxY) / 2
      
      // Update root connections
      connections.forEach(conn => {
        if (conn.id.startsWith('root-to-')) {
          const targetNodeId = conn.id.replace('root-to-', '')
          const targetNode = nodes.find(n => n.id === targetNodeId)
          if (targetNode) {
            conn.path = createConnectionPath(rootNode, targetNode)
          }
        }
      })
    }
  }
  
  // Update SVG dimensions
  const maxX = nodes.length > 0 ? Math.max(...nodes.map(n => n.x + n.width)) + 200 : 1400
  const maxY = nodes.length > 0 ? Math.max(...nodes.map(n => n.y + n.height)) + 200 : 900
  svgWidth.value = Math.max(1400, maxX)
  svgHeight.value = Math.max(900, maxY)
  
  return { nodes, connections }
}

const createConnectionPath = (source, target) => {
  const sourceX = source.x + source.width
  const sourceY = source.y + source.height / 2
  const targetX = target.x
  const targetY = target.y + target.height / 2
  
  // Shorter, more compact curve
  const midX = sourceX + 30 // Fixed short distance instead of halfway
  
  return `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`
}

// Computed properties
const visibleNodes = computed(() => {
  const result = processCurrentLevel()
  return result.nodes.map(node => ({
    ...node,
    isHovered: hoveredNode.value === node.id
  }))
})

const connections = computed(() => {
  const result = processCurrentLevel()
  return result.connections
})

const canGoBack = computed(() => {
  return currentPath.value.length > 0
})

// Event handlers
const handleNodeClick = (node) => {
  selectedNode.value = node
  emit('node-select', node)
  
  // For any node with children, clicking navigates deeper
  if (node.hasChildren && node.level > 0) {
    navigateToPath(node.fullPath)
  }
}

const handleNodeHover = (node, isHovering) => {
  hoveredNode.value = isHovering ? node.id : null
}

const navigateToPath = (path) => {
  currentPath.value = [...path]
  selectedNode.value = null
}

const resetView = () => {
  navigateToPath([])
}

const goBack = () => {
  if (canGoBack.value) {
    const newPath = [...currentPath.value]
    newPath.pop()
    navigateToPath(newPath)
  }
}

// Removed expandCurrentLevel since we always show 3 levels

// Lifecycle
onMounted(() => {
  nextTick(() => {
    // Attempt to load palette from CSS vars only if they are SVG-safe colors
    loadTheme()
    if (containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect()
      svgWidth.value = Math.max(1200, rect.width)
      svgHeight.value = Math.max(600, rect.height)
    }
    setupZoom()
  })
})

// Watchers
watch([() => props.data, () => props.mode], () => {
  // Reset to root when data changes (like when filters are applied)
  currentPath.value = []
  selectedNode.value = null
}, { immediate: true })
</script>

<style scoped>
.hierarchical-mindmap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
}

.node-group {
  cursor: pointer;
  transition: all 0.2s ease;
}

.node-group:hover .node-rect {
  filter: brightness(1.04) drop-shadow(0 4px 12px rgba(2,6,23,.25));
}

.node-expandable:hover {
  filter: brightness(1.1);
}

.connection-line { transition: all 0.25s ease; stroke-linecap: round; }

.expand-indicator {
  cursor: pointer;
  transition: all 0.2s ease;
}

.expand-indicator:hover {
  r: 10;
}

.node-rect {
  transition: all 0.25s ease;
}

.node-type {
  letter-spacing: .2px;
}

.breadcrumbs ul li + li:before {
  content: "→";
  margin: 0 0.5rem;
  opacity: 0.5;
}
</style>
