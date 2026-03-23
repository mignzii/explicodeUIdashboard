export interface User {
  id: string
  phone: string
  firstName: string
  lastName: string
  region: string
  profileType: 'APPRENANT' | 'CHAUFFEUR' | 'AGENT_ROUTIER' | 'AUTO_ECOLE'
  avatarUrl?: string
  isActive: boolean
  createdAt: string
  lastActiveAt?: string
  xp?: number
  level?: number
}

export interface LearningModule {
  id: string
  title: string
  icon: string
  color: string
  order: number
  isLocked: boolean
  categories?: Category[]
  createdAt?: string
  updatedAt?: string
}

export interface LearningModuleWithCategories extends LearningModule {
  categories: Category[]
}

export interface Category {
  id: string
  moduleId: string
  title: string
  order: number
  lessons?: Lesson[]
  createdAt?: string
  updatedAt?: string
}

export interface Lesson {
  id: string
  categoryId: string
  title: string
  order: number
  isLocked: boolean
  icon?: string
  iconColor?: string
  iconBg?: string
  subLessonsCount?: number
  progress?: number
  subLessons?: SubLesson[]
  createdAt?: string
  updatedAt?: string
}

export interface SubLesson {
  id: string
  lessonId: string
  number: number
  title: string
  order: number
  status: 'locked' | 'in_progress' | 'completed'
  imageUrl?: string
  isCompleted?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface LessonContent {
  id: string
  subLessonId: string
  lang: 'FR' | 'WO' | 'PU' | 'SE' | 'JO'
  type: 'slide' | 'audio' | 'video'
  description?: string
  bullets?: string[]
  didYouKnow?: string
  hasVideo: boolean
  videoUrl?: string
  audioUrl?: string
  readMinutes: number
  order: number
  createdAt?: string
}

export interface CreateModulePayload {
  title: string
  icon?: string
  color?: string
  order?: number
  isLocked?: boolean
}

export interface CreateCategoryPayload {
  moduleId: string
  title: string
  order?: number
}

export interface CreateLessonPayload {
  categoryId: string
  title: string
  order?: number
  isLocked?: boolean
  icon?: string
  iconColor?: string
  iconBg?: string
}

export interface CreateSubLessonPayload {
  lessonId: string
  number: number
  title: string
  order?: number
  status?: 'locked' | 'in_progress' | 'completed'
  imageUrl?: string
}

export interface CreateContentPayload {
  subLessonId: string
  lang?: 'FR' | 'WO' | 'PU' | 'SE' | 'JO'
  type?: 'slide' | 'audio' | 'video'
  description?: string
  bullets?: string[]
  didYouKnow?: string
  hasVideo?: boolean
  videoUrl?: string
  audioUrl?: string
  readMinutes?: number
  order?: number
}

export type QuestionType = 'single' | 'multiple'
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'
export type ExamBlancMode = 'random' | 'custom'

export interface QuizCategory {
  id: string
  title: string
  description?: string
  icon?: string
  color?: string
  moduleId?: string
  order: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  questions?: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  categoryId: string
  moduleId?: string
  lang: string
  text: string
  options: string[]
  correctIndices: number[]
  type: QuestionType
  difficulty: QuestionDifficulty
  explanation?: string
  imageUrl?: string
  audioUrls?: Record<string, string>
  lessonId?: string | null
  parentQuestionId?: string
  subQuestions?: QuizQuestion[]
  createdAt?: string
}

export interface ExamBlancQuestion {
  id: string
  examBlancId: string
  questionId: string
  order: number
  question?: QuizQuestion
}

export interface ExamBlanc {
  id: string
  title: string
  description?: string
  mode: ExamBlancMode
  questionCount: number
  durationMinutes: number
  passingScore: number
  categoryIds: string[]
  isActive: boolean
  questions?: ExamBlancQuestion[]
  createdAt?: string
  updatedAt?: string
}

export interface QuizAttempt {
  id: string
  userId: string
  categoryId: string
  isExamBlanc: boolean
  score: number
  correctCount: number
  totalCount: number
  durationSeconds?: number
  answers?: { questionId: string; selectedIndices: number[]; correct: boolean }[]
  completedAt: string
  user?: User
}

export interface QuizStats {
  totalAttempts: number
  averageScore: number
  bestScore: number
  examBlanc: {
    attempts: number
    bestScore: number
    averageScore: number
  }
}

export interface CreateQuizCategoryPayload {
  title: string
  description?: string
  icon?: string
  color?: string
  moduleId?: string
  order?: number
  isActive?: boolean
}

export interface CreateQuizQuestionPayload {
  categoryId: string
  moduleId?: string
  lang?: string
  text: string
  options: string[]
  correctIndices: number[]
  type?: QuestionType
  difficulty?: QuestionDifficulty
  explanation?: string
  imageUrl?: string
  audioUrls?: Record<string, string>
  lessonId?: string
  subQuestion?: {
    text: string
    options: string[]
    correctIndices: number[]
    type?: QuestionType
    explanation?: string
    audioUrls?: Record<string, string>
  }
}

export interface CreateExamBlancPayload {
  title: string
  description?: string
  mode: ExamBlancMode
  questionCount?: number
  durationMinutes?: number
  passingScore?: number
  categoryIds?: string[]
  questionIds?: string[]
  isActive?: boolean
}

export interface Infraction {
  id: string
  code: string
  title: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  fine: number // FCFA
  points: number
  description?: string
  legalRef?: string
}

export interface InfractionReport {
  id: string
  userId: string
  infractionId: string
  location: string
  lat?: number
  lng?: number
  images: string[]
  plate?: string
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED'
  createdAt: string
  reviewedAt?: string
  reviewNote?: string
  user?: User
  infraction?: Infraction
}

export interface Job {
  id: string
  title: string
  company: string
  city: string
  salary?: string
  description: string
  requirements: string[]
  postedAt: string
  expiresAt: string
  applicationsCount: number
  isActive: boolean
  contactEmail?: string
  contactPhone?: string
  contractType?: string
  region?: string
  imageUrl?: string
}

export interface JobApplication {
  id: string
  jobId: string
  userId: string
  appliedAt: string
  status: 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED'
  user?: User
}

export interface Post {
  id: string
  userId: string
  content: string
  images: string[]
  likes: number
  createdAt: string
  user?: User
  commentsCount: number
  isFlagged?: boolean
  flagCount?: number
}

export interface CreateJobPayload {
  title: string
  company: string
  city: string
  salary?: string
  description?: string
  requirements?: string[]
  postedAt?: string
  expiresAt?: string
  contactEmail?: string
  contactPhone?: string
  contractType?: string
  region?: string
  imageUrl?: string
  isActive?: boolean
}

export type UpdateJobPayload = Partial<CreateJobPayload>

export interface UpdateApplicationStatusPayload {
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
}

export interface Document {
  id: string
  userId: string
  type: 'PERMIS_CONDUIRE' | 'CARTE_GRISE' | 'ASSURANCE' | 'VISITE_TECHNIQUE' | 'AUTRE'
  fileUrl: string
  expiryDate?: string
  status: 'OK' | 'WARNING' | 'EXPIRED'
  uploadedAt: string
  user?: User
  notes?: string
}

export interface ADRCode {
  id: string
  code: string
  type: 'KEMLER' | 'ONU'
  description: string
  details?: string
  hazardClass?: string
  color?: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  condition: string
  earnedCount: number
}

export interface UserProgression {
  userId: string
  user?: User
  modulesCompleted: number
  totalModules: number
  lessonsCompleted: number
  totalLessons: number
  quizzesPassed: number
  totalXP: number
  level: number
  badges: Badge[]
  streakDays: number
}

export interface Stats {
  totalUsers: number
  activeUsers: number
  totalModules: number
  totalQuizAttempts: number
  pendingReports: number
  activeJobs: number
  totalPosts: number
  newUsersToday?: number
  quizzesToday?: number
}

export interface DailyStats {
  date: string
  users: number
  quizzes: number
  reports: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AppSettings {
  appName: string
  defaultLanguage: string
  maintenanceMode: boolean
  otpExpiryMinutes: number
  accessTokenTTL: number
  refreshTokenTTL: number
  maxOtpAttempts: number
  africasTalkingApiKey?: string
  africasTalkingUsername?: string
  s3Bucket?: string
  s3Region?: string
}
