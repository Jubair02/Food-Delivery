import React, { useEffect, useRef, useState } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { useToast } from '../hooks/useToast'
import Modal from '../components/Modal'
import { foodImageUrl, FALLBACK_IMG, money } from '../utils'

const CATEGORIES = ['Salad', 'Rolls', 'Deserts', 'Sandwich', 'Cake', 'Pure Veg', 'Pasta', 'Noodles']
const EMPTY = { name: '', description: '', price: '', category: CATEGORIES[0] }
const UNDO_MS = 5000

const IconEdit = (
  <svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' /><path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
  </svg>
)
const IconTrash = (
  <svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <polyline points='3 6 5 6 21 6' /><path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' /><line x1='10' y1='11' x2='10' y2='17' /><line x1='14' y1='11' x2='14' y2='17' />
  </svg>
)
const IconEye = (
  <svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' /><circle cx='12' cy='12' r='3' />
  </svg>
)
const IconEyeOff = (
  <svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' /><line x1='1' y1='1' x2='23' y2='23' />
  </svg>
)

const Menu = () => {
  const { apiFetch, socket } = useAdminAuth()
  const toast = useToast()

  const [items, setItems] = useState([])

  // Add form
  const [form, setForm] = useState(EMPTY)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Delete + edit modals
  const [confirmItem, setConfirmItem] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY)
  const [editImage, setEditImage] = useState(null)
  const [editPreview, setEditPreview] = useState(null)
  const [editSubmitting, setEditSubmitting] = useState(false)

  // 'all' | 'enabled' | 'disabled'
  const [filter, setFilter] = useState('all')

  // Deferred deletes awaiting their undo window: id -> { item, timer }
  const pendingRef = useRef(new Map())

  const load = async () => {
    const json = await apiFetch('/api/admin/food') // ALL items, incl. disabled
    if (json.success) {
      const pending = pendingRef.current
      setItems(json.data.filter((it) => !pending.has(it._id)))
    }
  }

  useEffect(() => {
    const handler = () => load()
    socket?.on('menu:changed', handler)
    ;(async () => { await load() })()
    return () => socket?.off('menu:changed', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFetch, socket])

  // Flush any pending deletes to the server on unmount so none are lost.
  useEffect(() => {
    const pending = pendingRef.current
    return () => {
      pending.forEach(({ timer }, id) => {
        clearTimeout(timer)
        apiFetch('/api/admin/food/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
      })
      pending.clear()
    }
  }, [apiFetch])

  // ── Add ───────────────────────────────────────────────
  const onImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
  }

  const onAdd = async (e) => {
    e.preventDefault()
    if (!image) { toast.error('Please choose an image.'); return }
    setSubmitting(true)
    const body = new FormData()
    body.append('name', form.name)
    body.append('description', form.description)
    body.append('price', form.price)
    body.append('category', form.category)
    body.append('image', image)
    const json = await apiFetch('/api/admin/food', { method: 'POST', body })
    setSubmitting(false)
    if (json.success) {
      toast.success(`"${form.name}" added to the menu.`)
      setForm(EMPTY)
      setImage(null)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
    } else {
      toast.error(json.message || 'Failed to add item.')
    }
  }

  // ── Delete (confirm → deferred delete + undo) ─────────
  const performDelete = (item) => {
    setConfirmItem(null)
    setItems((prev) => prev.filter((i) => i._id !== item._id)) // optimistic
    const timer = setTimeout(async () => {
      pendingRef.current.delete(item._id)
      const json = await apiFetch('/api/admin/food/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item._id }),
      })
      if (!json.success) { toast.error('Delete failed — restoring.'); load() }
    }, UNDO_MS)
    pendingRef.current.set(item._id, { item, timer })
    toast.info(`Deleted "${item.name}"`, {
      duration: UNDO_MS,
      action: { label: 'Undo', onClick: () => undoDelete(item._id) },
    })
  }

  const undoDelete = (id) => {
    const p = pendingRef.current.get(id)
    if (!p) return
    clearTimeout(p.timer)
    pendingRef.current.delete(id)
    setItems((prev) =>
      [...prev, p.item].sort((a, b) => Number(a._id) - Number(b._id) || a.name.localeCompare(b.name))
    )
  }

  // ── Disable / Enable ──────────────────────────────────
  const toggleDisabled = async (item) => {
    const next = !item.disabled
    setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, disabled: next } : i))) // optimistic
    const json = await apiFetch('/api/admin/food/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item._id, disabled: next }),
    })
    if (json.success) {
      toast.success(`"${item.name}" ${next ? 'disabled — hidden from the storefront' : 'enabled'}.`)
    } else {
      toast.error(json.message || 'Failed to update item.')
      load()
    }
  }

  // ── Edit ──────────────────────────────────────────────
  const openEdit = (item) => {
    setEditItem(item)
    setEditForm({
      name: item.name || '',
      description: item.description || '',
      price: String(item.price ?? ''),
      category: item.category || CATEGORIES[0],
    })
    setEditImage(null)
    if (editPreview) URL.revokeObjectURL(editPreview)
    setEditPreview(null)
  }

  const closeEdit = () => {
    if (editPreview) URL.revokeObjectURL(editPreview)
    setEditPreview(null)
    setEditItem(null)
  }

  const onEditImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setEditImage(file)
    if (editPreview) URL.revokeObjectURL(editPreview)
    setEditPreview(URL.createObjectURL(file))
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    setEditSubmitting(true)
    const body = new FormData()
    body.append('id', editItem._id)
    body.append('name', editForm.name)
    body.append('description', editForm.description)
    body.append('price', editForm.price)
    body.append('category', editForm.category)
    if (editImage) body.append('image', editImage)
    const json = await apiFetch('/api/admin/food/edit', { method: 'POST', body })
    setEditSubmitting(false)
    if (json.success) {
      toast.success(`"${editForm.name}" updated.`)
      setItems((prev) => prev.map((i) => (i._id === editItem._id ? { ...i, ...json.data } : i)))
      closeEdit()
    } else {
      toast.error(json.message || 'Failed to update item.')
    }
  }

  const disabledCount = items.filter((i) => i.disabled).length
  const enabledCount = items.length - disabledCount
  const visible = items.filter((it) =>
    filter === 'all' ? true : filter === 'disabled' ? it.disabled : !it.disabled
  )

  return (
    <div className='page menu-page'>
      <form className='card add-form' onSubmit={onAdd}>
        <div className='card-head'>Add item</div>
        <div className='add-form-body'>
          <label className='upload' htmlFor='img'>
            {preview ? <img src={preview} alt='' /> : <span>Click to upload image</span>}
          </label>
          <input id='img' type='file' accept='image/*' hidden onChange={onImage} />

          <div className='field'>
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder='e.g. Greek Salad' />
          </div>
          <div className='field'>
            <label>Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder='Short description' />
          </div>
          <div className='row'>
            <div className='field'>
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className='field'>
              <label>Price ($)</label>
              <input type='number' min='0' value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder='20' />
            </div>
          </div>
          <button type='submit' disabled={submitting}>{submitting ? 'Adding…' : 'Add Item'}</button>
        </div>
      </form>

      <div className='card'>
        <div className='card-head menu-head'>
          <span>Menu</span>
          <div className='seg' role='tablist' aria-label='Filter menu items'>
            <button type='button' role='tab' aria-selected={filter === 'all'} className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
              All <em>{items.length}</em>
            </button>
            <button type='button' role='tab' aria-selected={filter === 'enabled'} className={filter === 'enabled' ? 'active' : ''} onClick={() => setFilter('enabled')}>
              Enabled <em>{enabledCount}</em>
            </button>
            <button type='button' role='tab' aria-selected={filter === 'disabled'} className={filter === 'disabled' ? 'active' : ''} onClick={() => setFilter('disabled')}>
              Disabled <em>{disabledCount}</em>
            </button>
          </div>
        </div>
        <div className='table'>
          <div className='table-row menu-row table-head'>
            <span>Image</span><span>Name</span><span>Category</span><span>Price</span><span>Actions</span>
          </div>
          {visible.length === 0 && (
            <div className='table-empty'>
              {filter === 'disabled' ? 'No disabled items.' : filter === 'enabled' ? 'No enabled items.' : 'No menu items yet.'}
            </div>
          )}
          {visible.map((it) => (
            <div key={it._id} className={`table-row menu-row ${it.disabled ? 'is-disabled' : ''}`}>
              <img src={foodImageUrl(it.image)} alt='' onError={(e) => { e.currentTarget.src = FALLBACK_IMG }} />
              <span className='ellipsis menu-name'>
                {it.name}
                {it.disabled && <span className='disabled-badge'>Disabled</span>}
              </span>
              <span className='chip'>{it.category}</span>
              <span className='num'>{money(it.price)}</span>
              <span className='row-actions'>
                <button type='button' className='icon-btn edit' onClick={() => openEdit(it)} aria-label={`Edit ${it.name}`}>{IconEdit}</button>
                <button
                  type='button'
                  className={`icon-btn ${it.disabled ? 'enable' : ''}`}
                  onClick={() => toggleDisabled(it)}
                  aria-label={`${it.disabled ? 'Enable' : 'Disable'} ${it.name}`}
                  title={it.disabled ? 'Enable (show on storefront)' : 'Disable (hide from storefront)'}
                >
                  {it.disabled ? IconEye : IconEyeOff}
                </button>
                <button type='button' className='icon-btn danger' onClick={() => setConfirmItem(it)} aria-label={`Delete ${it.name}`}>{IconTrash}</button>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Delete confirmation */}
      <Modal open={!!confirmItem} title='Delete menu item' onClose={() => setConfirmItem(null)}>
        <p className='confirm-text'>
          Delete <strong>“{confirmItem?.name}”</strong> from the menu? You’ll have a few seconds to undo.
        </p>
        <div className='modal-actions'>
          <button type='button' className='btn-ghost' onClick={() => setConfirmItem(null)}>Cancel</button>
          <button type='button' className='btn-danger' onClick={() => performDelete(confirmItem)}>Delete</button>
        </div>
      </Modal>

      {/* Edit */}
      <Modal open={!!editItem} title='Edit menu item' onClose={closeEdit}>
        <form className='edit-form' onSubmit={saveEdit}>
          <div className='edit-image-row'>
            <img
              src={editPreview || foodImageUrl(editItem?.image)}
              alt=''
              onError={(e) => { e.currentTarget.src = FALLBACK_IMG }}
            />
            <label className='btn-ghost small' htmlFor='edit-img'>Change image</label>
            <input id='edit-img' type='file' accept='image/*' hidden onChange={onEditImage} />
          </div>
          <div className='field'>
            <label>Name</label>
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
          </div>
          <div className='field'>
            <label>Description</label>
            <textarea rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          </div>
          <div className='row'>
            <div className='field'>
              <label>Category</label>
              <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className='field'>
              <label>Price ($)</label>
              <input type='number' min='0' value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} required />
            </div>
          </div>
          <div className='modal-actions'>
            <button type='button' className='btn-ghost' onClick={closeEdit}>Cancel</button>
            <button type='submit' className='btn-primary' disabled={editSubmitting}>{editSubmitting ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Menu
