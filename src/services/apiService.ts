import api from './api';

// 定义通用的 API 响应类型 (根据后端实际返回结构调整)
interface ApiResponse<T> {
  data: T;
  // 可能还有其他字段，如 status, message 等
}

// 定义各个模块的数据类型 (根据后端实际返回结构定义)
export interface Student {
  id: string;
  name: string;
  studentId: string;
  classId?: string;
  className?: string; // Added for convenience in frontend
  phone?: string;
  email?: string;
  studentCount?: number; // Used in Class list
}

interface Class {
  id: string;
  name: string;
  studentCount?: number; // Added for convenience in frontend
}

export interface Assignment {
  id: string;
  prompt?: string;
  wordLimit?: number;
  grade?: string;
  totalScore?: number;
  baseScore?: number;
  scoringCriteria?: string;
  createdAt: string;
  titleContext?: string; // For title context
  updatedAt: string;
  description?: string; // Added for convenience in frontend
}

export interface Submission {
  id: string;
  title: string; // Assuming submission has a title or gets it from assignment
  studentId: string;
  assignmentId: string;
  imageUrl: string;
  parsedText?: string;
  aiResults?: any[]; // Define a more specific type if needed
  judgeResult?: string;
  finalScore?: number;
  status: 'Submitted' | 'Evaluating' | 'Evaluated';
  createdAt: string;
  submissionDate: string; // Alias for createdAt or a separate field? Check backend
  studentName?: string; // Added for convenience in frontend
  className?: string; // Added for convenience in frontend
  assignmentTitle?: string; // Added for convenience in frontend
}

// Define AIModel interface
export interface AIModel {
  id: string;
  modelId: string;
  serviceType?: string;
  apiKeyId?: string;
}

export interface ApiKey {
  id: string;
  serviceType: string;
  key: string;
  secret?: string;
  endpoint?: string;
  description?: string;
  isEnabled: boolean;
  createdAt: string;
  AIModels?: AIModel[]; // Add AIModels property
}

