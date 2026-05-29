import { create } from 'zustand'

/**
 * uiStore
 * Transient UI state: zoom/pan, toasts, edit mode, drawing.
 */
export const useUiStore = create((set, get) => ({
  // ── View routing ───────────────────────────────────────────────────────────
  view: 'map',
  setView: (view) => set({ view }),

  // ── Edit mode ─────────────────────────────────────────────────────────────
  editMode: 'view',
  setEditMode: (editMode) => set({ editMode }),

  // ── Canvas zoom/pan ────────────────────────────────────────────────────────
  scale:    1,
  stagePos: { x: 0, y: 0 },
  setScale:    (scale)    => set({ scale: Math.max(0.1, Math.min(5, scale)) }),
  setStagePos: (stagePos) => set({ stagePos }),
  resetView:   ()         => set({ scale: 1, stagePos: { x: 0, y: 0 } }),
  zoomIn:      ()         => set(s => ({ scale: Math.min(5, +(s.scale + 0.2).toFixed(2)) })),
  zoomOut:     ()         => set(s => ({ scale: Math.max(0.1, +(s.scale - 0.2).toFixed(2)) })),

  // ── Toast notifications ────────────────────────────────────────────────────
  toasts: [],

  toast(message, type = 'info', duration = 3500) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    set(s => ({ toasts: [...s.toasts, { id, message, type, duration }] }))
    setTimeout(() => get().dismissToast(id), duration)
  },

  dismissToast(id) {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
  },

  // ── Drawing mode (VenueEditor) ─────────────────────────────────────────────
  drawingMode:  false,
  newSeatType:  'standard',
  setDrawingMode:  (v) => set({ drawingMode: v }),
  setNewSeatType:  (t) => set({ newSeatType: t }),

  // ── Assign form overlay ────────────────────────────────────────────────────
  assignFormOpen:   false,
  openAssignForm:   () => set({ assignFormOpen: true }),
  closeAssignForm:  () => set({ assignFormOpen: false }),
}))
