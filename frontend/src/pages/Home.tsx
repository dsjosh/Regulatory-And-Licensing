import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Home() {
  const nav = useNavigate();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    async function checkSession() {
      const res = await fetch('/api/session');
      const data = await res.json();

      if (!data.loggedIn) {
        void nav('/');
      } else {
        setUser({
          name: data.name,
          role: data.role,
        });
      }
    }

    void checkSession();
  }, [nav]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero / Welcome Card */}
        <div className="text-center bg-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-4">
            Homepage
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Welcome back, {user ? `${user.name} (${user.role})` : ''} !
          </p>
        </div>
      </main>
    </div>
  );
}