// Define AIModelUsageSetting interface
export interface AIModelUsageSetting {
  id: string;
  usageType: string;
  aiModelId: string;
  aiModel?: AIModel; // Include the related AIModel object
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServerStatus {
  serverStatus: string;
  serverTimeUtc: string;
  uptime: string;
  build: {
    version: string;
    gitCommit: string;
  };
  application: {
    environment: string;
    framework: string;
    processId: number;
    memoryUsage: string;
    totalAllocatedMemory: string;
    threadCount: number;
  };
  system: {
    hostName: string;
    serverIpAddresses: string;
    os: string;
    osArchitecture: string;
    processorCount: number;
  };
  request: {
    clientIp: string;
  };
  databaseStatus: string;
}


// --- 学生管理 API ---

export const getStudents = async (filters: { classId?: string, searchTerm?: string }): Promise<Student[]> => {
  let url = '/Student';
  const params = new URLSearchParams();

  if (filters.classId) {
    params.append('classId', filters.classId);
  }

  if (filters.searchTerm) {
    params.append('searchTerm', filters.searchTerm);
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await api.get<Student[]>(url);
  return response.data;
};

export const getStudentById = async (id: string): Promise<Student> => {
  const response = await api.get<Student>(`/Student/${id}`);
  return response.data;
};

export const createStudent = async (studentData: Omit<Student, 'id' | 'className' | 'studentCount'>): Promise<Student> => {
  const response = await api.post<Student>('/Student', studentData);
  return response.data;
};

export const updateStudent = async (id: string, studentData: Partial<Omit<Student, 'id' | 'className' | 'studentCount'>>): Promise<Student> => {
  const response = await api.put<Student>(`/Student/${id}`, studentData);
  return response.data;
};

export const deleteStudent = async (id: string): Promise<void> => {
  await api.delete(`/Student/${id}`);
};


// --- 班级管理 API ---

export const getClasses = async (): Promise<Class[]> => {
  const response = await api.get<Class[]>('/Class');
  return response.data;
};

export const getClassById = async (id: string): Promise<Class> => {
  const response = await api.get<Class>(`/Class/${id}`);
  return response.data;
};

export const createClass = async (classData: Omit<Class, 'id' | 'studentCount'>): Promise<Class> => {
  const response = await api.post<Class>('/Class', classData);
  return response.data;
};

export const updateClass = async (id: string, classData: Partial<Omit<Class, 'id' | 'studentCount'>>): Promise<Class> => {
  const response = await api.put<Class>(`/Class/${id}`, classData);
  return response.data;
};

export const deleteClass = async (id: string): Promise<void> => {
  await api.delete(`/Class/${id}`);
};


// --- 测验管理 API ---

export const getAssignments = async (): Promise<Assignment[]> => {
  const response = await api.get<Assignment[]>('/EssayAssignment');
  return response.data;
};

export const getAssignmentById = async (id: string): Promise<Assignment> => {
  const response = await api.get<Assignment>(`/EssayAssignment/${id}`);
  return response.data;
};

export const createAssignment = async (assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assignment> => {
  const response = await api.post<Assignment>('/EssayAssignment', assignmentData);
  return response.data;
};

export const updateAssignment = async (id: string, assignmentData: Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Assignment> => {
  const response = await api.put<Assignment>(`/EssayAssignment/${id}`, assignmentData);
  return response.data;
};

export const deleteAssignment = async (id: string): Promise<void> => {
  await api.delete(`/EssayAssignment/${id}`);
};


// --- 作文提交管理 API ---

export const searchSubmissions = async (filters: { assignmentId?: string, studentId?: string, top?: number }): Promise<Submission[]> => {
  let url = '/EssaySubmissionSearch';
  const params = new URLSearchParams();

  if (filters.assignmentId) {
    params.append('assignmentId', filters.assignmentId);
  }

  if (filters.studentId) {
    params.append('studentId', filters.studentId);
  }

  if (filters.top) {
    params.append('top', filters.top.toString());
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await api.get<Submission[]>(url);
  return response.data;
};

export const getSubmissionById = async (id: string): Promise<Submission> => {
  const response = await api.get<Submission>(`/EssaySubmission/${id}`);
  return response.data;
};

export const uploadEssaySubmission = async (assignmentId: string, imageFile: File, columnCount: number): Promise<{ submissionId: string }> => {
  const formData = new FormData();
  formData.append('essayAssignmentId', assignmentId);
  formData.append('imageFile', imageFile);
  formData.append('columnCount', columnCount.toString());

  const response = await api.post<{ submissionId: string }>('/EssaySubmission', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const submitSubmissionForEvaluation = async (id: string): Promise<void> => {
  await api.post(`/EssaySubmission/${id}/evaluate`);
};

export const updateSubmissionScore = async (id: string, score: number): Promise<Submission> => {
  // Assuming the backend endpoint is /EssaySubmission/{id}/score and accepts { score: number }
  // Note: The original code used /api/EssaySubmissions/{id}/score, which might be incorrect based on other calls.
  // Using /EssaySubmission/{id} with a PUT request and sending the full object including score might be more standard.
  // Let's assume a specific endpoint for score update exists or use the PUT on the main resource.
  // Based on the original code's PUT on /Student/{id}, let's assume PUT on /EssaySubmission/{id} is the way.
  // However, the original code in [id].vue used a POST to /api/EssaySubmissions/{id}/score.
  // Let's stick to the original POST endpoint for score update for now, assuming it's correct.
  // If the backend uses PUT on the main resource, this function needs adjustment.
   const response = await api.put<Submission>(`/EssaySubmission/${id}`, { finalScore: score });
   return response.data;
};


// --- API Key 管理 API ---

export const getApiKeys = async (): Promise<ApiKey[]> => {
  // Assuming backend GET /api/ApiKey now includes AIModels
  const response = await api.get<ApiKey[]>('/api/ApiKey');
  return response.data;
};

export const getApiKeyById = async (id: string): Promise<ApiKey> => {
   // Assuming backend GET /api/ApiKey/{id} now includes AIModels
  const response = await api.get<ApiKey>(`/api/ApiKey/${id}`);
  return response.data;
};


export const createApiKey = async (apiKeyData: Omit<ApiKey, 'id' | 'createdAt' | 'AIModels'> & { modelIds?: string[] }): Promise<ApiKey> => {
  // Backend expects form data, so we need to use FormData
  const formData = new FormData();
  formData.append('serviceType', apiKeyData.serviceType);
  formData.append('key', apiKeyData.key);
  if (apiKeyData.secret !== undefined && apiKeyData.secret !== null) formData.append('secret', apiKeyData.secret);
  if (apiKeyData.endpoint !== undefined && apiKeyData.endpoint !== null) formData.append('endpoint', apiKeyData.endpoint);
  if (apiKeyData.description !== undefined && apiKeyData.description !== null) formData.append('description', apiKeyData.description);
  // Add modelIds if provided
  if (apiKeyData.modelIds && apiKeyData.modelIds.length > 0) {
      apiKeyData.modelIds.forEach(modelId => {
          formData.append('modelIds', modelId);
      });
  }

  const response = await api.post<ApiKey>('/api/ApiKey', formData, {
     headers: {
      'Content-Type': 'multipart/form-data' // Ensure correct content type for form data
    }
  });
  return response.data;
};

export const updateApiKey = async (id: string, apiKeyData: Partial<Omit<ApiKey, 'id' | 'createdAt' | 'AIModels'>> & { modelIds?: string[] }): Promise<void> => {
   // Backend expects form data, so we need to use FormData
  const formData = new FormData();
  // Only append fields that are provided in the partial object
  if (apiKeyData.serviceType !== undefined) formData.append('serviceType', apiKeyData.serviceType);
  if (apiKeyData.key !== undefined) formData.append('key', apiKeyData.key);
  if (apiKeyData.secret !== undefined) formData.append('secret', apiKeyData.secret);
  if (apiKeyData.endpoint !== undefined) formData.append('endpoint', apiKeyData.endpoint);
  if (apiKeyData.description !== undefined) formData.append('description', apiKeyData.description);
  if (apiKeyData.isEnabled !== undefined) formData.append('isEnabled', apiKeyData.isEnabled.toString());

  // Add modelIds if provided
  // Note: Backend expects List<string> modelIds from form.
  // If modelIds is explicitly set to an empty array, we should send it to clear models.
  // If modelIds is undefined, we don't send the parameter, leaving existing models untouched.
  if (apiKeyData.modelIds !== undefined) {
       // Clear existing modelIds first by sending an empty list if needed, or just send the new list
       // The backend PUT logic handles adding/removing based on the provided list vs existing.
       apiKeyData.modelIds.forEach(modelId => {
           formData.append('modelIds', modelId);
       });
       // If modelIds is an empty array, the loop won't run, and the 'modelIds' key won't be in formData.
       // The backend needs to handle the absence of 'modelIds' or an empty list correctly.
       // Based on the backend code, sending an empty list seems to be the way to remove all models.
       // FormData doesn't easily support sending an *empty* list parameter explicitly if the list is empty.
       // A common workaround is to send a special marker or rely on backend interpretation.
       // Let's assume the backend correctly interprets the absence of the 'modelIds' key as "no change"
       // and an empty list (if sent) as "remove all".
       // To send an empty list explicitly, you might need to send an empty string for the key,
       // or the backend might need to accept a JSON body instead of form data for complex updates.
       // Sticking to form data as per backend code, we just append if the list is not empty.
       // If you need to explicitly send an empty list via form data, backend might need adjustment
       // or you might need to send a dummy value like `formData.append('modelIds', '');` if the list is empty.
       // Let's assume the backend handles an empty list correctly if the parameter is present.
       // To ensure the parameter is present even if the list is empty, we can add a check:
       if (apiKeyData.modelIds.length === 0) {
           // Append an empty value if the list is empty to signal removal
           // This might depend on backend implementation, but sending an empty string is a common way
           // to ensure the parameter key exists in the form data even with no values.
           // The backend code seems to iterate over the values associated with the key,
           // so an empty list of values should result in no models being added and existing ones being removed.
           // Let's remove this explicit empty append as the backend code seems to handle the list correctly.
           // If modelIds is an empty array, the forEach loop simply won't run, and the 'modelIds' key won't be added to formData.
           // The backend PUT method checks `modelIds?.Distinct().ToList() ?? new List<string>()`. If the key is absent, `modelIds` will be null, resulting in an empty list. This seems correct.
       } else {
            apiKeyData.modelIds.forEach(modelId => {
                formData.append('modelIds', modelId);
            });
       }
  }


  await api.put(`/api/ApiKey/${id}`, formData, {
     headers: {
      'Content-Type': 'multipart/form-data' // Ensure correct content type for form data
    }
  });
};

export const deleteApiKey = async (id: string): Promise<void> => {
  await api.delete(`/api/ApiKey/${id}`);
};

// --- AI Model API ---
// Assuming a backend endpoint exists to get all AI Models
export const getAllAIModels = async (): Promise<AIModel[]> => {
  // Replace with the actual backend endpoint if different
  const response = await api.get<AIModel[]>('/api/ApiKey/all-models'); // Using the new endpoint in ApiKeyController
  return response.data;
};


// --- AI Model Usage Settings API ---

export const getAIModelUsageSettings = async (): Promise<AIModelUsageSetting[]> => {
  const response = await api.get<AIModelUsageSetting[]>('/api/ApiKey/model-usage-settings');
  return response.data;
};

export const createAIModelUsageSetting = async (settingData: Omit<AIModelUsageSetting, 'id' | 'createdAt' | 'updatedAt' | 'aiModel'>): Promise<AIModelUsageSetting> => {
   // Backend expects form data
   const formData = new FormData();
   formData.append('usageType', settingData.usageType);
   formData.append('aiModelId', settingData.aiModelId);
   formData.append('isEnabled', settingData.isEnabled.toString());

   const response = await api.post<AIModelUsageSetting>('/api/ApiKey/model-usage-settings', formData, {
      headers: {
       'Content-Type': 'multipart/form-data'
     }
   });
   return response.data;
};

export const updateAIModelUsageSetting = async (id: string, settingData: Partial<Omit<AIModelUsageSetting, 'id' | 'createdAt' | 'updatedAt' | 'aiModel'>>): Promise<void> => {
   // Backend expects form data
   const formData = new FormData();
   // Only append fields that are provided in the partial object
   if (settingData.usageType !== undefined) formData.append('usageType', settingData.usageType);
   if (settingData.aiModelId !== undefined) formData.append('aiModelId', settingData.aiModelId);
   if (settingData.isEnabled !== undefined) formData.append('isEnabled', settingData.isEnabled.toString());

   await api.put(`/api/ApiKey/model-usage-settings/${id}`, formData, {
      headers: {
       'Content-Type': 'multipart/form-data'
     }
   });
};

export const deleteAIModelUsageSetting = async (id: string): Promise<void> => {
  await api.delete(`/api/ApiKey/model-usage-settings/${id}`);
};


// --- Server Status API ---
export const getServerStatus = async (): Promise<ServerStatus> => {
  const response = await api.get<ServerStatus>('/api/Status');
  return response.data;
};
