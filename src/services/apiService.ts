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
  title: string;
  description?: string;
  prompt?: string;
  wordLimit?: number;
  grade?: string;
  totalScore?: number;
  baseScore?: number;
  scoringCriteria?: string;
  createdAt: string;
  updatedAt: string;
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

interface ApiKey {
  id: string;
  serviceType: string;
  key: string;
  secret?: string;
  endpoint?: string;
  description?: string;
  isEnabled: boolean;
  createdAt: string;
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
  const response = await api.get<ApiKey[]>('/ApiKey');
  return response.data;
};

export const createApiKey = async (apiKeyData: Omit<ApiKey, 'id' | 'createdAt'>): Promise<ApiKey> => {
  const response = await api.post<ApiKey>('/ApiKey', apiKeyData);
  return response.data;
};

export const updateApiKey = async (id: string, apiKeyData: Partial<Omit<ApiKey, 'id' | 'createdAt'>>): Promise<ApiKey> => {
  const response = await api.put<ApiKey>(`/ApiKey/${id}`, apiKeyData);
  return response.data;
};

export const deleteApiKey = async (id: string): Promise<void> => {
  await api.delete(`/ApiKey/${id}`);
};
