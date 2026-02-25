export interface StudentInfo {
  id: string
  name: string
  studentId: string
}

export interface SubmissionItem {
  id: string
  essayAssignmentId: string
  title: string
  isError: boolean
  score: number
  finalScore: number
  createdAt: string
}

export interface finihedAssignments {
  student: StudentInfo
  submissions: SubmissionItem[]
}

export interface AssignmentAchievement {
  totalStudentCount: number
  conmpletedCount: number
  pendingCount: number
  completedSubmissions: SubmissionItem[]
  pendingStudents: Student[]
}

export interface Student {
  id: string
  name: string
  studentId: string
  classId?: string
  class?: {
    id: string
    name: string
  }
  phone?: string
  email?: string
  studentCount?: number
}

export interface Class {
  id: string
  name: string
  studentCount?: number
}

export interface Assignment {
  id: string
  prompt?: string
  wordLimit?: number
  grade?: string
  totalScore?: number
  baseScore?: number
  scoringCriteria?: string
  createdAt: string
  titleContext?: string
  updatedAt: string
  description?: string
}

export interface EssayAssignment {
  id: string
  titleContext: string
  description: string
  grade: string
  totalScore: number
  baseScore: number
  scoringCriteria: string
  createdAt: string
  updatedAt: string
}

export interface AIResult {
  modelName: string
  feedback: string
  score: number
  confidence?: number
}

export interface StudentInfo {
  name: string
  classId?: string
}

export interface EssaySubmissionSummaryDto {
  id: string
  titleContext: string
  finalScore?: number
  isError: boolean
  createdAt: string
}

export interface Submission {
  id: string
  title: string
  studentId: string
  assignmentId: string
  imageUrl: string
  parsedText?: string
  isError: boolean
  errorMessage?: string
  aiResults: AIResult[]
  judgeResult?: string
  finalScore?: number
  score?: number
  status: 'Submitted' | 'Evaluating' | 'Evaluated'
  createdAt: string
  submissionDate: string
  studentName?: string
  className?: string
  assignmentTitle?: string
  student?: StudentInfo
  essayAssignment: EssayAssignment
}

export interface AIModel {
  id: string
  modelId: string
  serviceType?: string
  apiKeyId?: string
}

export interface ApiKey {
  id: string
  serviceType: string
  key: string
  secret?: string
  endpoint?: string
  description?: string
  isEnabled: boolean
  createdAt: string
  aiModels?: AIModel[]
}

export interface AIModelUsageSetting {
  id: string
  usageType: string
  aiModelId: string
  aiModel?: AIModel
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface ExportFilterDto {
  essayAssignmentId?: string
  essayAssignmentIds?: string[]
  classId?: string
  startDate?: string
  endDate?: string
}

export interface ServerStatus {
  serverStatus: string
  serverTimeUtc: string
  uptime: string
  build: {
    version: string
    gitCommit: string
  }
  application: {
    environment: string
    framework: string
    processId: number
    memoryUsage: string
    totalAllocatedMemory: string
    threadCount: number
  }
  system: {
    hostName: string
    serverIpAddresses: string
    os: string
    osArchitecture: string
    processorCount: number
  }
  request: {
    clientIp: string
  }
  databaseStatus: string
}

export interface StudentForUpload {
  id: string
  studentId: string
  name: string
}

export interface ClassWithStudents {
  id: string
  name: string
  createdAt: string
  students: StudentForUpload[]
}

export interface QueriedEssay {
  id: string
  title: string
  student: {
    name: string
    studentId: string
  }
  createdAt: string
  isError: boolean
  finalScore?: number
  judgeResult?: string
}

export interface ApiKeyUpdateDto {
  serviceType?: string
  key?: string
  secret?: string
  endpoint?: string
  description?: string
  isEnabled?: boolean
  modelIds?: string[]
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    username: string
    role?: string
  }
}

export interface User {
  id: string
  username: string
  role?: string
}