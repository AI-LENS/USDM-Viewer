<template>
  <div class="repository-manager min-h-screen bg-base-100">
    <!-- Header -->
    <div class="navbar bg-base-200 border-b border-neutral">
      <div class="navbar-start">
        <h1 class="text-xl font-bold text-primary">USDM Repository Browser</h1>
      </div>
      <div class="navbar-end">
        <button 
          class="btn btn-outline btn-sm"
          @click="$emit('close')"
        >
          ← Back to Viewer
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex flex-col lg:flex-row gap-6 p-6">
      <!-- Left Panel: Repository Folder & Search -->
      <div class="lg:w-1/2 space-y-6">
        <!-- Repository Folder Selection -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-secondary">Repository Folder</h2>
            
            <div class="space-y-4">
              <!-- Folder Selection -->
              <div>
                <label class="label">
                  <span class="label-text">Select Repository Folder</span>
                </label>
                <div class="space-y-3">
                  <label class="btn btn-primary w-full">
                    📁 Browse for Folder
                    <input 
                      ref="folderInput"
                      type="file" 
                      webkitdirectory
                      class="hidden"
                      @change="handleFolderSelection"
                    />
                  </label>
                  
                  <div v-if="selectedFolder" class="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                      <h3 class="font-bold">Repository Loaded</h3>
                      <div class="text-xs">{{ selectedFolder }}</div>
                      <div class="text-xs">Found {{ usdmFiles.length }} USDM JSON files</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Loading Status -->
              <div v-if="isLoadingFiles" class="text-center py-4">
                <div class="loading loading-spinner loading-lg text-primary"></div>
                <p class="mt-2 text-base-content/70">Scanning folder for USDM files...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Search Interface -->
        <div class="card bg-base-200 shadow-xl" :class="{ 'opacity-50': usdmFiles.length === 0 }">
          <div class="card-body">
            <h2 class="card-title text-secondary">Search USDM Elements</h2>
            
            <div class="space-y-4">
              <!-- Element Type Selection -->
              <div>
                <label class="label">
                  <span class="label-text">Search For</span>
                </label>
                <select 
                  v-model="searchConfig.elementType"
                  class="select select-bordered w-full"
                  :disabled="usdmFiles.length === 0"
                  @change="performElementSearch"
                >
                  <option value="">Select element type...</option>
                  <option value="activities">Activities</option>
                  <option value="arms">Study Arms</option>
                  <option value="epochs">Study Epochs</option>
                  <option value="objectives">Study Objectives</option>
                  <option value="endpoints">Endpoints</option>
                  <option value="biomedicalConcepts">Biomedical Concepts</option>
                  <option value="encounters">Encounters</option>
                  <option value="eligibilityCriteria">Eligibility Criteria</option>
                  <option value="studyDesigns">Study Designs</option>
                </select>
              </div>

              <!-- Search Query -->
              <div v-if="searchConfig.elementType">
                <label class="label">
                  <span class="label-text">Search Terms</span>
                  <span class="label-text-alt text-info">🤖 Semantic search enabled</span>
                </label>
                <div class="join w-full">
                  <input 
                    v-model="searchConfig.query"
                    type="text" 
                    :placeholder="getSearchPlaceholder(searchConfig.elementType)"
                    class="input input-bordered join-item flex-1"
                    :disabled="usdmFiles.length === 0"
                    @input="performElementSearch"
                  />
                  <button 
                    class="btn btn-primary join-item"
                    @click="clearElementSearch"
                    :disabled="!searchConfig.query"
                  >
                    Clear
                  </button>
                </div>
                
                <!-- Expanded search terms indicator -->
                <div v-if="searchConfig.query && expandedSearchTerms.length > 0" class="mt-2">
                  <div class="text-xs text-base-content/70 mb-1">🔍 Also searching for:</div>
                  <div class="flex flex-wrap gap-1">
                    <span 
                      v-for="term in expandedSearchTerms.slice(0, 8)" 
                      :key="term"
                      class="badge badge-outline badge-xs"
                    >
                      {{ term }}
                    </span>
                    <span v-if="expandedSearchTerms.length > 8" class="badge badge-outline badge-xs">
                      +{{ expandedSearchTerms.length - 8 }} more
                    </span>
                  </div>
                </div>

                <!-- Search suggestions -->
                <div v-if="!searchConfig.query" class="mt-2">
                  <div class="text-xs text-base-content/70 mb-1">💡 Try searching for:</div>
                  <div class="flex flex-wrap gap-1">
                    <button
                      v-for="suggestion in getSearchSuggestions(searchConfig.elementType)"
                      :key="suggestion"
                      @click="searchConfig.query = suggestion; performElementSearch()"
                      class="badge badge-primary badge-outline cursor-pointer hover:badge-primary transition-colors"
                    >
                      {{ suggestion }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Search Stats -->
              <div v-if="elementMatches.length > 0" class="stats stats-horizontal bg-base-300 w-full">
                <div class="stat">
                  <div class="stat-title text-xs">Matches Found</div>
                  <div class="stat-value text-lg">{{ elementMatches.length }}</div>
                </div>
                <div class="stat">
                  <div class="stat-title text-xs">Studies</div>
                  <div class="stat-value text-lg">{{ uniqueStudyCount }}</div>
                </div>
                <div class="stat">
                  <div class="stat-title text-xs">Selected</div>
                  <div class="stat-value text-lg">{{ selectedMatches.length }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Element Matches -->
      <div class="lg:w-1/2 space-y-6">
        <!-- Element Matches List -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex justify-between items-center mb-4">
              <h2 class="card-title text-secondary">
                {{ searchConfig.elementType ? `${searchConfig.elementType} Matches` : 'USDM Files' }}
              </h2>
              <div v-if="searchConfig.elementType" class="flex gap-2">
                <button 
                  class="btn btn-xs btn-outline"
                  @click="selectAllMatches"
                  :disabled="elementMatches.length === 0"
                >
                  Select All
                </button>
                <button 
                  class="btn btn-xs btn-outline"
                  @click="clearAllSelections"
                  :disabled="selectedMatches.length === 0"
                >
                  Clear All
                </button>
              </div>
            </div>

            <!-- Element Matches -->
            <div v-if="searchConfig.elementType && elementMatches.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
              <div 
                v-for="match in elementMatches" 
                :key="match.id"
                class="card bg-base-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                :class="{ 'ring-2 ring-primary': selectedMatches.includes(match.id) }"
                @click="toggleMatchSelection(match)"
              >
                <div class="card-body p-4">
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                      <h3 class="font-semibold text-primary">{{ match.elementName || match.element.name || match.element.id }}</h3>
                      <p class="text-xs text-base-content/60">
                        From: <span class="font-medium">{{ match.studyName }}</span> 
                        <span class="badge badge-xs badge-outline ml-2">{{ match.fileName }}</span>
                      </p>
                    </div>
                    
                    <div class="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        class="checkbox checkbox-primary checkbox-sm"
                        :checked="selectedMatches.includes(match.id)"
                        @click.stop
                        @change="toggleMatchSelection(match)"
                      />
                      <button 
                        class="btn btn-xs btn-ghost"
                        @click.stop="expandMatch(match)"
                        :title="match.expanded ? 'Collapse' : 'Expand'"
                      >
                        {{ match.expanded ? '📄' : '📋' }}
                      </button>
                    </div>
                  </div>
                  
                  <!-- Element Description/Summary -->
                  <p v-if="match.element.description" class="text-sm text-base-content/80 mb-2">
                    {{ truncateText(match.element.description, 120) }}
                  </p>
                  
                  <!-- Element Badges -->
                  <div class="flex gap-1 mb-2">
                    <div class="badge badge-secondary badge-xs">{{ searchConfig.elementType.slice(0, -1) }}</div>
                    <div v-if="match.element.type" class="badge badge-accent badge-xs">{{ match.element.type }}</div>
                    <div v-if="match.element.category" class="badge badge-outline badge-xs">{{ match.element.category }}</div>
                  </div>
                  
                  <!-- Expanded JSON Content -->
                  <div v-if="match.expanded" class="mt-3 border-t border-base-content/20 pt-3">
                    <div class="text-xs font-semibold mb-2 text-secondary">Full JSON Content:</div>
                    <pre class="text-xs bg-base-100 p-3 rounded max-h-40 overflow-auto border">{{ JSON.stringify(match.element, null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- Files List (when no search) -->
            <div v-else-if="!searchConfig.elementType && usdmFiles.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
              <div 
                v-for="file in usdmFiles" 
                :key="file.name"
                class="card bg-base-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                @click="loadSingleFile(file)"
              >
                <div class="card-body p-4">
                  <div class="flex justify-between items-start gap-3">
                    <div class="flex-1 min-w-0">
                      <h3 class="font-semibold text-primary truncate">{{ file.studyName || file.name }}</h3>
                      <p class="text-sm text-base-content/70 mt-1 line-clamp-2">{{ file.description || 'No description available' }}</p>
                      
                      <div class="flex flex-wrap gap-1 mt-3">
                        <div class="badge badge-outline badge-sm">{{ file.size }}</div>
                        <div v-if="file.studyId && file.studyId !== file.name" class="badge badge-secondary badge-sm truncate max-w-32" :title="file.studyId">{{ file.studyId }}</div>
                        <div v-if="file.version" class="badge badge-accent badge-sm">v{{ file.version }}</div>
                      </div>
                    </div>
                    
                    <div class="flex flex-col gap-1 flex-shrink-0">
                      <button 
                        class="btn btn-xs btn-ghost"
                        @click.stop="previewFile(file)"
                        title="Preview File"
                      >
                        👁️
                      </button>
                      <button 
                        class="btn btn-xs btn-primary"
                        @click.stop="loadSingleFile(file)"
                        title="Load in Viewer"
                      >
                        📊
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty States -->
            <div v-else-if="usdmFiles.length === 0" class="text-center py-8 text-base-content/50">
              <div class="text-4xl mb-2">📁</div>
              <p>No USDM files found. Please select a repository folder.</p>
            </div>

            <div v-else-if="searchConfig.elementType && elementMatches.length === 0" class="text-center py-8 text-base-content/50">
              <div class="text-4xl mb-2">🔍</div>
              <p>No {{ searchConfig.elementType }} found matching your search.</p>
            </div>

            <div v-else class="text-center py-8 text-base-content/50">
              <div class="text-4xl mb-2">🎯</div>
              <p>Select an element type above to start searching.</p>
            </div>
          </div>
        </div>

        <!-- Actions Panel -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-secondary">Actions</h2>
            
            <div class="space-y-4">
              <!-- Element Actions (when searching) -->
              <div v-if="searchConfig.elementType">
                <!-- Download Selected Elements -->
                <button 
                  class="btn btn-success w-full"
                  :class="{ 'loading': isDownloading }"
                  @click="downloadSelectedElements"
                  :disabled="selectedMatches.length === 0 || isDownloading"
                >
                  {{ isDownloading ? 'Preparing Download...' : `📥 Download ${selectedMatches.length} ${searchConfig.elementType}` }}
                </button>

                <!-- Load Elements in Viewer -->
                <button 
                  class="btn btn-primary w-full"
                  @click="loadSelectedElements"
                  :disabled="selectedMatches.length === 0"
                >
                  📊 View Selected Elements ({{ selectedMatches.length }})
                </button>

                <!-- Export Format Options -->
                <div class="divider text-xs">Export Format</div>
                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text text-sm">Group by study</span>
                    <input 
                      v-model="exportOptions.groupByStudy"
                      type="checkbox" 
                      class="checkbox checkbox-primary checkbox-sm"
                    />
                  </label>
                </div>
                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text text-sm">Include source study info</span>
                    <input 
                      v-model="exportOptions.includeStudyInfo"
                      type="checkbox" 
                      class="checkbox checkbox-primary checkbox-sm"
                    />
                  </label>
                </div>
              </div>

              <!-- File Actions (when not searching) -->
              <div v-else>
                <!-- Load Multiple Files -->
                <button 
                  class="btn btn-primary w-full"
                  @click="loadSelectedFiles"
                  :disabled="selectedFiles.length === 0"
                >
                  📊 Load Selected Files ({{ selectedFiles.length }})
                </button>

                <!-- Download Selected Files -->
                <button 
                  class="btn btn-success w-full"
                  :class="{ 'loading': isDownloading }"
                  @click="downloadSelectedFiles"
                  :disabled="selectedFiles.length === 0 || isDownloading"
                >
                  {{ isDownloading ? 'Preparing Download...' : `📥 Download ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}` }}
                </button>

                <!-- File Export Options -->
                <div class="divider text-xs">File Options</div>
                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text text-sm">Combine files into single JSON</span>
                    <input 
                      v-model="exportOptions.combineFiles"
                      type="checkbox" 
                      class="checkbox checkbox-primary checkbox-sm"
                    />
                  </label>
                </div>
                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text text-sm">Include file metadata</span>
                    <input 
                      v-model="exportOptions.includeMetadata"
                      type="checkbox" 
                      class="checkbox checkbox-primary checkbox-sm"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="previewData" class="modal modal-open">
      <div class="modal-box max-w-4xl">
        <h3 class="font-bold text-lg mb-4">Preview: {{ previewData.title || previewData.name || previewData.id }}</h3>
        
        <div class="bg-base-300 rounded-lg p-4 max-h-96 overflow-auto">
          <pre class="text-xs">{{ JSON.stringify(previewData.content || previewData, null, 2) }}</pre>
        </div>
        
        <div class="modal-action">
          <button class="btn btn-primary" @click="previewData = null">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

const emit = defineEmits(['close', 'load-data'])

// Repository state
const folderInput = ref(null)
const selectedFolder = ref(null)
const isLoadingFiles = ref(false)
const usdmFiles = ref([])
const selectedFiles = ref([])
const previewData = ref(null)

// Search state
const searchConfig = reactive({
  elementType: '',
  query: ''
})

const elementMatches = ref([])
const selectedMatches = ref([])

// Computed property for expanded search terms
const expandedSearchTerms = computed(() => {
  if (!searchConfig.query) return []
  const condition = parseConditionalSearch(searchConfig.query)
  if (condition) {
    return [`Conditional: ${condition.type}`, `Field: ${condition.field || 'age/weight/bmi'}`, `Value: ${condition.value1}${condition.value2 ? ` - ${condition.value2}` : ''}`]
  }
  return expandSearchQuery(searchConfig.query).filter(term => term !== searchConfig.query.toLowerCase())
})

// Function to get search suggestions based on element type
const getSearchSuggestions = (elementType) => {
  const suggestions = {
    activities: ['vital signs', 'blood pressure', 'baseline assessment', 'age greater than 50', 'laboratory tests'],
    eligibilityCriteria: ['age between 18 and 65', 'weight greater than 50', 'bmi less than 30', 'exclude if pregnant', 'include if diabetes'],
    arms: ['treatment', 'placebo', 'control', 'intervention'],
    endpoints: ['primary', 'secondary', 'safety', 'efficacy', 'response'],
    biomedicalConcepts: ['overall survival', 'progression free survival', 'response rate', 'adverse events'],
    encounters: ['screening', 'baseline', 'follow-up', 'end of treatment'],
    epochs: ['screening period', 'treatment period', 'follow-up period'],
    objectives: ['primary objective', 'secondary objective', 'safety objective']
  }
  
  return suggestions[elementType] || ['baseline', 'safety', 'efficacy', 'age greater than 18']
}

// Function to get dynamic placeholder text
const getSearchPlaceholder = (elementType) => {
  const placeholders = {
    activities: 'Search activities... (try: "vital signs" or "age greater than 50")',
    eligibilityCriteria: 'Search criteria... (try: "age between 18 and 65" or "exclude if pregnant")',
    arms: 'Search study arms... (try: "treatment" or "placebo")',
    endpoints: 'Search endpoints... (try: "primary" or "response")',
    biomedicalConcepts: 'Search concepts... (try: "survival" or "adverse events")',
    encounters: 'Search encounters... (try: "baseline" or "screening")',
    epochs: 'Search epochs... (try: "treatment period")',
    objectives: 'Search objectives... (try: "primary objective")'
  }
  
  return placeholders[elementType] || 'Search... (try: "age greater than 50" or "baseline")'
}

// Export state
const exportOptions = reactive({
  combineFiles: false,
  includeMetadata: true,
  groupByStudy: true,
  includeStudyInfo: true
})

const isDownloading = ref(false)

// Computed properties
const uniqueStudyCount = computed(() => {
  if (elementMatches.value.length === 0) return 0
  
  const studies = new Set()
  for (const match of elementMatches.value) {
    // Use both studyId and fileName to ensure uniqueness
    const uniqueKey = match.studyId || match.fileName || 'unknown'
    studies.add(uniqueKey)
  }
  return studies.size
})

// File handling
const handleFolderSelection = async (event) => {
  const files = Array.from(event.target.files)
  if (files.length === 0) return
  
  selectedFolder.value = files[0].webkitRelativePath.split('/')[0]
  isLoadingFiles.value = true
  
  try {
    const jsonFiles = files.filter(file => file.name.toLowerCase().endsWith('.json'))
    const parsedFiles = []
    
    for (const file of jsonFiles) {
      try {
        const content = await readFileContent(file)
        const data = JSON.parse(content)
        
        // Extract metadata from USDM structure
        const extractedStudyId = extractStudyId(data)
        const extractedStudyName = extractStudyName(data)
        
        const fileInfo = {
          name: file.name,
          file: file,
          size: formatFileSize(file.size),
          lastModified: new Date(file.lastModified).toLocaleDateString(),
          content: content, // Store raw content for searching
          data: data, // Parsed JSON data
          studyId: extractedStudyId || file.name.replace(/\.[^/.]+$/, ""), // Use filename without extension as fallback
          studyName: extractedStudyName || file.name.replace(/\.[^/.]+$/, ""), // Use filename without extension as fallback
          version: extractVersion(data),
          description: extractDescription(data)
        }
        
        console.log(`Parsed file: ${file.name}, StudyID: ${fileInfo.studyId}, StudyName: ${fileInfo.studyName}`)
        
        parsedFiles.push(fileInfo)
      } catch (error) {
        console.warn(`Failed to parse ${file.name}:`, error)
      }
    }
    
    usdmFiles.value = parsedFiles
    selectedFiles.value = []
  } catch (error) {
    console.error('Error processing folder:', error)
  } finally {
    isLoadingFiles.value = false
  }
}

const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// Element search functionality
const performElementSearch = () => {
  if (!searchConfig.elementType || usdmFiles.value.length === 0) {
    elementMatches.value = []
    return
  }

  const matches = []
  let matchId = 0

  console.log('Performing search across', usdmFiles.value.length, 'files')

  for (const file of usdmFiles.value) {
    try {
      const elements = findElementsInData(file.data, searchConfig.elementType)
      console.log(`Found ${elements.length} ${searchConfig.elementType} in ${file.name} (Study: ${file.studyId})`)
      
      for (const element of elements) {
        // Check if element matches search query
        if (!searchConfig.query || matchesSearchQuery(element, searchConfig.query)) {
          matches.push({
            id: `match-${matchId++}`,
            element: element,
            elementName: element.name || element.title || element.id || 'Unnamed',
            studyId: file.studyId || file.name, // Use filename as fallback
            studyName: file.studyName || file.name,
            fileName: file.name,
            expanded: false
          })
        }
      }
    } catch (error) {
      console.warn(`Error searching in ${file.name}:`, error)
    }
  }

  console.log('Total matches found:', matches.length)
  console.log('Unique studies:', new Set(matches.map(m => m.studyId)).size)

  elementMatches.value = matches
  selectedMatches.value = []
}

const clearElementSearch = () => {
  searchConfig.query = ''
  performElementSearch()
}

// Helper function to find elements in USDM data
const findElementsInData = (data, elementType) => {
  const elements = []
  
  const searchPaths = {
    activities: [
      'study.versions[].activities',
      'study.versions[].studyDesigns[].activities',
      'activities'
    ],
    arms: [
      'study.versions[].studyDesigns[].arms',
      'study.versions[].arms',
      'arms'
    ],
    epochs: [
      'study.versions[].studyDesigns[].epochs',
      'study.versions[].epochs',
      'epochs'
    ],
    objectives: [
      'study.objectives',
      'study.versions[].objectives',
      'objectives'
    ],
    endpoints: [
      'study.versions[].endpoints',
      'study.versions[].studyDesigns[].endpoints',
      'endpoints'
    ],
    biomedicalConcepts: [
      'study.versions[].biomedicalConcepts',
      'biomedicalConcepts'
    ],
    encounters: [
      'study.versions[].encounters',
      'study.versions[].studyDesigns[].encounters',
      'encounters'
    ],
    eligibilityCriteria: [
      'study.versions[].eligibilityCriteria',
      'eligibilityCriteria'
    ],
    studyDesigns: [
      'study.versions[].studyDesigns',
      'studyDesigns'
    ]
  }

  const paths = searchPaths[elementType] || []
  
  for (const path of paths) {
    const found = getValueByPath(data, path)
    if (Array.isArray(found)) {
      elements.push(...found)
    } else if (found) {
      elements.push(found)
    }
  }

  return elements
}

// Helper function to get value by path (supports array notation)
const getValueByPath = (obj, path) => {
  const parts = path.split('.')
  let current = obj

  for (const part of parts) {
    if (!current) return null
    
    if (part.includes('[') && part.includes(']')) {
      // Handle array notation like versions[]
      const [key, arrayPart] = part.split('[')
      current = current[key]
      
      if (Array.isArray(current)) {
        // Flatten all array items
        const results = []
        for (const item of current) {
          if (arrayPart === ']') {
            // Return the array items themselves
            results.push(item)
          } else {
            // Continue with remaining path
            const remaining = parts.slice(parts.indexOf(part) + 1).join('.')
            if (remaining) {
              const nested = getValueByPath(item, remaining)
              if (Array.isArray(nested)) {
                results.push(...nested)
              } else if (nested) {
                results.push(nested)
              }
            }
          }
        }
        return results.length > 0 ? results : null
      }
    } else {
      current = current[part]
    }
  }

  return current
}

// Semantic search mappings for medical/clinical terminology
const semanticMappings = {
  // Vital signs and measurements
  'vital signs': ['vital', 'vitals', 'signs', 'blood pressure', 'bp', 'heart rate', 'hr', 'pulse', 'temperature', 'temp', 'respiratory rate', 'respiration', 'oxygen saturation', 'spo2', 'weight', 'height', 'bmi'],
  'blood pressure': ['bp', 'systolic', 'diastolic', 'hypertension', 'hypotension', 'pressure'],
  'heart rate': ['hr', 'pulse', 'cardiac', 'beats per minute', 'bpm'],
  'temperature': ['temp', 'fever', 'pyrexia', 'hypothermia', 'celsius', 'fahrenheit'],
  
  // Laboratory tests
  'laboratory': ['lab', 'labs', 'blood test', 'serum', 'plasma', 'urine', 'biochemistry', 'hematology', 'chemistry'],
  'blood test': ['lab', 'serum', 'plasma', 'hematology', 'cbc', 'complete blood count'],
  'liver function': ['hepatic', 'alt', 'ast', 'bilirubin', 'alkaline phosphatase', 'alp'],
  'kidney function': ['renal', 'creatinine', 'bun', 'egfr', 'urea'],
  
  // Clinical assessments
  'baseline': ['screening', 'enrollment', 'initial', 'pre-treatment', 'day 1', 'visit 1'],
  'follow-up': ['followup', 'post-treatment', 'monitoring', 'follow up'],
  'safety': ['adverse event', 'ae', 'serious adverse event', 'sae', 'toxicity', 'side effect'],
  'efficacy': ['effectiveness', 'response', 'outcome', 'endpoint', 'benefit'],
  
  // Study procedures
  'randomization': ['randomize', 'random', 'allocation', 'assignment'],
  'treatment': ['therapy', 'intervention', 'medication', 'drug', 'dose', 'dosing'],
  'placebo': ['control', 'sham', 'dummy'],
  'screening': ['eligibility', 'inclusion', 'exclusion', 'criteria'],
  
  // Oncology specific
  'tumor': ['cancer', 'neoplasm', 'malignancy', 'lesion', 'mass'],
  'chemotherapy': ['chemo', 'cytotoxic', 'anticancer', 'antineoplastic'],
  'radiation': ['radiotherapy', 'rt', 'irradiation'],
  'response': ['recist', 'complete response', 'cr', 'partial response', 'pr', 'stable disease', 'sd', 'progressive disease', 'pd'],
  
  // Common abbreviations
  'ecg': ['electrocardiogram', 'ekg', 'cardiac monitoring'],
  'mri': ['magnetic resonance imaging', 'imaging'],
  'ct': ['computed tomography', 'cat scan', 'imaging'],
  'x-ray': ['radiograph', 'imaging'],
  
  // Time-related
  'daily': ['once daily', 'qd', 'every day', 'q24h'],
  'weekly': ['once weekly', 'qw', 'every week'],
  'monthly': ['once monthly', 'qm', 'every month']
}

// Conditional search patterns
const conditionalPatterns = [
  // Age conditions
  { pattern: /age\s+(greater|more|above|over|>=|>)\s+than\s+(\d+)/i, type: 'age_gt' },
  { pattern: /age\s+(less|below|under|<=|<)\s+than\s+(\d+)/i, type: 'age_lt' },
  { pattern: /age\s+(equals?|=|is)\s+(\d+)/i, type: 'age_eq' },
  { pattern: /age\s+between\s+(\d+)\s+and\s+(\d+)/i, type: 'age_between' },
  
  // Weight conditions
  { pattern: /weight\s+(greater|more|above|over|>=|>)\s+than\s+(\d+)/i, type: 'weight_gt' },
  { pattern: /weight\s+(less|below|under|<=|<)\s+than\s+(\d+)/i, type: 'weight_lt' },
  { pattern: /weight\s+between\s+(\d+)\s+and\s+(\d+)/i, type: 'weight_between' },
  
  // BMI conditions
  { pattern: /bmi\s+(greater|more|above|over|>=|>)\s+than\s+(\d+)/i, type: 'bmi_gt' },
  { pattern: /bmi\s+(less|below|under|<=|<)\s+than\s+(\d+)/i, type: 'bmi_lt' },
  { pattern: /bmi\s+between\s+(\d+)\s+and\s+(\d+)/i, type: 'bmi_between' },
  
  // General numeric conditions
  { pattern: /(\w+)\s+(>=|>)\s+(\d+(?:\.\d+)?)/i, type: 'numeric_gt' },
  { pattern: /(\w+)\s+(<=|<)\s+(\d+(?:\.\d+)?)/i, type: 'numeric_lt' },
  { pattern: /(\w+)\s+(=|equals?|is)\s+(\d+(?:\.\d+)?)/i, type: 'numeric_eq' },
  { pattern: /(\w+)\s+between\s+(\d+(?:\.\d+)?)\s+and\s+(\d+(?:\.\d+)?)/i, type: 'numeric_between' },
  
  // Inclusion/exclusion criteria
  { pattern: /include\s+if\s+(.*)/i, type: 'include_if' },
  { pattern: /exclude\s+if\s+(.*)/i, type: 'exclude_if' },
  { pattern: /criteria\s+(.*)/i, type: 'criteria' },
  
  // Time-based conditions
  { pattern: /within\s+(\d+)\s+(days?|weeks?|months?|years?)/i, type: 'time_within' },
  { pattern: /after\s+(\d+)\s+(days?|weeks?|months?|years?)/i, type: 'time_after' },
  { pattern: /before\s+(\d+)\s+(days?|weeks?|months?|years?)/i, type: 'time_before' }
]

// Helper function to parse conditional searches
const parseConditionalSearch = (query) => {
  if (!query) return null
  
  for (const { pattern, type } of conditionalPatterns) {
    const match = query.match(pattern)
    if (match) {
      return {
        type,
        original: query,
        matches: match,
        field: match[1]?.toLowerCase(),
        operator: match[1]?.toLowerCase(),
        value1: match[2] || match[3],
        value2: match[3] || match[4]
      }
    }
  }
  
  return null
}

// Helper function to expand search query with semantic terms
const expandSearchQuery = (query) => {
  if (!query) return []
  
  const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0)
  const expandedTerms = new Set(terms)
  
  // Add original terms
  terms.forEach(term => expandedTerms.add(term))
  
  // Add semantic expansions
  for (const [concept, synonyms] of Object.entries(semanticMappings)) {
    if (terms.some(term => 
      concept.includes(term) || 
      term.includes(concept) ||
      synonyms.some(syn => syn.includes(term) || term.includes(syn))
    )) {
      synonyms.forEach(syn => expandedTerms.add(syn))
      expandedTerms.add(concept)
    }
  }
  
  return Array.from(expandedTerms)
}

// Helper function to evaluate conditional expressions
const evaluateCondition = (element, condition) => {
  if (!condition) return false
  
  const elementText = JSON.stringify(element).toLowerCase()
  
  try {
    switch (condition.type) {
      case 'age_gt':
      case 'age_lt':
      case 'age_eq':
      case 'age_between':
        return evaluateNumericCondition(element, 'age', condition)
      
      case 'weight_gt':
      case 'weight_lt':
      case 'weight_between':
        return evaluateNumericCondition(element, 'weight', condition)
      
      case 'bmi_gt':
      case 'bmi_lt':
      case 'bmi_between':
        return evaluateNumericCondition(element, 'bmi', condition)
      
      case 'numeric_gt':
      case 'numeric_lt':
      case 'numeric_eq':
      case 'numeric_between':
        return evaluateNumericCondition(element, condition.field, condition)
      
      case 'include_if':
      case 'exclude_if':
      case 'criteria':
        return elementText.includes(condition.value1?.toLowerCase() || '')
      
      case 'time_within':
      case 'time_after':
      case 'time_before':
        return evaluateTimeCondition(element, condition)
      
      default:
        return false
    }
  } catch (error) {
    console.warn('Error evaluating condition:', error)
    return false
  }
}

// Helper to evaluate numeric conditions
const evaluateNumericCondition = (element, field, condition) => {
  const numbers = extractNumbers(element, field)
  if (numbers.length === 0) return false
  
  const value1 = parseFloat(condition.value1)
  const value2 = condition.value2 ? parseFloat(condition.value2) : null
  
  return numbers.some(num => {
    switch (condition.type.split('_')[1]) {
      case 'gt':
        return num > value1
      case 'lt':
        return num < value1
      case 'eq':
        return Math.abs(num - value1) < 0.01 // Handle floating point comparison
      case 'between':
        return value2 !== null && num >= value1 && num <= value2
      default:
        return false
    }
  })
}

// Helper to extract numbers from element that relate to a field
const extractNumbers = (element, field) => {
  const elementText = JSON.stringify(element).toLowerCase()
  const fieldVariations = [field, field + 's', field + '_value', field + '_min', field + '_max']
  const numbers = []
  
  // Look for numbers in text near field mentions
  for (const variation of fieldVariations) {
    const regex = new RegExp(`${variation}[^\\d]*([\\d.]+)`, 'gi')
    let match
    while ((match = regex.exec(elementText)) !== null) {
      const num = parseFloat(match[1])
      if (!isNaN(num)) {
        numbers.push(num)
      }
    }
  }
  
  // Also look for general number patterns if field is mentioned anywhere
  if (elementText.includes(field)) {
    const numberRegex = /\b(\d+(?:\.\d+)?)\b/g
    let match
    while ((match = numberRegex.exec(elementText)) !== null) {
      const num = parseFloat(match[1])
      if (!isNaN(num) && num > 0 && num < 1000) { // Reasonable bounds
        numbers.push(num)
      }
    }
  }
  
  return numbers
}

// Helper to evaluate time conditions
const evaluateTimeCondition = (element, condition) => {
  const elementText = JSON.stringify(element).toLowerCase()
  const timeUnit = condition.matches[2]?.toLowerCase()
  const timeValue = parseInt(condition.value1)
  
  // Look for time-related patterns in the element
  const timePatterns = [
    new RegExp(`${timeValue}\\s*${timeUnit}`, 'i'),
    new RegExp(`within\\s*${timeValue}\\s*${timeUnit}`, 'i'),
    new RegExp(`${timeUnit}\\s*${timeValue}`, 'i')
  ]
  
  return timePatterns.some(pattern => pattern.test(elementText))
}

// Helper function to check if element matches search query (semantic + conditional)
const matchesSearchQuery = (element, query) => {
  if (!query) return true
  
  // First check if this is a conditional search
  const condition = parseConditionalSearch(query)
  if (condition) {
    console.log('Evaluating condition:', condition, 'for element:', element.name || element.id)
    return evaluateCondition(element, condition)
  }
  
  // Otherwise, do semantic search
  const searchTerms = expandSearchQuery(query)
  const elementText = JSON.stringify(element).toLowerCase()
  
  // Get all searchable text from the element
  const searchableTexts = [
    element.name?.toLowerCase() || '',
    element.title?.toLowerCase() || '',
    element.description?.toLowerCase() || '',
    element.id?.toLowerCase() || '',
    element.type?.toLowerCase() || '',
    element.category?.toLowerCase() || '',
    elementText
  ].filter(text => text.length > 0)
  
  // Calculate semantic match score
  let matchScore = 0
  let totalTerms = searchTerms.length
  
  for (const term of searchTerms) {
    let termFound = false
    for (const text of searchableTexts) {
      if (text.includes(term)) {
        matchScore++
        termFound = true
        break
      }
    }
    // Give partial credit for partial matches
    if (!termFound) {
      for (const text of searchableTexts) {
        if (term.length > 3 && text.includes(term.substring(0, term.length - 1))) {
          matchScore += 0.5
          break
        }
      }
    }
  }
  
  // Return true if we have a good semantic match (>30% of terms matched)
  return (matchScore / totalTerms) >= 0.3
}



// Match selection
const toggleMatchSelection = (match) => {
  const index = selectedMatches.value.indexOf(match.id)
  if (index > -1) {
    selectedMatches.value.splice(index, 1)
  } else {
    selectedMatches.value.push(match.id)
  }
}

const selectAllMatches = () => {
  selectedMatches.value = elementMatches.value.map(match => match.id)
}

const clearAllSelections = () => {
  selectedMatches.value = []
}

const expandMatch = (match) => {
  match.expanded = !match.expanded
}

// File selection
const toggleFileSelection = (file) => {
  const index = selectedFiles.value.indexOf(file.name)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  } else {
    selectedFiles.value.push(file.name)
  }
}

// Preview functionality
const previewFile = (file) => {
  previewData.value = {
    title: file.studyName || file.name,
    name: file.name,
    content: file.data
  }
}

// Load single file
const loadSingleFile = (file) => {
  emit('load-data', file.data)
  emit('close')
}

// Load selected elements
const loadSelectedElements = () => {
  if (selectedMatches.value.length === 0) return
  
  const selectedMatchData = elementMatches.value.filter(match => 
    selectedMatches.value.includes(match.id)
  )
  
  // Create a USDM structure with selected elements
  const elementData = {
    [searchConfig.elementType]: selectedMatchData.map(match => match.element)
  }
  
  // Create a study structure to load in viewer
  const combinedData = {
    study: {
      id: 'SEARCH_RESULTS',
      name: `${searchConfig.elementType} Search Results`,
      description: `${selectedMatchData.length} ${searchConfig.elementType} from ${uniqueStudyCount.value} studies`,
      versions: [{
        id: 'v1.0',
        ...elementData,
        searchMetadata: {
          searchQuery: searchConfig.query,
          elementType: searchConfig.elementType,
          resultCount: selectedMatchData.length,
          studyCount: uniqueStudyCount.value,
          searchDate: new Date().toISOString(),
          sourceStudies: [...new Set(selectedMatchData.map(m => ({ id: m.studyId, name: m.studyName })))]
        }
      }]
    }
  }
  
  emit('load-data', combinedData)
  emit('close')
}

// Load multiple files
const loadSelectedFiles = () => {
  if (selectedFiles.value.length === 0) return
  
  const selectedFileData = usdmFiles.value.filter(file => 
    selectedFiles.value.includes(file.name)
  )
  
  if (exportOptions.combineFiles && selectedFileData.length > 1) {
    // Combine multiple studies into one object
    const combinedData = {
      combinedStudies: {
        studies: selectedFileData.map(file => file.data),
        metadata: {
          source: 'USDM Repository',
          combinedDate: new Date().toISOString(),
          fileCount: selectedFileData.length,
          files: selectedFileData.map(f => f.name)
        }
      }
    }
    emit('load-data', combinedData)
  } else {
    // Load first selected file
    emit('load-data', selectedFileData[0].data)
  }
  
  emit('close')
}

// Download selected elements
const downloadSelectedElements = async () => {
  if (selectedMatches.value.length === 0) return
  
  isDownloading.value = true
  
  try {
    const selectedMatchData = elementMatches.value.filter(match => 
      selectedMatches.value.includes(match.id)
    )
    
    let exportData
    
    if (exportOptions.groupByStudy) {
      // Group elements by study
      const groupedByStudy = {}
      
      for (const match of selectedMatchData) {
        if (!groupedByStudy[match.studyId]) {
          groupedByStudy[match.studyId] = {
            studyInfo: exportOptions.includeStudyInfo ? {
              studyId: match.studyId,
              studyName: match.studyName,
              fileName: match.fileName
            } : undefined,
            [searchConfig.elementType]: []
          }
        }
        groupedByStudy[match.studyId][searchConfig.elementType].push(match.element)
      }
      
      exportData = {
        searchResults: {
          searchQuery: searchConfig.query || '',
          elementType: searchConfig.elementType,
          totalMatches: selectedMatchData.length,
          studiesCount: Object.keys(groupedByStudy).length,
          exportDate: new Date().toISOString()
        },
        studyGroups: groupedByStudy
      }
    } else {
      // Flat list of elements
      exportData = {
        searchResults: {
          searchQuery: searchConfig.query || '',
          elementType: searchConfig.elementType,
          totalMatches: selectedMatchData.length,
          studiesCount: uniqueStudyCount.value,
          exportDate: new Date().toISOString()
        },
        [searchConfig.elementType]: selectedMatchData.map(match => ({
          element: match.element,
          sourceStudy: exportOptions.includeStudyInfo ? {
            studyId: match.studyId,
            studyName: match.studyName,
            fileName: match.fileName
          } : undefined
        }))
      }
    }
    
    const content = JSON.stringify(exportData, null, 2)
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${searchConfig.elementType}_search_results_${timestamp}.json`
    
    downloadFile(content, filename, 'application/json')
    
  } catch (error) {
    console.error('Download failed:', error)
  } finally {
    isDownloading.value = false
  }
}

// Download selected files
const downloadSelectedFiles = async () => {
  if (selectedFiles.value.length === 0) return
  
  isDownloading.value = true
  
  try {
    const selectedFileData = usdmFiles.value.filter(file => 
      selectedFiles.value.includes(file.name)
    )
    
    if (selectedFileData.length === 1) {
      // Download single file
      const file = selectedFileData[0]
      const content = JSON.stringify(file.data, null, 2)
      downloadFile(content, file.name, 'application/json')
    } else {
      // Download multiple files as zip (simplified as combined JSON for demo)
      const combinedData = {
        files: selectedFileData.map(file => ({
          filename: file.name,
          content: file.data,
          metadata: exportOptions.includeMetadata ? {
            size: file.size,
            lastModified: file.lastModified,
            studyId: file.studyId,
            studyName: file.studyName
          } : undefined
        })),
        exportInfo: {
          exportDate: new Date().toISOString(),
          fileCount: selectedFileData.length,
          combineFiles: exportOptions.combineFiles
        }
      }
      
      const content = JSON.stringify(combinedData, null, 2)
      const timestamp = new Date().toISOString().split('T')[0]
      downloadFile(content, `usdm_files_${timestamp}.json`, 'application/json')
    }
    
  } catch (error) {
    console.error('Download failed:', error)
  } finally {
    isDownloading.value = false
  }
}

const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Utility functions for extracting USDM metadata
const extractStudyId = (data) => {
  try {
    // Try multiple common USDM paths for study ID
    const possibleIds = [
      data?.study?.id,
      data?.studyDefinitions?.[0]?.study?.id,
      data?.studyDesign?.study?.id,
      data?.studyProtocol?.id,
      data?.protocol?.id,
      data?.id,
      // Try nested versions
      data?.study?.versions?.[0]?.id,
      data?.studyDefinitions?.[0]?.study?.versions?.[0]?.id
    ]
    
    for (const id of possibleIds) {
      if (id && typeof id === 'string' && id.trim() !== '') {
        return id.trim()
      }
    }
    
    return null // Return null instead of 'Unknown' so we can use filename as fallback
  } catch {
    return null
  }
}

const extractStudyName = (data) => {
  try {
    // Try multiple common USDM paths for study name
    const possibleNames = [
      data?.study?.name,
      data?.study?.title,
      data?.study?.briefTitle,
      data?.studyDefinitions?.[0]?.study?.name,
      data?.studyDefinitions?.[0]?.study?.title,
      data?.studyDesign?.study?.name,
      data?.studyProtocol?.name,
      data?.protocol?.name,
      data?.name,
      data?.title
    ]
    
    for (const name of possibleNames) {
      if (name && typeof name === 'string' && name.trim() !== '') {
        return name.trim()
      }
    }
    
    return null // Return null so we can use filename as fallback
  } catch {
    return null
  }
}

const extractVersion = (data) => {
  try {
    return data?.study?.versions?.[0]?.id ||
           data?.version ||
           data?.studyDefinitions?.[0]?.study?.versions?.[0]?.id ||
           '1.0'
  } catch {
    return '1.0'
  }
}

const extractDescription = (data) => {
  try {
    return data?.study?.description ||
           data?.study?.briefTitle ||
           data?.description ||
           data?.studyDefinitions?.[0]?.study?.description ||
           'No description available'
  } catch {
    return 'No description available'
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<style scoped>
.repository-manager {
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Noto Sans', Arial, sans-serif;
}

.modal-box {
  background: var(--panel, #121734);
  border: 1px solid var(--border, #243070);
}

.card {
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-1px);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
}

/* Fix text alignment and wrapping */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-wrap: break-word;
  hyphens: auto;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Ensure badges don't overflow */
.badge.max-w-32 {
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Better spacing for file cards */
.card-body {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Ensure buttons stay aligned */
.flex-shrink-0 {
  flex-shrink: 0;
}

.min-w-0 {
  min-width: 0;
}
</style>
