'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import { UserProfile } from '@/lib/authGuards';
import Link from 'next/link';
import { Home, Briefcase, LogOut } from 'lucide-react';

export default function DCALayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profileData || !profileData.role.startsWith('dca')) {
      router.push('/login');
      return;
    }

    setProfile(profileData);
    setLoading(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-600 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">DCA Portal</h1>
          <p className="text-sm text-indigo-200 mt-1">{profile?.full_name}</p>
          <p className="text-xs text-indigo-300">{profile?.role}</p>
        </div>

        <nav className="mt-6">
          <Link
            href="/dca"
            className="flex items-center gap-3 px-6 py-3 hover:bg-indigo-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            href="/dca/cases"
            className="flex items-center gap-3 px-6 py-3 hover:bg-indigo-700 transition-colors"
          >
            <Briefcase className="w-5 h-5" />
            My Cases
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-6 py-3 mt-auto absolute bottom-6 hover:bg-indigo-700 transition-colors w-64"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
