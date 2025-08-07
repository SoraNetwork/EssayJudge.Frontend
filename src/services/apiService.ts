import api from './api';
// import { api as axiosApi } from '@/plugins/axios';
// import { api as axiosApi } from './plugins/axios'; // Removed due to missing module

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
  class?: { // 添加嵌套的 class 对象
    id: string;
    name: string;
  };
  phone?: string;
  email?: string;
  studentCount?: number; // 用于班级列表
}

export interface Class {
  id: string;
  name: string;
  studentCount?: number; // 为方便前端使用而添加
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
  titleContext?: string; // 用于标题上下文
  updatedAt: string;
  description?: string; // 为方便前端使用而添加
}

export interface student{
  name: string;
  classId?: string; // 假设学生有 classId
}

export interface Submission {
  id: string;
  title: string; // 假设提交有标题或从作业中获取
  studentId: string;
  assignmentId: string;
  imageUrl: string;
  parsedText?: string;
  aiResults?: any[]; // 如果需要，定义更具体的类型
  judgeResult?: string;
  finalScore?: number;
  status: 'Submitted' | 'Evaluating' | 'Evaluated';
  createdAt: string;
  submissionDate: string; // createdAt 的别名还是一个单独的字段？检查后端
  studentName?: string; // 为方便前端使用而添加
  className?: string; // 为方便前端使用而添加
  assignmentTitle?: string; // 为方便前端使用而添加
  student?: student; // 假设响应中包含学生对象
}

// 定义 AIModel 接口
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
  AIModels?: AIModel[]; // 添加 AIModels 属性
}

// 定义 AIModelUsageSetting 接口
export interface AIModelUsageSetting {
  id: string;
  usageType: string;
  aiModelId: string;
  aiModel?: AIModel; // 包含相关的 AIModel 对象
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


// --- 学生作文上传 API ---

// 用于 /essay/studentupload/studentinfo 的接口
export interface StudentForUpload {
  id: string;
  studentId: string;
  name: string;
}

export interface ClassWithStudents {
  id: string;
  name: string;
  createdAt: string;
  students: StudentForUpload[];
}

// 用于 /essay/studentupload/query/{shortId} 的接口
export interface QueriedEssay {
  id: string;
  student: {
    name: string;
    studentId: string;
  };
  createdAt: string;
  isError: boolean;
  finalScore?: number;
  judgeResult?: string;
}

export const getStudentInfoForUpload = async (): Promise<ClassWithStudents[]> => {
  const response = await api.get<ClassWithStudents[]>('/essay/studentupload/studentinfo');
  return response.data;
};

export const getAssignmentsForStudent = async (studentId: string): Promise<Assignment[]> => {
  const response = await api.get<Assignment[]>(`/essay/studentupload/assignments/${studentId}`);
  return response.data;
};

export const checkEssayImage = async (imageFile: File): Promise<{ success: boolean; processedImageUrl: string; message?: string }> => {
  const formData = new FormData();
  formData.append('file', imageFile);
  const response = await api.post<{ success: boolean; processedImageUrl: string; message?: string }>('/essay/studentupload/checkimg', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    validateStatus: (status) => status < 500,
  });
  return response.data;
};

