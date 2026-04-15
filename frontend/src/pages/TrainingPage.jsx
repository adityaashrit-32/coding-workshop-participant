import {
  Alert, Box, Button, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, MenuItem, Paper,
  Skeleton, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography
} from '@mui/material'
import { Add, Delete, LockOutlined, Refresh } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { getTraining, createTraining, deleteTraining, getEmployees, getCompetencies } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNotify } from '../components/Notify'
import { useApi } from '../hooks/useApi'

const EMPTY = {
  employee_id: '', title: '', provider: '',
  completed_date: '', duration_hours: '', competency_id: '', notes: ''
}

export default function TrainingPage() {
  const { data: records,      loading: rLoading, error, run: runRecords }      = useApi([])
  const { data: employees,    loading: eLoading, run: runEmployees }            = useApi([])
  const { data: competencies, loading: cLoading, run: runCompetencies }         = useApi([])
  const [open, setOpen]     = useState(false)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const { canWrite }        = useAuth()
  const notify              = useNotify()

  const load = () => {
    runRecords(getTraining)
    runEmployees(getEmployees)
    runCompetencies(getCompetencies)
  }

  useEffect(() => { load() }, [])

  const empName  = (id) => { const e = (employees ?? []).find((x) => x.id === id); return e ? `${e.first_name} ${e.last_name}` : id }
  const compName = (id) => (competencies ?? []).find((c) => c.id === id)?.name || '—'
  const set      = (k)  => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    if (!form.employee_id || !form.title) {
      notify('Employee and title required', 'warning')
      return
    }
    setSaving(true)
    try {
      await createTraining(form)
      notify('Training record added', 'success')
      setOpen(false)
      runRecords(getTraining)
    } catch (ex) {
      notify(ex.response?.data?.error || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this training record?')) return
    try {
      await deleteTraining(id)
      notify('Deleted', 'success')
      runRecords(getTraining)
    } catch (ex) {
      notify(ex.response?.data?.error || 'Delete failed', 'error')
    }
  }

  const loading = rLoading || eLoading || cLoading

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Training Records</Typography>
        {canWrite() ? (
          <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(EMPTY); setOpen(true) }}>
            Add Record
          </Button>
        ) : (
          <Chip icon={<LockOutlined />} label="Read-only access" variant="outlined" color="default" />
        )}
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
              <TableCell>Training</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Completed</TableCell>
              <TableCell align="right">Hours</TableCell>
              <TableCell>Competency</TableCell>
              {canWrite() && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: canWrite() ? 7 : 6 }).map((_, j) => (
                  <TableCell key={j}><Skeleton /></TableCell>
                ))}
              </TableRow>
            ))}
            {!loading && (records ?? []).length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={canWrite() ? 7 : 6} align="center" sx={{ color: '#9CA3AF', py: 4 }}>
                  No training records found
                </TableCell>
              </TableRow>
            )}
            {!loading && (records ?? []).map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{empName(r.employee_id)}</TableCell>
                <TableCell>{r.title}</TableCell>
                <TableCell>{r.provider || '—'}</TableCell>
                <TableCell>{r.completed_date?.slice(0, 10) || '—'}</TableCell>
                <TableCell align="right">{r.duration_hours ?? '—'}</TableCell>
                <TableCell>{r.competency_id ? compName(r.competency_id) : '—'}</TableCell>
                {canWrite() && (
                  <TableCell align="right">
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => remove(r.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Training Record</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Employee" select value={form.employee_id} onChange={set('employee_id')} required fullWidth>
              {(employees ?? []).map((e) => <MenuItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</MenuItem>)}
            </TextField>
            <TextField label="Training Title" value={form.title} onChange={set('title')} required fullWidth />
            <TextField label="Provider" value={form.provider} onChange={set('provider')} fullWidth />
            <Box display="flex" gap={2}>
              <TextField label="Completed Date" type="date" value={form.completed_date} onChange={set('completed_date')}
                fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Duration (hours)" type="number" inputProps={{ min: 0, step: 0.5 }}
                value={form.duration_hours} onChange={set('duration_hours')} fullWidth />
            </Box>
            <TextField label="Related Competency" select value={form.competency_id} onChange={set('competency_id')} fullWidth>
              <MenuItem value="">None</MenuItem>
              {(competencies ?? []).map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField label="Notes" multiline rows={2} value={form.notes} onChange={set('notes')} fullWidth />
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
