import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

type AuditAnswer = {
  updated_by?: string;
  update?: string;
  comment?: string;
  date?: string;
};

type AuditEntry = Record<string, AuditAnswer>;

type InspectionData = {
  inspection_id: number;
  operator_email: string;
  officer_email: string;
  start_date: string;
  end_date: string | null;
  current_owner: 'officer' | 'operator' | null;
  role: 'officer' | 'operator';
  can_edit: boolean;
  questions: Record<string, string>;
  latest: AuditEntry;
  audit_log: AuditEntry[];
};

type DraftAnswer = {
  update: string;
  comment: string;
};

export default function Inspection() {
  const { inspectionId } = useParams();
  const nav = useNavigate();
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [draft, setDraft] = useState<Record<string, DraftAnswer>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadInspection = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/inspection/${inspectionId}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      setError(data.error || 'Unable to load inspection');
      setLoading(false);
      return;
    }

    const loadedInspection: InspectionData = data.inspection;
    const nextDraft: Record<string, DraftAnswer> = {};

    Object.keys(loadedInspection.questions).forEach((questionId) => {
      const latestAnswer = loadedInspection.latest[questionId] || {};

      if (loadedInspection.role === 'operator' && !loadedInspection.end_date) {
        nextDraft[questionId] = {
          update: 'pending',
          comment: '',
        };
      } else {
        nextDraft[questionId] = {
          update: latestAnswer.update || '',
          comment: latestAnswer.comment || '',
        };
      }
    });

    setInspection(loadedInspection);
    setDraft(nextDraft);
    setError('');
    setLoading(false);
  }, [inspectionId]);

  useEffect(() => {
    void loadInspection();
  }, [loadInspection]);

  const getQuestionHistory = (questionId: string) => {
    if (!inspection) return [];

    const history: AuditAnswer[] = [];
    let previousValue = '';

    inspection.audit_log.forEach((entry) => {
      const answer = entry[questionId] || {};
      const currentValue = JSON.stringify(answer);

      if (answer && Object.keys(answer).length > 0 && currentValue !== previousValue) {
        history.push(answer);
      }

      previousValue = currentValue;
    });

    return history;
  };

  const saveInspection = async () => {
    setError('');

    const answers: Record<string, DraftAnswer> = {};

    Object.entries(draft).forEach(([questionId, answer]) => {
      if (inspection?.role === 'operator') {
        if (answer.comment.trim()) {
          answers[questionId] = {
            update: 'pending',
            comment: answer.comment,
          };
        }
      } else if (answer.update) {
        answers[questionId] = {
          update: answer.update,
          comment: answer.comment,
        };
      }
    });

    const res = await fetch(`/api/inspection/${inspectionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setError(data.error || 'Unable to save inspection');
      return;
    }

    await loadInspection();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white border rounded-2xl p-8">Loading...</div>
        </main>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white border rounded-2xl p-8">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              type="button"
              className="bg-slate-700 text-white px-4 py-2 rounded"
              onClick={() => void nav('/home')}
            >
              Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
          <div className="flex justify-between items-start gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Inspection #{inspection.inspection_id}</h1>

              <div className="text-sm text-slate-500 mt-3 space-y-1">
                <div>Officer: {inspection.officer_email}</div>
                <div>Operator: {inspection.operator_email}</div>
                <div>Started: {inspection.start_date}</div>

                {inspection.end_date && <div>Completed: {inspection.end_date}</div>}

                {!inspection.end_date && (
                  <div>Pending action: {inspection.current_owner || 'None'}</div>
                )}
              </div>
            </div>

            <button
              type="button"
              className="bg-slate-700 text-white px-4 py-2 rounded"
              onClick={() => void nav('/home')}
            >
              Back
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 border border-red-300 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          )}

          {!inspection.end_date &&
            inspection.role === 'operator' &&
            Object.keys(inspection.questions).length === 0 && (
              <div className="p-4 border rounded bg-slate-50 text-slate-500">
                There are no questions pending your action.
              </div>
            )}

          <div className="space-y-8">
            {Object.entries(inspection.questions).map(([questionId, questionText]) => {
              const history = getQuestionHistory(questionId);
              const latestAnswer = inspection.latest[questionId] || {};
              const answerDraft = draft[questionId] || {
                update: '',
                comment: '',
              };

              return (
                <section key={questionId} className="border border-slate-200 rounded-2xl p-5">
                  <h2 className="font-semibold text-lg mb-4">
                    {questionId}. {questionText}
                  </h2>

                  {history.length > 0 && (
                    <div className="space-y-3 mb-5">
                      {history.map((entry, index) => {
                        const isLatest = index === history.length - 1;

                        return (
                          <div
                            key={`${questionId}-${index}`}
                            className={`border rounded p-3 ${
                              isLatest ? 'bg-white' : 'bg-slate-100 text-slate-500 opacity-70'
                            }`}
                          >
                            <div className="text-sm font-semibold">
                              {entry.updated_by || 'Unknown'} —{' '}
                              {entry.update === 'pending'
                                ? 'Need Further Clarification'
                                : entry.update || 'No result'}
                            </div>

                            {entry.comment && (
                              <div className="mt-1 text-sm whitespace-pre-wrap">
                                {entry.comment}
                              </div>
                            )}

                            {entry.date && (
                              <div className="mt-2 text-xs text-slate-400">{entry.date}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {history.length === 0 && (
                    <div className="mb-5 text-sm text-slate-400">No previous audit entries.</div>
                  )}

                  {inspection.can_edit ? (
                    <div className="space-y-3">
                      {inspection.role === 'operator' ? (
                        <select
                          className="border p-2 rounded w-full bg-slate-100 text-slate-500 cursor-not-allowed"
                          value="pending"
                          disabled
                        >
                          <option value="pending">Need Further Clarification</option>
                        </select>
                      ) : (
                        <select
                          className="border p-2 rounded w-full"
                          value={answerDraft.update}
                          onChange={(e) =>
                            setDraft((current) => ({
                              ...current,
                              [questionId]: {
                                ...current[questionId],
                                update: e.target.value,
                              },
                            }))
                          }
                        >
                          <option value="">Select result</option>
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                          <option value="pending">Need Further Clarification</option>
                        </select>
                      )}

                      <textarea
                        className="border p-2 rounded w-full min-h-24"
                        placeholder="Comment"
                        value={answerDraft.comment}
                        onChange={(e) =>
                          setDraft((current) => ({
                            ...current,
                            [questionId]: {
                              ...current[questionId],
                              comment: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  ) : (
                    <div className="border rounded p-3 bg-slate-100 text-slate-500">
                      <div>
                        Current result:{' '}
                        {latestAnswer.update === 'pending'
                          ? 'Need Further Clarification'
                          : latestAnswer.update || 'Not answered'}
                      </div>

                      {latestAnswer.comment && (
                        <div className="mt-1 whitespace-pre-wrap">{latestAnswer.comment}</div>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {inspection.can_edit && (
            <button
              type="button"
              className="mt-8 bg-indigo-600 text-white px-6 py-2 rounded"
              onClick={() => void saveInspection()}
            >
              Save / Submit
            </button>
          )}

          {inspection.end_date && (
            <div className="mt-8 p-4 border border-green-200 bg-green-50 text-green-700 rounded">
              This inspection is complete. The form and audit log are read-only.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
