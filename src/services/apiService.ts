import httpClient from './httpClient'
import type {
  Student,
  Class,
  Assignment,
  Submission,
  EssayAssignment,
  AIModel,
  ApiKey,
  AIModelUsageSetting,
  ExportFilterDto,
  ServerStatus,
  StudentForUpload,
  ClassWithStudents,
  QueriedEssay,
  ApiKeyUpdateDto
} from './types'

export type {
  Student,
  Class,
  Assignment,
  Submission,
  EssayAssignment,
  AIModel,
  ApiKey,
  AIModelUsageSetting,
  ExportFilterDto,
  ServerStatus,
  StudentForUpload,
  ClassWithStudents,
  QueriedEssay,
  ApiKeyUpdateDto
}

export const getStudentInfoForUpload = async (): Promise<ClassWithStudents[]> => {
  const response = await httpClient.get<ClassWithStudents[]>('/essay/studentupload/studentinfo')
  return response.data
}

export const getAssignmentsForStudent = async (studentId: string): Promise<Assignment[]> => {
  const response = await httpClient.get<Assignment[]>(`/essay/studentupload/assignments/${studentId}`)
  return response.data
}

export const checkEssayImage = async (imageFile: File): Promise<{ success: boolean; processedImageUrl: string; message?: string }> => {
  const formData = new FormData()
  formData.append('file', imageFile)
  const response = await httpClient.post<{ success: boolean; processedImageUrl: string; message?: string }>('/essay/studentupload/checkimg', formData, {
    validateStatus: (status) => status < 500,
  })
  return response.data
}

export const submitEssayWithImage = async (data: { studentId: string; essayAssignmentId: string; processedImageUrl: string; columnCount: number }): Promise<{ id: string }> => {
  const formData = new FormData()
  formData.append('StudentId', data.studentId)
  formData.append('EssayAssignmentId', data.essayAssignmentId)
  formData.append('ProcessedImageUrl', data.processedImageUrl)
  formData.append('ColumnCount', data.columnCount.toString())
  const response = await httpClient.post<{ id: string }>('/essay/studentupload/submit', formData)
  return response.data
}

export const submitEssayWithText = async (data: { studentId: string; essayAssignmentId: string; prasedText: string }): Promise<{ id: string }> => {
  const formData = new FormData()
  formData.append('StudentId', data.studentId)
  formData.append('EssayAssignmentId', data.essayAssignmentId)
  formData.append('PrasedText', data.prasedText)
  const response = await httpClient.post<{ id: string }>('/essay/studentupload/submit/hasprased', formData)
  return response.data
}

export const queryEssayByShortId = async (shortId: string): Promise<QueriedEssay> => {
  const response = await httpClient.get<QueriedEssay>(`/essay/studentupload/query/${shortId}`)
  return response.data
}

export const getStudents = async (filters: { classId?: string, searchTerm?: string }): Promise<Student[]> => {
  let url = '/Student'
  const params = new URLSearchParams()

  if (filters.classId) {
    params.append('classId', filters.classId)
  }

  if (filters.searchTerm) {
    params.append('searchTerm', filters.searchTerm)
  }

  if (params.toString()) {
    url += `?${params.toString()}`
  }

  const response = await httpClient.get<Student[]>(url)
  return response.data
}

export const getStudentById = async (id: string): Promise<Student> => {
  const response = await httpClient.get<Student>(`/Student/${id}`)
  return response.data
}

export const createStudent = async (studentData: Omit<Student, 'id' | 'className' | 'studentCount'>): Promise<Student> => {
  const response = await httpClient.post<Student>('/Student', studentData)
  return response.data
}

export const updateStudent = async (id: string, studentData: Partial<Omit<Student, 'id' | 'className' | 'studentCount'>>): Promise<Student> => {
  const response = await httpClient.put<Student>(`/Student/${id}`, studentData)
  return response.data
}

export const deleteStudent = async (id: string): Promise<void> => {
  await httpClient.delete(`/Student/${id}`)
}

export const getClasses = async (): Promise<Class[]> => {
  const response = await httpClient.get<Class[]>('/Class')
  return response.data
}

export const getClassById = async (id: string): Promise<Class> => {
  const response = await httpClient.get<Class>(`/Class/${id}`)
  return response.data
}

export const createClass = async (classData: Omit<Class, 'id' | 'studentCount'>): Promise<Class> => {
  const response = await httpClient.post<Class>('/Class', classData)
  return response.data
}

