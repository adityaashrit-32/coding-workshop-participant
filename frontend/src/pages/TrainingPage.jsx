import {
  Box, Button, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, MenuItem, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography
} from '@mui/material'
import { Add, Delete, LockOutlined } from '@mui/icons-material'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotify } from '../components/Notify'
import { DUMMY_TRAINING, DUMMY_EMPLOYEES, DUMMY_COMPETENCIES } from '../data/dummy'

const EMPTY = {
  employee_id: '', title: '', provider: '',
  completed_date: '', duration_hours: '', competency_id: '', notes: ''
}

export default function TrainingPage() {
  const [records, setRecords]       = useState(DUMMY_TRAINING)
  const [employees]                 = useState(DUMMY_EMPLOYEES)
  const [competencies]              = useState(DUMMY_COMPETENCIES)
  const [open, setOpen]             = useState(false)
  const [form, setForm]             = useState(EMPTY)
  const [saving, setSaving]         = useState(false)
  const { canWrite }                = useAuth()
  const notify                      = useNotify()

  const empName  = (id) => { const e = employees.find((x) => x.id === id); return e ? `${e.first_name} ${e.last_name}` : id }
  const compName = (id) => competencies.find((c) => c.id === id)?.name || '—'
  const set      = (k)  => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = () => {
    if (!form.employee_id || !form.title) { notify('Employee and title required', 'warning'); return }
    setSaving(true)
    setTimeout(() => {
      setRecords((prev) => [...prev, { ...form, id: `t${Date.now()}`, created_at: new Date().toISOString() }])
      notify('Training record added', 'success')
      setSaving(false); setOpen(false)
    }, 400)
  }

  const remove = (id) => {
    if (!window.confirm('Delete this training record?')) return
    setRecords((prev) => prev.filter((r) => r.id !== id))
    notify('Deleted', 'success')
  }

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
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={canWrite() ? 7 : 6} align="center">No training records found</TableCell>
              </TableRow>
            )}
            {records.map((r) => (
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
              {employees.map((e) => <MenuItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</MenuItem>)}
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
              {competencies.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
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
