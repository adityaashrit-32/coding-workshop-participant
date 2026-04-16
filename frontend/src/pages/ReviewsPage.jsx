import {
  Alert, Box, Button, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, MenuItem, Paper,
  Skeleton, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography
} from '@mui/material'
import { Add, Delete, Edit, LockOutlined, Refresh } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { getReviews, createReview, updateReview, deleteReview, getAllEmployees } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNotify } from '../components/Notify'
import { useApi } from '../hooks/useApi'
import { useSearch } from '../hooks/useSearch'
import SearchBar from '../components/SearchBar'
import { DUMMY_REVIEWS, DUMMY_EMPLOYEES } from '../data/dummy'

const EMPTY       = { employee_id: '', period: '', rating: '', comments: '', status: 'draft' }
const STATUS_COLOR = { draft: 'default', submitted: 'warning', approved: 'success' }

export default function ReviewsPage() {
  const { data: reviews,   loading: rLoading, error, run: runReviews }   = useApi([], DUMMY_REVIEWS)
  const { data: employees, loading: eLoading, run: runEmployees }         = useApi([], null)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const { canWrite, canDelete } = useAuth()
  const notify = useNotify()

  const load = () => {
    runReviews(getReviews)
    runEmployees(getAllEmployees)
  }

  useEffect(() => { load() }, [])

  const empName = (id) => {
    const e = (employees ?? []).find((x) => x.id === id)
    return e ? `${e.first_name} ${e.last_name}` : id
  }

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit   = (r)  => { setEditing(r); setForm({ ...r }); setOpen(true) }
  const set        = (k)  => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    if (!form.employee_id || !form.period) {
      notify('Employee and period are required', 'warning')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await updateReview(editing.id, form)
        notify('Review updated', 'success')
      } else {
        await createReview(form)
        notify('Review created', 'success')
      }
      setOpen(false)
      runReviews(getReviews)
    } catch (ex) {
      notify(ex.response?.data?.error || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this review?')) return
    try {
      await deleteReview(id)
      notify('Review deleted', 'success')
      runReviews(getReviews)
    } catch (ex) {
      notify(ex.response?.data?.error || 'Delete failed', 'error')
    }
  }

  const loading     = rLoading || eLoading
  const showActions = canWrite() || canDelete()

  const { query, setQuery, filtered: visibleReviews } = useSearch(reviews, [
    (r) => empName(r.employee_id),
    (r) => String(r.rating ?? ''),
    (r) => r.status,
    (r) => r.period,
  ])

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} gap={2} flexWrap="wrap">
        <Typography variant="h5" fontWeight={700}>Performance Reviews</Typography>
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <SearchBar value={query} onChange={setQuery} placeholder="Search reviews…" />
          {canWrite() ? (
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Review</Button>
          ) : (
            <Chip icon={<LockOutlined />} label="Read-only access" variant="outlined" color="default" />
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" startIcon={<Refresh />} onClick={load}>Retry</Button>
        }>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Period</TableCell>
              <TableCell align="right">Rating</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Comments</TableCell>
              {showActions && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: showActions ? 6 : 5 }).map((_, j) => (
                  <TableCell key={j}><Skeleton /></TableCell>
                ))}
              </TableRow>
            ))}
            {!loading && visibleReviews.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={showActions ? 6 : 5} align="center" sx={{ color: '#9CA3AF', py: 4 }}>
                  {query ? `No results for "${query}"` : 'No reviews found'}
                </TableCell>
              </TableRow>
            )}
            {!loading && visibleReviews.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{empName(r.employee_id)}</TableCell>
                <TableCell>{r.period}</TableCell>
                <TableCell align="right">
                  {r.rating
                    ? <Chip label={r.rating} size="small" color={r.rating >= 4 ? 'success' : r.rating >= 3 ? 'warning' : 'error'} />
                    : '—'}
                </TableCell>
                <TableCell>
                  <Chip label={r.status} color={STATUS_COLOR[r.status]} size="small" />
                </TableCell>
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.comments || '—'}
                </TableCell>
                {showActions && (
                  <TableCell align="right">
                    {canWrite() && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                    {canDelete() && (
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => remove(r.id)}><Delete fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Review' : 'New Review'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Employee" select value={form.employee_id} onChange={set('employee_id')} required fullWidth>
              {(employees ?? []).map((e) => (
                <MenuItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</MenuItem>
              ))}
            </TextField>
            <TextField label="Period (e.g. 2024-Q1)" value={form.period} onChange={set('period')} required fullWidth />
            <TextField label="Rating (1–5)" type="number" inputProps={{ min: 1, max: 5, step: 0.5 }}
              value={form.rating} onChange={set('rating')} fullWidth />
            <TextField label="Comments" multiline rows={3} value={form.comments} onChange={set('comments')} fullWidth />
            <TextField label="Status" select value={form.status} onChange={set('status')} fullWidth>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
