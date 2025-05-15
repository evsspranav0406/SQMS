import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const IdleTimer = () => {
  const navigate = useNavigate();
  const warningTimerId = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerId = useRef<NodeJS.Timeout | null>(null);
  const warningTimeout = 60000; // 1 minute warning before logout
  const idleTimeout = 10* 60 * 1000; // 10 minutes

  const clearTimers = () => {
    console.log('Clearing timers');
    if (warningTimerId.current) {
      clearTimeout(warningTimerId.current);
    }
    if (logoutTimerId.current) {
      clearTimeout(logoutTimerId.current);
    }
  };

  const logout = () => {
    console.log('Logging out due to inactivity');
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    toast.message('You have been logged out due to inactivity.');
    navigate('/login');
  };

  const startTimer = () => {
    clearTimers();
    // Show warning 1 minute before logout
    warningTimerId.current = setTimeout(() => {
      console.log('Showing warning toast');
      toast.warning('You will be logged out in 1 minute due to inactivity.');
      // Set another timeout for actual logout after warningTimeout
      logoutTimerId.current = setTimeout(() => {
        console.log('Logout timer triggered');
        logout();
      }, warningTimeout);
    }, idleTimeout - warningTimeout);
  };

  const resetTimer = () => {
    startTimer();
  };

  useEffect(() => {
    startTimer();

    const events = ['', 'keydown', 'scroll', 'touchstart', 'click', 'mousedown'];

    const eventHandler = () => {
      resetTimer();
    };

    for (const event of events) {
      window.addEventListener(event, eventHandler);
    }

    return () => {
      clearTimers();
      for (const event of events) {
        window.removeEventListener(event, eventHandler);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default IdleTimer;
