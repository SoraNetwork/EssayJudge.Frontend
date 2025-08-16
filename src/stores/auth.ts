// stores/auth.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api'; // 导入 api 实例

// 定义用户信息的接口
export interface User {
  id: string;
  name: string;
  username: string;
  phoneNumber?: string;
  // 根据后端返回添加其他字段
}

// 定义登录成功后后端返回的数据结构
interface AuthResponse {
  token: string;
  user: User;
}

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const token = ref(localStorage.getItem('token') || '');
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));

  // --- Getters ---
  const isAuthenticated = computed(() => !!token.value);
  const userName = computed(() => user.value?.username); // 从 user 对象派生
  const realName = computed(() => user.value?.name); // 假设 realName 就是 user.name
  const phoneNumber = computed(() => user.value?.phoneNumber);

  // --- Actions ---

  /**
   * 设置用户信息并持久化存储
   * @param data - 后端返回的认证信息
   */
  function setUserInfo(data: AuthResponse) {
    token.value = data.token;
    user.value = data.user;

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  /**
   * 使用账号密码登录
   * @param username - 用户名
   * @param password - 密码
   */
  async function login(username: string, password: string): Promise<void> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await api.post<AuthResponse>('/api/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUserInfo(response.data);
    } catch (error: any) {
      // 抛出错误，让组件可以捕获并显示
      throw new Error(error.response?.data?.message || '账号或密码错误');
    }
  }

  /**
   * 使用钉钉免登授权码登录 (应用内)
   * @param code - 钉钉 JSAPI 返回的授权码
   */
  async function loginWithDingTalkCode(code: string): Promise<void> {
    const formData = new FormData();
    formData.append('code', code);

    try {
      const response = await api.post<AuthResponse>('/api/auth/dingtalk-login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUserInfo(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '钉钉免密登录失败');
    }
  }

  /**
   * 使用钉钉 SSO 授权码登录 (Web 跳转)
   * @param code - 钉钉 OAuth 回调的授权码
   */
  async function loginWithDingTalkSso(code: string): Promise<void> {
    const formData = new FormData();
    formData.append('Code', code); 

    try {
      const response = await api.post<AuthResponse>('/api/auth/dingtalk-sso-login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUserInfo(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '钉钉 SSO 登录失败');
    }
  }

  /**
   * 登出
   */
  function logout() {
    token.value = '';
    user.value = null;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // 为了兼容旧代码，也一并移除
    localStorage.removeItem('userName');
    localStorage.removeItem('realName');
    localStorage.removeItem('phoneNumber');
  }

  return {
    token,
    user,
    isAuthenticated,
    userName,
    realName,
    phoneNumber,
    login,
    loginWithDingTalkCode,
    loginWithDingTalkSso,
    logout,
  };
});
