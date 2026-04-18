import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { uploadIssuePhoto, savePhotoRecord } from '../lib/storage';

// ─── Checklist Page ────────────────────────────────────────────────────────────
// Shared component for PDI, Stockyard maintenance, and Final check screens.
// When a check item is set to 'issue', a photo capture input appears below the note.
// Photos are uploaded to Supabase Storage and a DB trigger creates an admin_alert.
// 'na' state is NOT present — only pending, done, issue.

export type ChecklistType = 'pdi' | 'stockyard' | 'final';

interface CheckRow {
  vehicle_id: string;
  item_id:    string;   // item_id for pdi/final, task_id for stockyard
  section:    string;
  name:       string;
  priority:   'high' | 'med' | 'low';
  state:      'pending' | 'done' | 'issue';
  note:       string;
}

interface Props {
  vehicleId:  string;
  vehicleLabel: string;
  type:       ChecklistType;
  readOnly?:  boolean;
  onBack:     () => void;
}

const TABLE_MAP: Record<ChecklistType, string> = {
  pdi:      'pdi_checks',
  stockyard:'stock_maintenance',
  final:    'final_checks',
};

const ID_COL: Record<ChecklistType, string> = {
  pdi:      'item_id',
  stockyard:'task_id',
  final:    'item_id',
};

const STATE_LABELS: Record<CheckRow['state'], string> = {
  pending: 'Pending',
  done:    'Done',
  issue:   'Issue',
};

const STATE_COLORS: Record<CheckRow['state'], string> = {
  pending: 'bg-[#F5F5F5] text-[#8A8FA3] border-[#E8E8EE]',
  done:    'bg-green-50 text-green-700 border-green-200',
  issue:   'bg-red-50 text-[#D0112B] border-red-200',
};

const PRIORITY_DOT: Record<CheckRow['priority'], string> = {
  high: 'bg-[#D0112B]',
  med:  'bg-amber-400',
  low:  'bg-[#C4C7D0]',
};

const CYCLE: Record<CheckRow['state'], CheckRow['state']> = {
  pending: 'done',
  done:    'issue',
  issue:   'pending',
};

