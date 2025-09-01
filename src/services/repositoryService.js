import axios from 'axios'

class RepositoryService {
  constructor() {
    this.baseURL = null
    this.authConfig = null
    this.client = null
  }

  // Configure the repository connection
  configure(baseURL, authConfig = null) {
    this.baseURL = baseURL
    this.authConfig = authConfig
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Add authentication headers if provided
    if (authConfig && authConfig.apiKey) {
      switch (authConfig.type) {
        case 'bearer':
          this.client.defaults.headers.common['Authorization'] = `Bearer ${authConfig.apiKey}`
          break
        case 'api-key':
          this.client.defaults.headers.common['X-API-Key'] = authConfig.apiKey
          break
        case 'basic':
          this.client.defaults.headers.common['Authorization'] = `Basic ${btoa(authConfig.apiKey)}`
          break
      }
    }

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Repository API Error:', error)
        throw this.formatError(error)
      }
    )
  }

  // Test repository connection
  async testConnection() {
    if (!this.client) {
      throw new Error('Repository not configured')
    }

    try {
      // Try to hit a health/status endpoint
      const response = await this.client.get('/health')
      return { success: true, data: response.data }
    } catch (error) {
      // If health endpoint doesn't exist, try a basic endpoint
      try {
        const response = await this.client.get('/')
        return { success: true, data: response.data }
      } catch (fallbackError) {
        throw fallbackError
      }
    }
  }

  // Search repository content
  async search(searchConfig) {
    if (!this.client) {
      throw new Error('Repository not configured')
    }

    const params = {
      q: searchConfig.query,
      type: searchConfig.type !== 'all' ? searchConfig.type : undefined,
      ...this.buildFilterParams(searchConfig.filters)
    }

    try {
      const response = await this.client.get('/search', { params })
      return this.formatSearchResults(response.data)
    } catch (error) {
      // For demo purposes, return mock data if API fails
      console.warn('API search failed, returning mock data:', error.message)
      return this.getMockSearchResults(searchConfig)
    }
  }

  // Get detailed content by ID
  async getContent(contentId, type = null) {
    if (!this.client) {
      throw new Error('Repository not configured')
    }

    try {
      const endpoint = type ? `/${type}/${contentId}` : `/content/${contentId}`
      const response = await this.client.get(endpoint)
      return response.data
    } catch (error) {
      // Return mock detailed content for demo
      return this.getMockDetailedContent(contentId, type)
    }
  }

  // Download multiple items
  async downloadContent(itemIds, format = 'json', options = {}) {
    if (!this.client) {
      throw new Error('Repository not configured')
    }

    try {
      const response = await this.client.post('/download', {
        items: itemIds,
        format: format,
        options: options
      }, {
        responseType: format === 'json' ? 'json' : 'blob'
      })

      return response.data
    } catch (error) {
      // For demo, generate mock download content
      return this.generateMockDownload(itemIds, format, options)
    }
  }

  // Helper methods
  buildFilterParams(filters) {
    const params = {}
    
    if (filters.phase) params.phase = filters.phase
    if (filters.therapeuticArea) params.therapeutic_area = filters.therapeuticArea
    if (filters.studyType) params.study_type = filters.studyType
    if (filters.dateFrom) params.date_from = filters.dateFrom
    if (filters.dateTo) params.date_to = filters.dateTo

    return params
  }

  formatSearchResults(apiData) {
    // Normalize API response to consistent format
    if (Array.isArray(apiData)) {
      return apiData.map(this.normalizeResultItem)
    }
    
    if (apiData.results) {
      return apiData.results.map(this.normalizeResultItem)
    }
    
    if (apiData.data) {
      return apiData.data.map(this.normalizeResultItem)
    }

    return []
  }

  normalizeResultItem(item) {
    return {
      id: item.id || item._id || item.identifier,
      title: item.title || item.name || item.label,
      description: item.description || item.summary || '',
      type: item.type || item.category || 'Unknown',
      phase: item.phase || item.study_phase,
      therapeuticArea: item.therapeutic_area || item.indication,
      studyType: item.study_type || item.design_type,
      createdDate: item.created_date || item.created_at,
      modifiedDate: item.modified_date || item.updated_at
    }
  }

  formatError(error) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const message = error.response.data?.message || error.response.statusText
      
      if (status === 401) {
        return new Error('Authentication failed. Please check your credentials.')
      } else if (status === 403) {
        return new Error('Access denied. Insufficient permissions.')
      } else if (status === 404) {
        return new Error('Repository endpoint not found.')
      } else if (status >= 500) {
        return new Error('Repository server error. Please try again later.')
      } else {
        return new Error(`Repository error: ${message}`)
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection and repository URL.')
    } else {
      // Other error
      return new Error(`Request error: ${error.message}`)
    }
  }

  // Mock data generators for demo purposes
  getMockSearchResults(searchConfig) {
    const mockData = {
      activities: [
        {
          id: 'ACT_001',
          title: 'Baseline Assessment',
          description: 'Comprehensive baseline assessment including vital signs, laboratory tests, and medical history collection',
          type: 'Activity',
          phase: '1',
          therapeuticArea: 'Oncology',
          studyType: 'interventional'
        },
        {
          id: 'ACT_002',
          title: 'Treatment Administration',
          description: 'Administration of investigational medicinal product according to protocol schedule',
          type: 'Activity',
          phase: '2',
          therapeuticArea: 'Oncology',
          studyType: 'interventional'
        },
        {
          id: 'ACT_003',
          title: 'Safety Follow-up',
          description: 'Post-treatment safety monitoring and adverse event assessment',
          type: 'Activity',
          phase: '2',
          therapeuticArea: 'Oncology',
          studyType: 'interventional'
        }
      ],
      biomedicalConcepts: [
        {
          id: 'BC_001',
          title: 'Tumor Response',
          description: 'Assessment of tumor response according to RECIST v1.1 criteria',
          type: 'Biomedical Concept',
          phase: '2',
          therapeuticArea: 'Oncology',
          studyType: 'interventional'
        },
        {
          id: 'BC_002',
          title: 'Overall Survival',
          description: 'Time from randomization to death from any cause',
          type: 'Biomedical Concept',
          phase: '3',
          therapeuticArea: 'Oncology',
          studyType: 'interventional'
        },
        {
          id: 'BC_003',
          title: 'Progression-Free Survival',
          description: 'Time from randomization to disease progression or death',
          type: 'Biomedical Concept',
          phase: '3',
          therapeuticArea: 'Oncology',
          studyType: 'interventional'
        }
      ],
      arms: [
        {
          id: 'ARM_001',
          title: 'Treatment Arm A',
          description: 'Investigational drug X at 100mg daily + standard of care',
          type: 'Study Arm',
          phase: '2',
          therapeuticArea: 'Oncology',
          studyType: 'interventional'
        },
        {
          id: 'ARM_002',
          title: 'Control Arm',
          description: 'Placebo + standard of care therapy',
          type: 'Study Arm',
          phase: '2',
          therapeuticArea: 'Oncology',
          studyType: 'interventional'
        }
      ],
      epochs: [
        {
          id: 'EP_001',
          title: 'Screening Period',
          description: 'Patient screening and eligibility assessment phase',
          type: 'Study Epoch',
          phase: '1',
          therapeuticArea: 'Oncology',
          studyType: 'interventional'
        },
        {
          id: 'EP_002',
          title: 'Treatment Period',
          description: 'Active treatment administration phase',
          type: 'Study Epoch',
          phase: '2',
          therapeuticArea: 'Oncology',
          studyType: 'interventional'
        }
      ],
      encounters: [
        {
          id: 'ENC_001',
          title: 'Baseline Visit',
          description: 'Initial patient assessment and baseline measurements',
          type: 'Encounter',
          phase: '1',
          therapeuticArea: 'Oncology',
          studyType: 'interventional'
        },
        {
          id: 'ENC_002',
          title: 'Treatment Visit 1',
          description: 'First treatment administration visit',
          type: 'Encounter',
          phase: '2',
          therapeuticArea: 'Oncology',
          studyType: 'interventional'
        }
      ]
    }

    const searchType = searchConfig.type === 'all' ? 
      Object.keys(mockData) : [searchConfig.type]
    
    let results = []
    for (const type of searchType) {
      if (mockData[type]) {
        results = results.concat(mockData[type])
      }
    }

    // Filter by search query
    if (searchConfig.query) {
      const query = searchConfig.query.toLowerCase()
      results = results.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      )
    }

    // Apply additional filters
    if (searchConfig.filters.phase) {
      results = results.filter(item => item.phase === searchConfig.filters.phase)
    }
    
    if (searchConfig.filters.therapeuticArea) {
      const area = searchConfig.filters.therapeuticArea.toLowerCase()
      results = results.filter(item => 
        item.therapeuticArea?.toLowerCase().includes(area)
      )
    }

    return results
  }

  getMockDetailedContent(contentId, type) {
    return {
      id: contentId,
      title: `Detailed ${type || 'Content'}: ${contentId}`,
      description: 'Detailed content retrieved from repository',
      type: type || 'Content',
      metadata: {
        version: '1.0',
        created: '2024-01-15T10:00:00Z',
        modified: '2024-01-20T14:30:00Z',
        author: 'Study Team',
        status: 'Active'
      },
      properties: {
        duration: '4 weeks',
        frequency: 'Daily',
        route: 'Oral',
        dose: '100mg'
      },
      relationships: [
        {
          type: 'part_of',
          target: 'STUDY_001',
          description: 'Part of main study protocol'
        }
      ]
    }
  }

  generateMockDownload(itemIds, format, options) {
    const items = itemIds.map(id => this.getMockDetailedContent(id))
    
    if (format === 'json') {
      return {
        format: 'json',
        content: items,
        metadata: {
          downloadDate: new Date().toISOString(),
          itemCount: items.length,
          options: options
        }
      }
    }

    // For other formats, return formatted content
    return {
      format: format,
      content: items,
      filename: `usdm_export_${Date.now()}.${format}`
    }
  }
}

// Export singleton instance
export default new RepositoryService()
