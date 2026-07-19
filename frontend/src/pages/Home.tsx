import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Home() {
  const nav = useNavigate();
  const [user, setUser] = useState<{ name: string; role: string; email: string } | null>(null);

  const [activeTab, setActiveTab] = useState(1);

  // Tab 1 state (Combobox)
  const [allOperators, setAllOperators] = useState<string[]>([]);
  const [operatorSearch, setOperatorSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Tab 2 state
  const [inProgressList, setInProgressList] = useState<any[]>([]);
  const [inProgressSearch, setInProgressSearch] = useState('');
  const [inProgressCount, setInProgressCount] = useState(0);

  // Tab 3 state
  const [completedList, setCompletedList] = useState<any[]>([]);
  const [completedSearch, setCompletedSearch] = useState('');
  const [completedCount, setCompletedCount] = useState(0);

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
          email: data.email,
        });
        if (data.role === 'officer') {
          void fetchAllOperators();
          void fetchInProgress();
          void fetchCompleted();
        }
      }
    }

    void checkSession();
  }, [nav]);

  const fetchAllOperators = async () => {
    const res = await fetch('/api/operators'); // fetching without query gets all
    const data = await res.json();
    setAllOperators(data.operators);
  };

  const startInspection = async () => {
    if (!operatorSearch) return;

    // Frontend Validation
    if (inProgressList.some((insp) => insp.operator_email === operatorSearch)) {
      alert('Active inspection found. unable to create new one');
      return;
    }

    const res = await fetch('/api/inspections/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator_email: operatorSearch }),
    });

    const data = await res.json();

    // Backend Validation Handling
    if (!data.success) {
      alert(data.error || 'Failed to start inspection');
      return;
    }

    setOperatorSearch('');
    void fetchInProgress();
  };

  const fetchInProgress = async () => {
    const res = await fetch(`/api/inspections/in-progress`);
    const data = await res.json();
    setInProgressList(data.inspections);
    setInProgressCount(data.count);
  };

  const fetchCompleted = async () => {
    const res = await fetch(`/api/inspections/completed`);
    const data = await res.json();
    setCompletedList(data.inspections);
    setCompletedCount(data.count);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center bg-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-4">
            Homepage
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Welcome back, {user ? `${user.name} (${user.role})` : ''} !
          </p>

          {user?.role === 'officer' && (
            <div className="mt-8 text-left border-t pt-8">
              <div className="flex gap-4 mb-6">
                <button
                  className={`px-4 py-2 rounded ${activeTab === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}
                  onClick={() => setActiveTab(1)}
                >
                  New
                </button>
                <button
                  className={`px-4 py-2 rounded ${activeTab === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}
                  onClick={() => setActiveTab(2)}
                >
                  In-Progress
                </button>
                <button
                  className={`px-4 py-2 rounded ${activeTab === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}
                  onClick={() => setActiveTab(3)}
                >
                  Completed
                </button>
              </div>

              {activeTab === 1 && (
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search operator email..."
                      className="border p-2 rounded w-full"
                      value={operatorSearch}
                      onChange={(e) => {
                        setOperatorSearch(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay so click registers
                    />
                    {showDropdown && (
                      <ul className="absolute z-10 bg-white border border-slate-200 rounded w-full mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {allOperators
                          .filter((op) => op.toLowerCase().includes(operatorSearch.toLowerCase()))
                          .map((op) => (
                            <li
                              key={op}
                              className="p-2 hover:bg-indigo-100 cursor-pointer"
                              onClick={() => {
                                setOperatorSearch(op);
                                setShowDropdown(false);
                              }}
                            >
                              {op}
                            </li>
                          ))}
                        {allOperators.filter((op) =>
                          op.toLowerCase().includes(operatorSearch.toLowerCase())
                        ).length === 0 && (
                          <li className="p-2 text-slate-500">No operators found</li>
                        )}
                      </ul>
                    )}
                  </div>

                  <button
                    onClick={startInspection}
                    className="bg-indigo-600 text-white px-6 py-2 rounded disabled:opacity-50 cursor-not-allowed disabled:bg-slate-400"
                    disabled={!allOperators.includes(operatorSearch)}
                  >
                    Submit
                  </button>
                </div>
              )}

              {activeTab === 2 && (
                <div className="space-y-4">
                  <div className="font-semibold text-slate-600">
                    Total In-Progress: {inProgressCount}
                  </div>
                  <input
                    type="text"
                    placeholder="Filter by email"
                    className="border p-2 rounded w-full"
                    value={inProgressSearch}
                    onChange={(e) => setInProgressSearch(e.target.value)}
                  />
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {inProgressList
                      .filter((insp) =>
                        insp.operator_email.toLowerCase().includes(inProgressSearch.toLowerCase())
                      )
                      .map((insp, idx) => (
                        <div key={idx} className="p-3 border rounded bg-slate-50">
                          <span className="font-semibold">{insp.operator_email}</span>
                          <div className="text-sm text-slate-500">Started: {insp.start_date}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {activeTab === 3 && (
                <div className="space-y-4">
                  <div className="font-semibold text-slate-600">
                    Total Completed: {completedCount}
                  </div>
                  <input
                    type="text"
                    list="completed-options"
                    placeholder="Search completed operator emails"
                    className="border p-2 rounded w-full"
                    value={completedSearch}
                    onChange={(e) => setCompletedSearch(e.target.value)}
                  />
                  <datalist id="completed-options">
                    {completedList
                      .filter((insp) =>
                        insp.operator_email.toLowerCase().includes(completedSearch.toLowerCase())
                      )
                      .map((insp, idx) => (
                        <option key={idx} value={insp.operator_email} />
                      ))}
                  </datalist>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