export function ChecklistPage({ vehicleId, vehicleLabel, type, readOnly, onBack }: Props) {
  const [rows, setRows]         = useState<CheckRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving]     = useState<string | null>(null); // item_id being saved
  const [expanded, setExpanded] = useState<string | null>(null); // expanded item

  const table  = TABLE_MAP[type];
  const idCol  = ID_COL[type];
  const title  = type === 'pdi' ? 'PDI Checklist' : type === 'stockyard' ? 'Maintenance' : 'Final Check';

  useEffect(() => {
    setLoadError('');
    supabase
      .from(table)
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('section')
      .then(({ data, error }) => {
        if (error) { setLoadError(error.message); setLoading(false); return; }
        if (data) setRows(data.map(r => ({
          ...r,
          item_id: r[idCol] ?? r.item_id,
        })));
        setLoading(false);
      });
  }, [vehicleId, table, idCol]);

  async function cycleState(row: CheckRow) {
    if (readOnly) return;
    const newState = CYCLE[row.state];
    setSaving(row.item_id);

    // Optimistic update
    setRows(prev => prev.map(r => r.item_id === row.item_id ? { ...r, state: newState } : r));

    const { error } = await supabase
      .from(table)
      .update({ state: newState, checked_at: new Date().toISOString() })
      .eq('vehicle_id', vehicleId)
      .eq(idCol, row.item_id);

    if (error) {
      // Rollback on failure
      setRows(prev => prev.map(r => r.item_id === row.item_id ? { ...r, state: row.state } : r));
    } else if (newState === 'issue') {
      setExpanded(row.item_id);
    }

    setSaving(null);
  }

  async function saveNote(row: CheckRow, note: string) {
    setRows(prev => prev.map(r => r.item_id === row.item_id ? { ...r, note } : r));
    await supabase
      .from(table)
      .update({ note })
      .eq('vehicle_id', vehicleId)
      .eq(idCol, row.item_id);
  }

  // Group by section
  const sections: Record<string, CheckRow[]> = {};
  for (const row of rows) {
    (sections[row.section] ??= []).push(row);
  }

  const doneCount    = rows.filter(r => r.state === 'done').length;
  const issueCount   = rows.filter(r => r.state === 'issue').length;
  const progress     = rows.length ? Math.round((doneCount / rows.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="text-[#1A1A2E]">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-base font-bold text-[#1A1A2E]">{title}</h1>
            <p className="text-xs text-[#8A8FA3]">{vehicleLabel}</p>
          </div>
          {readOnly && (
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Read-only</span>
          )}
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[#F5F5F5] rounded-full h-2">
            <div
              className="h-2 rounded-full bg-[#D0112B] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-[#8A8FA3] whitespace-nowrap">{doneCount}/{rows.length}</span>
          {issueCount > 0 && (
            <span className="text-xs bg-red-100 text-[#D0112B] px-2 py-0.5 rounded-full">
              {issueCount} issue{issueCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {loadError ? (
        <div className="flex justify-center items-center h-40 px-6 text-center">
          <span className="text-[#D0112B] text-sm">{loadError}</span>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-40">
          <span className="text-[#8A8FA3] text-sm">Loading…</span>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-4 pb-8">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section} className="bg-white rounded-[20px] overflow-hidden">
              <div className="px-4 py-3 bg-[#F5F5F5] border-b border-[#E8E8EE]">
                <span className="text-xs font-semibold text-[#8A8FA3] uppercase tracking-wide">{section}</span>
              </div>
              <div className="divide-y divide-[#F5F5F5]">
                {items.map(row => (
                  <ChecklistItem
                    key={row.item_id}
                    row={row}
                    readOnly={!!readOnly}
                    isSaving={saving === row.item_id}
                    isExpanded={expanded === row.item_id}
                    onToggle={() => setExpanded(e => e === row.item_id ? null : row.item_id)}
                    onCycleState={() => cycleState(row)}
                    onSaveNote={(note) => saveNote(row, note)}
                    vehicleId={vehicleId}
                    checklistType={type}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Individual checklist item ──────────────────────────────────────────────────

function ChecklistItem({
  row, readOnly, isSaving, isExpanded, onToggle, onCycleState, onSaveNote, vehicleId, checklistType,
}: {
  row:           CheckRow;
  readOnly:      boolean;
  isSaving:      boolean;
  isExpanded:    boolean;
  onToggle:      () => void;
  onCycleState:  () => void;
  onSaveNote:    (note: string) => void;
  vehicleId:     string;
  checklistType: ChecklistType;
}) {
  const [note, setNote]             = useState(row.note ?? '');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photos, setPhotos]         = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setPhotoError('');
    try {
      const { path, url } = await uploadIssuePhoto(vehicleId, row.item_id, file);
      await savePhotoRecord({
        vehicleId,
        context:     checklistType === 'stockyard' ? 'stockyard' : checklistType,
        checkItemId: row.item_id,
        storagePath: path,
        url,
      });
      setPhotos(p => [...p, url]);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Upload failed');
    }
    setPhotoUploading(false);
  }

  return (
    <div className={`px-4 py-3 ${row.state === 'issue' ? 'bg-red-50/30' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Priority dot */}
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[row.priority]}`} />

        {/* Name + expand toggle */}
        <button
          className="flex-1 text-left"
          onClick={onToggle}
        >
          <span className="text-sm font-medium text-[#1A1A2E]">{row.name}</span>
          {row.note && (
            <p className="text-xs text-[#8A8FA3] mt-0.5 truncate">{row.note}</p>
          )}
        </button>

        {/* State badge — tap to cycle */}
        {!readOnly && (
          <button
            onClick={onCycleState}
            disabled={isSaving}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 ${STATE_COLORS[row.state]} transition-all`}
          >
            {isSaving ? '…' : STATE_LABELS[row.state]}
          </button>
        )}
        {readOnly && (
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 ${STATE_COLORS[row.state]}`}>
            {STATE_LABELS[row.state]}
          </span>
        )}
      </div>

      {/* Expanded: note + photo capture */}
      {isExpanded && !readOnly && (
        <div className="mt-3 space-y-3 pl-5">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={() => onSaveNote(note)}
            placeholder="Add a note…"
            rows={2}
            className="w-full border border-[#E8E8EE] rounded-xl px-3 py-2 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#D0112B] resize-none"
          />

          {/* Photo capture (appears when state is 'issue') */}
          {row.state === 'issue' && (
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={photoUploading}
                className="flex items-center gap-2 text-xs text-[#D0112B] font-semibold border border-[#D0112B] rounded-xl px-3 py-2 bg-white disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">add_a_photo</span>
                {photoUploading ? 'Uploading…' : 'Add Photo'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoCapture}
              />
              {photoError && (
                <p className="text-xs text-[#D0112B] mt-1">{photoError}</p>
              )}
              {photos.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {photos.map((url, i) => (
                    <img key={i} src={url} alt={`Issue photo ${i + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border border-[#E8E8EE]" />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
