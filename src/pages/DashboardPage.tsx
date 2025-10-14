import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, LogOut, User, LogIn, TrendingUp, Flame } from 'lucide-react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { attendanceService, type AttendanceRecord } from '@/services/attendanceService';
import { toast } from 'sonner';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [checkInTime, setCheckInTime] = useState(format(new Date(), 'HH:mm'));
  const [checkOutTime, setCheckOutTime] = useState(format(new Date(), 'HH:mm'));
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      const [hours, minutes] = checkInTime.split(':');
      const checkInDate = new Date();
      checkInDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const data = { checkInAt: checkInDate.toISOString() };
      const record = await attendanceService.checkIn(data);
      setTodayRecord(record);
      toast.success('Successfully checked in!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to check in';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      const [hours, minutes] = checkOutTime.split(':');
      const checkOutDate = new Date(todayRecord.checkInAt);
      checkOutDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      if (checkOutDate < new Date(todayRecord.checkInAt)) {
        checkOutDate.setDate(checkOutDate.getDate() + 1);
      }
      
      console.log('Sending checkout data:', { manualCheckOutAt: checkOutDate.toISOString().replace(/\.\d+Z$/, 'Z') });
      const data = { manualCheckOutAt: checkOutDate.toISOString().replace(/\.\d+Z$/, 'Z') };
      const record = await attendanceService.checkOut(data);
      setTodayRecord(record);
      toast.success('Successfully checked out!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to check out';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const calculateExpectedCheckout = () => {
    if (!todayRecord) return null;
    return format(parseISO(todayRecord.computedCheckOutAt), 'h:mm a');
  };

  const calculateActualCheckout = () => {
    if (!todayRecord || !todayRecord.checkOutAt) return null;
    return format(parseISO(todayRecord.checkOutAt), 'h:mm a');
  };

  const calculateProgress = () => {
    if (!todayRecord) return 0;
    
    const checkInTime = parseISO(todayRecord.checkInAt);
    const now = new Date();
    const expectedCheckOut = parseISO(todayRecord.computedCheckOutAt);
    
    const totalMinutes = differenceInMinutes(expectedCheckOut, checkInTime);
    const elapsedMinutes = differenceInMinutes(now, checkInTime);
    
    return Math.min((elapsedMinutes / totalMinutes) * 100, 100);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  useEffect(() => {
    const fetchTodayStatus = async () => {
      try {
        const record = await attendanceService.getTodayAttendance();
        setTodayRecord(record);
        
        // Set current time for checkout input
        if (record && !record.isCheckedOut) {
          setCheckOutTime(format(new Date(), 'HH:mm'));
        }
      } catch (error) {
        console.error('Error fetching today\'s status:', error);
      }
    };
    fetchTodayStatus();
  }, []);

  // Update checkout time every minute if checked in but not checked out
  useEffect(() => {
    if (todayRecord && !todayRecord.isCheckedOut) {
      const interval = setInterval(() => {
        setCheckOutTime(format(new Date(), 'HH:mm'));
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [todayRecord]);

  const hasCheckedIn = !!todayRecord;
  const hasCheckedOut = todayRecord?.isCheckedOut || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-accent-light">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">TimeTracker</h1>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
              History
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
              <User className="w-4 h-4 mr-2" />
              {user?.name}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Check-In/Check-Out Card */}
            <Card className="p-8 hover-lift animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {!hasCheckedIn ? 'Quick Check-In' : hasCheckedOut ? 'Completed' : 'Check Out'}
                  </h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              {!hasCheckedIn ? (
                // Check-In Form
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Check-In Time
                    </label>
                    <input
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full h-14 px-4 text-lg font-semibold bg-muted rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>

                  <Button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="w-full h-14 text-lg font-semibold group"
                  >
                    {loading ? 'Checking In...' : 'Check In'}
                    <LogIn className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              ) : hasCheckedOut ? (
                // Completed State
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-success-light rounded-2xl p-6 text-center border border-success/20">
                    <div className="w-16 h-16 rounded-full bg-success mx-auto mb-4 flex items-center justify-center">
                      <LogOut className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-success mb-2">
                      Day Completed!
                    </h3>
                    <p className="text-success-foreground/80">
                      You worked {formatDuration(todayRecord.durationMinutes)} today
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Check In</p>
                      <p className="text-lg font-bold text-foreground">
                        {format(parseISO(todayRecord.checkInAt), 'h:mm a')}
                      </p>
                    </div>
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Check Out</p>
                      <p className="text-lg font-bold text-foreground">
                        {calculateActualCheckout()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Check-Out Form
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-success-light rounded-2xl p-6 border border-success/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-success-foreground/80 mb-1">
                          Checked In At
                        </p>
                        <p className="text-2xl font-bold text-success">
                          {format(parseISO(todayRecord.checkInAt), 'h:mm a')}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center">
                        <LogIn className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary-light rounded-2xl p-6 text-center border border-primary/20">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Expected Check-Out
                    </p>
                    <p className="text-4xl font-bold text-primary">
                      {calculateExpectedCheckout()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on {formatDuration(user?.defaultWorkDurationMinutes || 555)} work day
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Check-Out Time
                    </label>
                    <input
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="w-full h-14 px-4 text-lg font-semibold bg-muted rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>

                  <Button
                    onClick={handleCheckOut}
                    disabled={loading}
                    className="w-full h-14 text-lg font-semibold group bg-success hover:bg-success/90"
                  >
                    {loading ? 'Checking Out...' : 'Check Out'}
                    <LogOut className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              )}
            </Card>

            {/* Today's Status Card */}
            {hasCheckedIn && !hasCheckedOut && (
              <Card className="p-8 animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-foreground">Today's Progress</h2>
                  <Badge className="bg-primary-light text-primary hover:bg-primary-light">
                    Active
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted rounded-xl p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <LogIn className="w-3 h-3" />
                      Checked In
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {format(parseISO(todayRecord.checkInAt), 'h:mm a')}
                    </p>
                  </div>
                  <div className="bg-muted rounded-xl p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <LogOut className="w-3 h-3" />
                      Expected Out
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {calculateExpectedCheckout()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Work Progress</span>
                    <span className="font-medium text-foreground">
                      {Math.round(calculateProgress())}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${calculateProgress()}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {differenceInMinutes(new Date(), parseISO(todayRecord.checkInAt))} minutes elapsed
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column */}
          {/* <div className="space-y-6"> */}
            {/* Quick Stats */}
            {/* <Card className="p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-xl font-semibold text-foreground mb-4">Quick Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary-light rounded-xl p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2 opacity-50" />
                  <p className="text-2xl font-bold text-foreground">22</p>
                  <p className="text-xs text-muted-foreground mt-1">Days This Month</p>
                </div>
                <div className="bg-accent-light rounded-xl p-4 text-center">
                  <Calendar className="w-8 h-8 text-accent mx-auto mb-2 opacity-50" />
                  <p className="text-2xl font-bold text-foreground">5</p>
                  <p className="text-xs text-muted-foreground mt-1">Days This Week</p>
                </div>
                <div className="bg-success-light rounded-xl p-4 text-center">
                  <Clock className="w-8 h-8 text-success mx-auto mb-2 opacity-50" />
                  <p className="text-2xl font-bold text-foreground">9.2</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg Hours/Day</p>
                </div>
                <div className="bg-warning-light rounded-xl p-4 text-center">
                  <Flame className="w-8 h-8 text-warning mx-auto mb-2 opacity-50" />
                  <p className="text-2xl font-bold text-foreground">12</p>
                  <p className="text-xs text-muted-foreground mt-1">Day Streak</p>
                </div>
              </div>
            </Card> */}

            {/* Recent Activity */}
            {/* <Card className="p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Oct {11 - i}, 2025
                        </p>
                        <p className="text-xs text-muted-foreground">
                          9:00 AM - 6:15 PM
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      9h 15m
                    </Badge>
                  </div>
                ))}
              </div>
            </Card> */}
          {/* </div> */}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;