export const updateClass = async (id: string, classData: Partial<Omit<Class, 'id' | 'studentCount'>>): Promise<Class> => {
  const response = await httpClient.put<Class>(`/Class/${id}`, classData)
  return response.data
}

export const deleteClass = async (id: string): Promise<void> => {
  await httpClient.delete(`/Class/${id}`)
}

export const getAssignments = async (): Promise<Assignment[]> => {
  const response = await httpClient.get<Assignment[]>('/EssayAssignment', {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  })
  return response.data
}

export const getAssignmentById = async (id: string): Promise<Assignment> => {
  const response = await httpClient.get<Assignment>(`/EssayAssignment/${id}`)
  return response.data
}

export const createAssignment = async (assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assignment> => {
  const response = await httpClient.post<Assignment>('/EssayAssignment', assignmentData)
  return response.data
}

export const updateAssignment = async (assignmentData: Assignment): Promise<Assignment> => {
  const response = await httpClient.put<Assignment>('/EssayAssignment', assignmentData)
  return response.data
}

export const deleteAssignment = async (id: string): Promise<void> => {
  await httpClient.delete(`/EssayAssignment/${id}`)
}

export const searchSubmissions = async (filters: { assignmentId?: string, studentId?: string, top?: number }): Promise<Submission[]> => {
  let url = '/EssaySubmissionSearch'
  const params = new URLSearchParams()

  if (filters.assignmentId) {
    params.append('assignmentId', filters.assignmentId)
  }

  if (filters.studentId) {
    params.append('studentId', filters.studentId)
  }

  if (filters.top) {
    params.append('top', filters.top.toString())
  }

  if (params.toString()) {
    url += `?${params.toString()}`
  }

  const response = await httpClient.get<Submission[]>(url)
  return response.data
}

export const getSubmissionById = async (id: string): Promise<Submission> => {
  const response = await httpClient.get<Submission>(`/EssaySubmission/${id}`)
  return response.data
}

export const uploadEssaySubmission = async (assignmentId: string, imageFile: File, columnCount: number, enableV3: boolean): Promise<{ submissionId: string }> => {
  const formData = new FormData()
  formData.append('essayAssignmentId', assignmentId)
  formData.append('imageFile', imageFile)
  formData.append('columnCount', columnCount.toString())
  formData.append('enableV3', enableV3.toString())

  const response = await httpClient.post<{ submissionId: string }>('/EssaySubmission', formData)
  return response.data
}

export const uploadEssayBatchSubmission = async (assignmentId: string, imageFiles: File[], columnCount: number, enableV3: boolean): Promise<{ submissionIds: string[] }> => {
  const formData = new FormData()
  formData.append('essayAssignmentId', assignmentId)
  formData.append('columnCount', columnCount.toString())
  formData.append('enableV3', enableV3.toString())
  imageFiles.forEach(file => {
    formData.append('imageFiles', file)
  })
  const response = await httpClient.post<{ submissionIds: string[] }>('/EssaySubmission/batch', formData, {
    timeout: 180000
  })
  return response.data
}

export const submitSubmissionForEvaluation = async (id: string): Promise<void> => {
  await httpClient.patch(`/EssaySubmission/${id}/rejudge`)
}

export const updateSubmissionScore = async (id: string, score?: number, studentId?: string): Promise<void> => {
  const formData = new FormData()
  if (!(score || studentId)) {
    throw new Error('score and studentId are required')
  }
  if (score) {
    formData.append('score', score.toString())
  }

  if (studentId) {
    formData.append('studentId', studentId)
  }
  await httpClient.put(`/EssaySubmission/${id}`, formData)
}

export const updateSubmissionTexts = async (id: string, parsedText: string, title: string): Promise<void> => {
  const formData = new FormData()
  formData.append('parsedText', parsedText)
  formData.append('title', title)
  await httpClient.put(`/EssaySubmission/${id}`, formData)
}

export const deleteSubmission = async (id: string): Promise<void> => {
  await httpClient.delete(`/EssaySubmission`, { params: { id } })
}

export const getApiKeys = async (): Promise<ApiKey[]> => {
  const response = await httpClient.get<ApiKey[]>('/api/ApiKey')
  return response.data
}

export const getApiKeyById = async (id: string): Promise<ApiKey> => {
  const response = await httpClient.get<ApiKey>(`/api/ApiKey/${id}`)
  return response.data
}

export const createApiKey = async (apiKeyData: Omit<ApiKey, 'id' | 'createdAt' | 'aiModels'> & { modelIds?: string[] }): Promise<ApiKey> => {
  const formData = new FormData()
  formData.append('serviceType', apiKeyData.serviceType)
  formData.append('key', apiKeyData.key)
  if (apiKeyData.secret !== undefined && apiKeyData.secret !== null) formData.append('secret', apiKeyData.secret)
  if (apiKeyData.endpoint !== undefined && apiKeyData.endpoint !== null) formData.append('endpoint', apiKeyData.endpoint)
  if (apiKeyData.description !== undefined && apiKeyData.description !== null) formData.append('description', apiKeyData.description)
  if (apiKeyData.modelIds && apiKeyData.modelIds.length > 0) {
    apiKeyData.modelIds.forEach(modelId => {
      formData.append('modelIds', modelId)
    })
  }

  const response = await httpClient.post<ApiKey>('/api/ApiKey', formData)
  return response.data
}

export const toggleApiKeyStatus = async (id: string): Promise<void> => {
  await httpClient.patch(`/api/ApiKey/${id}/toggle`)
}

export const updateApiKey = async (id: string, data: ApiKeyUpdateDto) => {
  const response = await httpClient.put(`/api/ApiKey/${id}`, data)
  return response.data
}

export const deleteApiKey = async (id: string): Promise<void> => {
  await httpClient.delete(`/api/ApiKey/${id}`)
}

export const getAllAIModels = async (): Promise<AIModel[]> => {
  const response = await httpClient.get<AIModel[]>('/api/ApiKey/all-models')
  return response.data
}

export const getAIModelUsageSettings = async (): Promise<AIModelUsageSetting[]> => {
  const response = await httpClient.get<AIModelUsageSetting[]>('/api/ApiKey/model-usage-settings')
  return response.data
}

export const createAIModelUsageSetting = async (settingData: Omit<AIModelUsageSetting, 'id' | 'createdAt' | 'updatedAt' | 'aiModel'>): Promise<AIModelUsageSetting> => {
  const formData = new FormData()
  formData.append('usageType', settingData.usageType)
  formData.append('aiModelId', settingData.aiModelId)
  formData.append('isEnabled', settingData.isEnabled.toString())

  const response = await httpClient.post<AIModelUsageSetting>('/api/ApiKey/model-usage-settings', formData)
  return response.data
}

export const updateAIModelUsageSetting = async (id: string, settingData: Partial<Omit<AIModelUsageSetting, 'id' | 'createdAt' | 'updatedAt' | 'aiModel'>>): Promise<void> => {
  const formData = new FormData()
  if (settingData.usageType !== undefined) formData.append('usageType', settingData.usageType)
  if (settingData.aiModelId !== undefined) formData.append('aiModelId', settingData.aiModelId)
  if (settingData.isEnabled !== undefined) formData.append('isEnabled', settingData.isEnabled.toString())

  await httpClient.put(`/api/ApiKey/model-usage-settings/${id}`, formData)
}

export const deleteAIModelUsageSetting = async (id: string): Promise<void> => {
  await httpClient.delete(`/api/ApiKey/model-usage-settings/${id}`)
}

export const exportEssaySubmissions = async (filter?: ExportFilterDto): Promise<Blob> => {
  const response = await httpClient.post<Blob>('/export/essays', filter, {
    responseType: 'blob'
  })
  return response.data
}

export const exportEssaySubmissionsByGet = async (
  essayAssignmentId?: string,
  essayAssignmentIds?: string[],
  classId?: string,
  startDate?: string,
  endDate?: string
): Promise<Blob> => {
  let url = '/export/essays?'
  const params = new URLSearchParams()

  if (essayAssignmentId) params.append('essayAssignmentId', essayAssignmentId)
  if (essayAssignmentIds) params.append('essayAssignmentIds', essayAssignmentIds.join(','))
  if (classId) params.append('classId', classId)
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  const response = await httpClient.get<Blob>(url + params.toString(), {
    responseType: 'blob'
  })
  return response.data
}

export const getServerStatus = async (): Promise<ServerStatus> => {
  const response = await httpClient.get<ServerStatus>('/api/Status')
  return response.data
}