export const submitEssayWithImage = async (data: { studentId: string; essayAssignmentId: string; processedImageUrl: string; columnCount: number }): Promise<{ id: string }> => {
  const formData = new FormData();
  formData.append('StudentId', data.studentId);
  formData.append('EssayAssignmentId', data.essayAssignmentId);
  formData.append('ProcessedImageUrl', data.processedImageUrl);
  formData.append('ColumnCount', data.columnCount.toString());
  const response = await api.post<{ id: string }>('/essay/studentupload/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const submitEssayWithText = async (data: { studentId: string; essayAssignmentId: string; prasedText: string }): Promise<{ id: string }> => {
  const formData = new FormData();
  formData.append('StudentId', data.studentId);
  formData.append('EssayAssignmentId', data.essayAssignmentId);
  formData.append('PrasedText', data.prasedText);
  const response = await api.post<{ id: string }>('/essay/studentupload/submit/hasprased', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const queryEssayByShortId = async (shortId: string): Promise<QueriedEssay> => {
  const response = await api.get<QueriedEssay>(`/essay/studentupload/query/${shortId}`);
  return response.data;
};


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
  const response = await api.get<Assignment[]>('/EssayAssignment', {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
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

// 修改测验更新函数
export const updateAssignment = async (assignmentData: Assignment): Promise<Assignment> => {
  const response = await api.put<Assignment>('/EssayAssignment', assignmentData, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
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

export const updateSubmissionScore = async (id: string, score: number, studentId?: string): Promise<void> => {
  const formData = new FormData();
  formData.append('score', score.toString());
  if (studentId) {
    formData.append('studentId', studentId);
  }
  await api.put(`/EssaySubmission/${id}`, formData);
};

export const deleteSubmission = async (id: string): Promise<void> => {
  await api.delete(`/EssaySubmission`, { params: { id } });
};


// --- API Key 管理 API ---

export const getApiKeys = async (): Promise<ApiKey[]> => {
  // 假设后端 GET /api/ApiKey 现在包含 AIModels
  const response = await api.get<ApiKey[]>('/api/ApiKey');
  return response.data;
};

export const getApiKeyById = async (id: string): Promise<ApiKey> => {
   // 假设后端 GET /api/ApiKey/{id} 现在包含 AIModels
  const response = await api.get<ApiKey>(`/api/ApiKey/${id}`);
  return response.data;
};


export const createApiKey = async (apiKeyData: Omit<ApiKey, 'id' | 'createdAt' | 'AIModels'> & { modelIds?: string[] }): Promise<ApiKey> => {
  // 后端需要表单数据，所以我们使用 FormData
  const formData = new FormData();
  formData.append('serviceType', apiKeyData.serviceType);
  formData.append('key', apiKeyData.key);
  if (apiKeyData.secret !== undefined && apiKeyData.secret !== null) formData.append('secret', apiKeyData.secret);
  if (apiKeyData.endpoint !== undefined && apiKeyData.endpoint !== null) formData.append('endpoint', apiKeyData.endpoint);
  if (apiKeyData.description !== undefined && apiKeyData.description !== null) formData.append('description', apiKeyData.description);
  // 如果提供了 modelIds，则添加
  if (apiKeyData.modelIds && apiKeyData.modelIds.length > 0) {
      apiKeyData.modelIds.forEach(modelId => {
          formData.append('modelIds', modelId);
      });
  }

  const response = await api.post<ApiKey>('/api/ApiKey', formData, {
     headers: {
      'Content-Type': 'multipart/form-data' // 确保表单数据的 Content-Type 正确
    }
  });
  return response.data;
};

export const toggleApiKeyStatus = async (id: string): Promise<void> => {
  await api.patch(`/api/ApiKey/${id}/toggle`);
};

// Define ApiKeyUpdateDto type based on expected update fields
export interface ApiKeyUpdateDto {
  serviceType?: string;
  key?: string;
  secret?: string;
  endpoint?: string;
  description?: string;
  isEnabled?: boolean;
  modelIds?: string[];
}

export const updateApiKey = async (id: string, data: ApiKeyUpdateDto) => {
  const response = await api.put(`/api/ApiKey/${id}`, data);
  return response.data;
};

export const deleteApiKey = async (id: string): Promise<void> => {
  await api.delete(`/api/ApiKey/${id}`);
};

// --- AI Model API ---
// 假设存在一个后端端点来获取所有 AI 模型
export const getAllAIModels = async (): Promise<AIModel[]> => {
  // 如果不同，请替换为实际的后端端点
  const response = await api.get<AIModel[]>('/api/ApiKey/all-models'); // 使用 ApiKeyController 中的新端点
  return response.data;
};


// --- AI Model Usage Settings API ---

export const getAIModelUsageSettings = async (): Promise<AIModelUsageSetting[]> => {
  const response = await api.get<AIModelUsageSetting[]>('/api/ApiKey/model-usage-settings');
  return response.data;
};

export const createAIModelUsageSetting = async (settingData: Omit<AIModelUsageSetting, 'id' | 'createdAt' | 'updatedAt' | 'aiModel'>): Promise<AIModelUsageSetting> => {
   // 后端需要表单数据
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
   // 后端需要表单数据
   const formData = new FormData();
   // 只附加在部分对象中提供的字段
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
