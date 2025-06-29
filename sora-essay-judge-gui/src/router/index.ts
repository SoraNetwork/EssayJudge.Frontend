/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import GradingPage from '@/pages/GradingPage.vue'
import BatchGradingPage from '@/pages/BatchGradingPage.vue'
import GradingResultsPage from '@/pages/GradingResultsPage.vue'
import EssayReportPage from '@/pages/EssayReportPage.vue'
import CreateDatabasePage from '@/pages/CreateDatabasePage.vue'
import ProjectDetailPage from '@/pages/ProjectDetailPage.vue'
import AssignmentPage from '@/pages/AssignmentPage.vue'
import StudentPage from '@/pages/StudentPage.vue'
import EssayPage from '@/pages/EssayPage.vue'
import UserPage from '@/pages/UserPage.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
  },
  {
    path: '/grading',
    name: 'Grading',
    component: GradingPage,
  },
  {
    path: '/batch-grading',
    name: 'BatchGrading',
    component: BatchGradingPage,
  },
  {
    path: '/results',
    name: 'GradingResults',
    component: GradingResultsPage,
  },
  {
    path: '/report/:id',
    name: 'EssayReport',
    component: EssayReportPage,
  },
  {
    path: '/create-database',
    name: 'CreateDatabase',
    component: CreateDatabasePage,
  },
  {
    path: '/project/:id',
    name: 'ProjectDetail',
    component: ProjectDetailPage,
  },
  {
    path: '/assignment',
    name: 'Assignment',
    component: AssignmentPage,
  },
  {
    path: '/assignment/:id',
    name: 'AssignmentDetail',
    component: AssignmentPage, // 或 AssignmentDetailPage
  },
  {
    path: '/student',
    name: 'Student',
    component: StudentPage,
  },
  {
    path: '/essay',
    name: 'EssayManagement',
    component: () => import('@/views/EssayManagement.vue')
  },
  {
    path: '/essay/:id',
    name: 'EssayDetail',
    component: EssayPage, // 或 EssayDetailPage
  },
  {
    path: '/user',
    name: 'User',
    component: UserPage,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
