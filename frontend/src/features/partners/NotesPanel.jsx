import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Eye,
  MessageSquare,
  Paperclip,
  Pencil,
  Pin,
  PlusCircle,
  Trash2,
} from 'lucide-react'
import {
  createNote,
  deleteNote,
  fetchNotes,
  NOTE_CATEGORIES,
  NOTE_PRIORITIES,
  NOTE_VISIBILITIES,
  priorityBadgeClass,
  toggleNotePin,
  updateNote,
} from '../../api/notes'
import { usePermissions } from '../../context/PermissionContext'

/*  Helpers  */

const fmtDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '—'

const visibilityBadge = (v) => {
  switch (v) {
    case 'Management Only': return 'pm-badge pm-badge-warning'
    case 'Public to Partner': return 'pm-badge pm-badge-info'
    default: return 'pm-badge pm-badge-secondary'
  }
}

const emptyForm = {
  note: '',
  category: 'General',
  priority: 'Normal',
  visibility: 'Internal',
  is_pinned: false,
  attachment: null,
}

/* Component  */

export default function NotesPanel({ partnerId }) {
  const queryClient = useQueryClient()
  const { can } = usePermissions()

  const [filters, setFilters] = useState({ category: '', priority: '', visibility: '', search: '' })
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const params = useMemo(() => ({ ...filters, page, per_page: 20 }), [filters, page])

  const { data, isLoading } = useQuery({
    queryKey: ['partnerNotes', partnerId, params],
    queryFn: () => fetchNotes(partnerId, params),
    enabled: Boolean(partnerId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['partnerNotes', partnerId] })
    queryClient.invalidateQueries({ queryKey: ['partnerHistory', partnerId] })
  }

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing ? updateNote(editing.id, payload) : createNote(partnerId, payload),
    onSuccess: () => {
      invalidate()
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm)
    },
    onError: (err) => alert(err?.response?.data?.message ?? 'Could not save the note.'),
  })

  const pinMutation = useMutation({
    mutationFn: (noteId) => toggleNotePin(noteId),
    onSuccess: () => invalidate(),
  })

  const deleteMutation = useMutation({
    mutationFn: (noteId) => deleteNote(noteId),
    onSuccess: () => { invalidate(); setDeleteTarget(null) },
  })

  const notes = data?.notes ?? []
  const meta = data?.meta ?? {}
  const summary = meta.summary ?? {}

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }

  const openEdit = (note) => {
    setEditing(note)
    setForm({
      note: note.note,
      category: note.category,
      priority: note.priority,
      visibility: note.visibility,
      is_pinned: note.is_pinned,
      attachment: null,
    })
    setShowForm(true)
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="p-3">
      {/* KPI strip */}
      <div className="pm-stat-row mb-3">
        <div className="pm-stat-card pm-stat-blue">
          <div className="pm-stat-icon"><MessageSquare size={18} strokeWidth={2.5} /></div>
          <div className="pm-stat-body">
            <div className="pm-stat-value">{summary.total_notes ?? 0}</div>
            <div className="pm-stat-label">Total Notes</div>
          </div>
        </div>
        <div className="pm-stat-card pm-stat-violet">
          <div className="pm-stat-icon"><Pin size={18} strokeWidth={2.5} /></div>
          <div className="pm-stat-body">
            <div className="pm-stat-value">{summary.pinned ?? 0}</div>
            <div className="pm-stat-label">Pinned</div>
          </div>
        </div>
        <div className="pm-stat-card pm-stat-amber">
          <div className="pm-stat-icon"><MessageSquare size={18} strokeWidth={2.5} /></div>
          <div className="pm-stat-body">
            <div className="pm-stat-value">{summary.urgent ?? 0}</div>
            <div className="pm-stat-label">High / Urgent</div>
          </div>
        </div>
        <div className="pm-stat-card pm-stat-green">
          <div className="pm-stat-icon"><Eye size={18} strokeWidth={2.5} /></div>
          <div className="pm-stat-body">
            <div className="pm-stat-value">{Object.keys(summary.by_category ?? {}).length}</div>
            <div className="pm-stat-label">Categories Used</div>
          </div>
        </div>
      </div>

      {/* Notes card */}
      <div className="pm-card">
        <div className="pm-card-header">
          <h6 className="pm-card-title mb-0">
            <MessageSquare size={16} className="me-2" />Internal Notes
            <span className="text-muted ms-2" style={{ fontSize: '0.72rem' }}>PRD §80</span>
          </h6>
          {can('note.create') && (
            <button className="btn btn-sm btn-primary d-flex align-items-center gap-1" onClick={openCreate}>
              <PlusCircle size={14} /> Add Note
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="row g-2 px-3 pb-2 pt-1">
          <div className="col-md-4">
            <input className="form-control form-control-sm" placeholder="Search notes…" value={filters.search} onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1) }} />
          </div>
          <div className="col-md-3">
            <select className="form-select form-select-sm" value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1) }}>
              <option value="">All Categories</option>
              {NOTE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select form-select-sm" value={filters.priority} onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1) }}>
              <option value="">All Priority</option>
              {NOTE_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select form-select-sm" value={filters.visibility} onChange={(e) => { setFilters({ ...filters, visibility: e.target.value }); setPage(1) }}>
              <option value="">All Visibility</option>
              {NOTE_VISIBILITIES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        {/* Notes list */}
        <div className="px-3 pb-3">
          {isLoading ? (
            <div className="text-center py-4"><span className="spinner-border spinner-border-sm me-2" />Loading notes…</div>
          ) : notes.length ? (
            notes.map((note) => (
              <div
                key={note.id}
                className="border rounded-3 p-3 mb-2"
                style={{ background: note.is_pinned ? '#fffbeb' : '#fbfcfe', borderColor: note.is_pinned ? '#fde68a' : '#e5e7eb' }}
              >
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                  {note.is_pinned && <Pin size={13} className="text-warning" fill="#f59e0b" />}
                  <span className="pm-badge pm-badge-blue" style={{ fontSize: '0.64rem' }}>{note.category}</span>
                  <span className={priorityBadgeClass(note.priority)} style={{ fontSize: '0.64rem' }}>{note.priority}</span>
                  <span className={visibilityBadge(note.visibility)} style={{ fontSize: '0.64rem' }}>{note.visibility}</span>
                  <div className="ms-auto d-flex gap-1">
                    {can('note.update') && (
                      <button className="btn btn-sm btn-outline-secondary py-0 px-2" style={{ fontSize: '0.66rem' }} title={note.is_pinned ? 'Unpin' : 'Pin'} onClick={() => pinMutation.mutate(note.id)} disabled={pinMutation.isPending}>
                        <Pin size={11} />
                      </button>
                    )}
                    {can('note.update') && (
                      <button className="btn btn-sm btn-outline-secondary py-0 px-2" style={{ fontSize: '0.66rem' }} title="Edit note" onClick={() => openEdit(note)}>
                        <Pencil size={11} />
                      </button>
                    )}
                    {can('note.delete') && (
                      <button className="btn btn-sm btn-outline-danger py-0 px-2" style={{ fontSize: '0.66rem' }} title="Delete note" onClick={() => setDeleteTarget(note)}>
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>{note.note}</div>

                <div className="d-flex flex-wrap align-items-center gap-3 mt-2 text-muted" style={{ fontSize: '0.68rem' }}>
                  <span>{note.created_by_name ?? 'System'}</span>
                  <span>{fmtDateTime(note.created_at)}</span>
                  {note.attachment_url && (
                    <a className="d-flex align-items-center gap-1 text-decoration-none" href={note.attachment_url} target="_blank" rel="noreferrer">
                      <Paperclip size={11} /> {note.attachment_name ?? 'Attachment'}
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-5 text-muted">
              <MessageSquare size={32} className="mb-2 d-block mx-auto text-secondary" />
              <div style={{ fontSize: '0.85rem' }}>
                {activeFilterCount > 0 ? 'No notes match the current filters.' : 'No notes yet.'}
              </div>
              {!activeFilterCount && can('note.create') && (
                <button className="btn btn-primary btn-sm mt-2" onClick={openCreate}>
                  <PlusCircle size={14} className="me-1" /> Add the first note
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="pm-table-footer">
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>Page {meta.current_page} of {meta.last_page} · {meta.total} notes</span>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
              <button className="btn btn-sm btn-outline-secondary" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ══ Add / Edit Note Modal ══ */}
      {showForm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editing ? 'Edit Note' : 'Add Internal Note'}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowForm(false); setEditing(null) }} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Category</label>
                    <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {NOTE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Priority</label>
                    <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                      {NOTE_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Visibility</label>
                    <select className="form-select" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                      {NOTE_VISIBILITIES.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Note *</label>
                    <textarea className="form-control" rows="5" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Write the internal note…" />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold">Attachment <span className="text-muted">(optional — max 10 MB)</span></label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                      onChange={(e) => setForm({ ...form, attachment: e.target.files?.[0] ?? null })}
                    />
                  </div>
                  <div className="col-md-4 d-flex align-items-end">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="pinNote" checked={form.is_pinned} onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} />
                      <label className="form-check-label small" htmlFor="pinNote">Pin this note</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</button>
                <button
                  className="btn btn-primary d-flex align-items-center gap-1"
                  disabled={saveMutation.isPending || !form.note.trim()}
                  onClick={() => saveMutation.mutate(form)}
                >
                  {saveMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {saveMutation.isPending ? 'Saving…' : editing ? 'Update Note' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Delete Confirmation ══ */}
      {deleteTarget && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">Delete Note</h6>
                <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)} />
              </div>
              <div className="modal-body">
                <p className="small mb-0">Delete this note? It will be soft-deleted and remain in the audit trail.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="btn btn-danger btn-sm d-flex align-items-center gap-1" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget.id)}>
                  {deleteMutation.isPending && <span className="spinner-border spinner-border-sm" />}
                  {deleteMutation.isPending ? 'Deleting…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}