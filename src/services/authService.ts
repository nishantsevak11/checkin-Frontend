import api from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  timezone?: string;
  defaultWorkDurationMinutes?: number;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  timezone?: string;
}

export interface UpdateProfileData {
  name?: string;
  timezone?: string;
  defaultWorkDurationMinutes?: number;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  // Login user
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  },

  // Register new user
  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  },

  // Logout user
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  },

  // Update user profile
  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await api.put('/auth/profile', data);
    return response.data.data.user;
  },

  // Change password
  async changePassword(data: ChangePasswordData): Promise<void> {
    await api.put('/auth/password', data);
  },

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<string> {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data.accessToken;
  },
};
