import { useEffect, useState } from 'react';
import axios from 'axios';

const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setUser(null);
      return;
    }

    axios.get('http://localhost:5000/api/admin/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('adminToken');
        setUser(null);
      });
        }, []);

  return user;
};

export default useAuth;
