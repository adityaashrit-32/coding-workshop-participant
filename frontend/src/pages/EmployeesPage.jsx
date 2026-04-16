import {
  Alert, Box, Button, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, MenuItem, Paper,
  Skeleton, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography
} from '@mui/material'
import { Add, Delete, Edit, LockOutlined, Refresh } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNotify } from '../components/Notify'
import { useApi } from '../hooks/useApi'
import { useSearch } from '../hooks/useSearch'
import SearchBar from '../components/SearchBar'
import { DUMMY_EMPLOYEES } from '../data/dummy'

const EMPTY = {
  first_name: '', last_name: '', email: '', department: '',
  job_title: '', hire_date: '', status: 'active'
}

export default function EmployeesPage() {
  const { data: employees, loading, error, run } = useApi([], DUMMY_EMPLOYEES)
  const [open, setOpen]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const { canWrite, canDelete } = useAuth()
  const notify = useNotify()

  const load = () => run(getEmployees)

  useEffect(() => { load() }, [])

  const { query, setQuery, filtered: visibleEmployees } = useSearch(employees, [
    (e) => `${e.first_name} ${e.last_name}`,
    (e) => e.email,
    (e) => e.department,
    (e) => e.job_title,
    (e) => e.status,
  ])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit   = (emp) => {
    setEditing(emp)
    setForm({ ...emp, hire_date: emp.hire_date?.slice(0, 10) || '' })
    setOpen(true)
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      notify('First name, last name and email are required', 'warning')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await updateEmployee(editing.id, form)
        notify('Employee updated', 'success')
      } else {
        await createEmployee(form)
        notify('Employee created', 'success')
      }
      setOpen(false)
      load()
    } catch (ex) {
      notify(ex.response?.data?.error || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this employee?')) return
    try {
      await deleteEmployee(id)
      notify('Employee deleted', 'success')
      load()
    } catch (ex) {
      notify(ex.response?.data?.error || 'Delete failed', 'error')
    }
  }

  const showActions = canWrite() || canDelete()

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} gap={2} flexWrap="wrap">
        <Typography variant="h5" fontWeight={700}>Employees</Typography>
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <SearchBar value={query} onChange={setQuery} placeholder="Search employees…" />
          {canWrite() ? (
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Employee</Button>
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
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Job Title</TableCell>
              <TableCell>Status</TableCell>
              {showActions && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: showActions ? 6 : 5 }).map((_, j) => (
                  <TableCell key={j}><Skeleton /></TableCell>
                ))}
              </TableRow>
            ))}
            {!loading && visibleEmployees.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={showActions ? 6 : 5} align="center" sx={{ color: '#9CA3AF', py: 4 }}>
                  {query ? `No results for "${query}"` : 'No employees found'}
                </TableCell>
              </TableRow>
            )}
            {!loading && visibleEmployees.map((emp) => (
              <TableRow key={emp.id} hover>
                <TableCell>{emp.first_name} {emp.last_name}</TableCell>
                <TableCell>{emp.email}</TableCell>
                <TableCell>{emp.department || '—'}</TableCell>
                <TableCell>{emp.job_title || '—'}</TableCell>
                <TableCell>
                  <Chip label={emp.status} color={emp.status === 'active' ? 'success' : 'default'} size="small" />
                </TableCell>
                {showActions && (
                  <TableCell align="right">
                    {canWrite() && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(emp)}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                    {canDelete() && (
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => remove(emp.id)}><Delete fontSize="small" /></IconButton>
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
        <DialogTitle>{editing ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box display="flex" gap={2}>
              <TextField label="First Name" value={form.first_name} onChange={set('first_name')} required fullWidth />
              <TextField label="Last Name"  value={form.last_name}  onChange={set('last_name')}  required fullWidth />
            </Box>
            <TextField label="Email" type="email" value={form.email} onChange={set('email')} required fullWidth />
            <TextField label="Department" value={form.department} onChange={set('department')} fullWidth />
            <TextField label="Job Title"  value={form.job_title}  onChange={set('job_title')}  fullWidth />
            <TextField label="Hire Date" type="date" value={form.hire_date} onChange={set('hire_date')}
              fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Status" select value={form.status} onChange={set('status')} fullWidth>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
