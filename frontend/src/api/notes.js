import api from './client';


export const NOTE_CATEGORIES = [
  'Management',
  'Sales',
  'Finance',
  'Network',
  'Marketing',
  'Support Center',
  'General',
];

export const NOTE_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];

export const NOTE_VISIBILITIES = ['Internal', 'Management Only', 'Public to Partner'];

export const fetchNotes = async (partnerId, params = {}) => {
  const res = await api.get(`/partners/${partnerId}/notes`, { params });
  return {
    notes: res.data.data,
    meta: res.data.meta,
  };
};

export const createNote = async (partnerId, payload) => {
  const form = toFormData(payload);
  const res = await api.post(`/partners/${partnerId}/notes`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
};

export const updateNote = async (noteId, payload) => {
  const form = toFormData(payload, { method: 'PUT' });
  const res = await api.post(`/notes/${noteId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
};

export const toggleNotePin = async (noteId) => {
  const res = await api.put(`/notes/${noteId}/pin`);
  return res.data.data;
};

export const deleteNote = async (noteId) => {
  const res = await api.delete(`/notes/${noteId}`);
  return res.data;
};

/** Priority → Bootstrap badge class. */
export const priorityBadgeClass = (priority) => {
  switch (priority) {
    case 'Urgent':
      return 'bg-danger-subtle text-danger';
    case 'High':
      return 'bg-warning-subtle text-warning-emphasis';
    case 'Low':
      return 'bg-secondary-subtle text-secondary';
    default:
      return 'bg-info-subtle text-info-emphasis';
  }
};


function toFormData(payload, { method } = {}) {
  const form = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (value instanceof File) {
      form.append(key, value);
    } else if (typeof value === 'boolean') {
      form.append(key, value ? '1' : '0');
    } else {
      form.append(key, value);
    }
  });

  if (method) form.append('_method', method);
  return form;
}