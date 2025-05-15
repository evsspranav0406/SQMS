import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const IdleTimer = () => {
  const navigate = useNavigate();
  const warningTimerId = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerId = useRef<NodeJS.Timeout | null>(null);
  const warningTimeout = 60000; // 1 minute warning before logout
  const idleTimeout = 10 * 60 * 1000; // 10 minutes
  const lastActiveKey = 'lastActiveTime';

  const clearTimers = () => {
    if (warningTimerId.current) {
      clearTimeout(warningTimerId.current);
    }
    if (logoutTimerId.current) {
      clearTimeout(logoutTimerId.current);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem(lastActiveKey);
    toast.message('You have been logged out due to inactivity.');
    navigate('/login');
  };

  const startTimer = () => {
    clearTimers();
    // Show warning 1 minute before logout
    warningTimerId.current = setTimeout(() => {
      toast.warning('You will be logged out in 1 minute due to inactivity.');
      // Set another timeout for actual logout after warningTimeout
      logoutTimerId.current = setTimeout(() => {
        logout();
      }, warningTimeout);
    }, idleTimeout - warningTimeout);
  };

  const resetTimer = () => {
    const now = Date.now();
    localStorage.setItem(lastActiveKey, now.toString());
    startTimer();
  };

  useEffect(() => {

    // Check last active time on mount
    const lastActive = localStorage.getItem(lastActiveKey);
    if (lastActive) {
      const lastActiveTime = parseInt(lastActive, 10);
      const now = Date.now();
      if (now - lastActiveTime > idleTimeout) {
        logout();
        return;
      }
    }
    resetTimer();

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
  }, []);

  return null;
};

export default IdleTimer;
