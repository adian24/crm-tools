"use client";

import { useState, useEffect } from 'react';
import { Id } from '@/convex/_generated/dataModel';

interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  role: 'super_admin' | 'manager' | 'staff';
  staffId?: string;
  isActive: boolean;
  phone?: string;
  avatar?: string;
  targetYearly: number;
  completedThisYear: number;
  createdAt: number;
  updatedAt: number;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('crm_user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  return { user, loading };
}
