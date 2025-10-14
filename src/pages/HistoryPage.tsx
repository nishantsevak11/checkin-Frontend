import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Calendar, Download, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { attendanceService, type AttendanceRecord, type AttendanceFilters } from '@/services/attendanceService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AttendanceFilters>({
    page: 1,
    limit: 10,
    from: format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchAttendanceHistory();
  }, [filters]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getAttendanceHistory(filters);
      setRecords(response.records);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDateFilterChange = (field: 'from' | 'to', value: string) => {
    setFilters(prev => ({ ...prev, page: 1, [field]: value }));
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Check In', 'Check Out', 'Duration (Hours)', 'Status'];
    const csvContent = [
      headers.join(','),
      ...records.map(record => [
        format(parseISO(record.date), 'yyyy-MM-dd'),
        format(parseISO(record.checkInAt), 'HH:mm'),
        record.actualCheckOutAt ? format(parseISO(record.actualCheckOutAt), 'HH:mm') : '-',
        (record.durationMinutes / 60).toFixed(2),
        record.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_history_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-status-active text-white';
      case 'completed': return 'bg-status-completed text-white';
      case 'manual': return 'bg-status-manual text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-accent-light">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Attendance History</h1>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                From Date
              </label>
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => handleDateFilterChange('from', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                To Date
              </label>
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => handleDateFilterChange('to', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Check In</th>
                  <th className="text-left py-3 px-4">Check Out</th>
                  <th className="text-left py-3 px-4">Duration</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No records found
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        {format(parseISO(record.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        {format(parseISO(record.checkInAt), 'hh:mm a')}
                      </td>
                      <td className="py-3 px-4">
                        {record.actualCheckOutAt
                          ? format(parseISO(record.actualCheckOutAt), 'hh:mm a')
                          : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {(record.durationMinutes / 60).toFixed(2)} hrs
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusBadgeColor(record.status || 'unknown')}>
                          {(record.status || 'unknown').charAt(0).toUpperCase() + (record.status || 'unknown').slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} records
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default HistoryPage;