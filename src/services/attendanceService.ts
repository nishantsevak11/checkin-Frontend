import axios from 'axios';
import api from '@/lib/api';

export interface AttendanceRecord {
  computedCheckOutAt(computedCheckOutAt: any): unknown;
  isCheckedOut: boolean;
  id: string;
  userId: string;
  date: string;
  checkInAt: string;
  expectedCheckOutAt: string;
  manualCheckOutAt?: string;
  actualCheckOutAt?: string;
  durationMinutes: number;
  status: 'active' | 'completed' | 'manual';
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInData {
  checkInAt?: string;
  note?: string;
}

export interface ManualCheckOutData {
  manualCheckOutAt: string;
  note?: string;
}

export interface AttendanceFilters {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  sort?: string;
}

export interface AttendanceListResponse {
  records: AttendanceRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AttendanceStats {
  thisWeek: number;
  thisMonth: number;
  averageHours: number;
  currentStreak: number;
}

export const attendanceService = {
  // Check out endpoint
  async checkOut(data: { checkOutAt?: string } = {}): Promise<AttendanceRecord> {
    console.log('Sending checkout data:', data);
    const response = await api.post('/attendance/checkout', data);
    return response.data.data.record;
  },

  // Check in for today
  async checkIn(data: CheckInData = {}): Promise<AttendanceRecord> {
    console.log('Sending check-in data:', data);
    const response = await api.post('/attendance/checkin', data);
    return response.data.data.record;
  },

  // Get today's attendance
  getTodayAttendance: async (): Promise<AttendanceRecord | null> => {
    try {
      const response = await api.get('/attendance/today');
      return response.data.data.record;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get attendance history
  async getAttendanceHistory(filters: AttendanceFilters = {}): Promise<AttendanceListResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.sort) params.append('sort', filters.sort);

    const response = await api.get(`/attendance?${params.toString()}`);
    return response.data.data;
  },

  // Get single attendance record
  async getAttendanceById(id: string): Promise<AttendanceRecord> {
    const response = await api.get(`/attendance/${id}`);
    return response.data.data.record;
  },

  // Manual check-out
  async manualCheckOut(id: string, data: ManualCheckOutData): Promise<AttendanceRecord> {
    const response = await api.put(`/attendance/${id}/checkout`, data);
    return response.data.data.record;
  },

  // Delete attendance record
  async deleteAttendance(id: string): Promise<void> {
    await api.delete(`/attendance/${id}`);
  },

  // Export attendance as CSV
  async exportToCsv(from?: string, to?: string): Promise<Blob> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const response = await api.get(`/attendance/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get attendance statistics (mock for now - implement if backend provides)
  async getStats(): Promise<AttendanceStats> {
    // This would ideally be a backend endpoint
    // For now, return mock data or calculate from history
    return {
      thisWeek: 5,
      thisMonth: 22,
      averageHours: 9.2,
      currentStreak: 12,
    };
  },
};
