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

  filename: string;
  mime: string;
  base64: string;
};
const FILE_MARKER = "⟦FILE⟧";
const TYPE_MARKER = "⟦TYPE⟧";
const DATA_MARKER = "⟦DATA⟧";

function parseComment(raw: string) {
  if (!raw.includes(FILE_MARKER)) {
    return {
      text: raw,
      filename: "",
      mime: "",
      data: ""
    };
  }

  const fileIndex = raw.indexOf(FILE_MARKER);
  const typeIndex = raw.indexOf(TYPE_MARKER);
  const dataIndex = raw.indexOf(DATA_MARKER);

  return {
    text: raw.substring(0, fileIndex).trim(),
    filename: raw.substring(fileIndex + FILE_MARKER.length, typeIndex).trim(),
    mime: raw.substring(typeIndex + TYPE_MARKER.length, dataIndex).trim(),
    data: raw.substring(dataIndex + DATA_MARKER.length).trim()
  };
}

function buildComment(
  text: string,
  filename: string,
  mime: string,
  data: string
) {
  if (!filename)
    return text;

  return (
    text.trim() +
    "\n\n" +
    FILE_MARKER +
    filename +
    "\n" +
    TYPE_MARKER +
    mime +
    "\n" +
    DATA_MARKER +
    data
  );
}

function downloadAttachment(
  filename: string,
  mime: string,
  base64: string
) {
  const binary = atob(base64);

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++)
    bytes[i] = binary.charCodeAt(i);

  const blob = new Blob([bytes], { type: mime });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = filename;

  a.click();

  URL.revokeObjectURL(url);
}
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

  const parsed = parseComment(latestAnswer.comment || "");

  if (loadedInspection.role === "operator" && !loadedInspection.end_date) {

    nextDraft[questionId] = {
      update: "pending",
      comment: "",
      filename: "",
      mime: "",
      base64: ""
    };

  } else {

    nextDraft[questionId] = {
      update: latestAnswer.update || "",
      comment: parsed.text,
      filename: parsed.filename,
      mime: parsed.mime,
      base64: parsed.data
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

  const answers: Record<
  string,
  {
    update: string;
    comment: string;
  }
> = {};

Object.entries(draft).forEach(([questionId, answer]) => {
  const storedComment = buildComment(
    answer.comment,
    answer.filename,
    answer.mime,
    answer.base64
  );

  if (inspection?.role === 'operator') {
    if (answer.comment.trim() || answer.filename) {
      answers[questionId] = {
        update: 'pending',
        comment: storedComment,
      };
    }
  } else if (answer.update) {
    answers[questionId] = {
      update: answer.update,
      comment: storedComment,
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

                          {(() => {

  const parsed = parseComment(entry.comment || "");

  return (
    <>

      {parsed.text && (
        <div className="mt-1 text-sm whitespace-pre-wrap">
          {parsed.text}
        </div>
      )}

      {parsed.filename && (
        <button
          type="button"
          className="mt-2 text-blue-600 underline text-sm"
          onClick={() =>
            downloadAttachment(
              parsed.filename,
              parsed.mime,
              parsed.data
            )
          }
        >
          📎 Attached: {parsed.filename}
        </button>
      )}

    </>
  );

})()}

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

                   <>
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

  <input
    type="file"
    className="border p-2 rounded w-full"
    onChange={(e) => {

      const file = e.target.files?.[0];

      if (!file)
        return;

      if (file.size > 1024 * 1024) {
        alert("Maximum attachment size is 1 MB");
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {

        const base64 = (reader.result as string).split(",")[1];

        setDraft((current) => ({
          ...current,
          [questionId]: {
            ...current[questionId],
            filename: file.name,
            mime: file.type,
            base64: base64,
          },
        }));

      };

      reader.readAsDataURL(file);

    }}
  />

  {answerDraft.filename && (

    <div className="text-sm text-slate-600">

      📎 Attached: {answerDraft.filename}

    </div>

  )}

  {answerDraft.filename && (

    <button
      type="button"
      className="text-red-600 underline text-sm"
      onClick={() =>
        setDraft((current) => ({
          ...current,
          [questionId]: {
            ...current[questionId],
            filename: "",
            mime: "",
            base64: "",
          },
        }))
      }
    >
      Remove attachment
    </button>

  )}

</>
                    </div>
                  ) : (
                    <div className="border rounded p-3 bg-slate-100 text-slate-500">
                      <div>
                        Current result:{' '}
                        {latestAnswer.update === 'pending'
                          ? 'Need Further Clarification'
                          : latestAnswer.update || 'Not answered'}
                      </div>

                  {(() => {

  const parsed = parseComment(latestAnswer.comment || "");

  return (
    <>

      {parsed.text && (
        <div className="mt-1 whitespace-pre-wrap">
          {parsed.text}
        </div>
      )}

      {parsed.filename && (
        <button
          type="button"
          className="mt-2 text-blue-600 underline"
          onClick={() =>
            downloadAttachment(
              parsed.filename,
              parsed.mime,
              parsed.data
            )
          }
        >
          📎 Attached: {parsed.filename}
        </button>
      )}

    </>
  );

})()}
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
