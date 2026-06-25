'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const id = localStorage.getItem('studentId');
    router.push(id ? '/dashboard' : '/onboarding');
  }, [router]);
  return null;
}
