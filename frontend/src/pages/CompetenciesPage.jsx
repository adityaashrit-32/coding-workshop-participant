import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, LinearProgress, MenuItem, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography
} from '@mui/material'
import { Add, Delete, Edit, LockOutlined } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import {
  getCompetencies, createCompetency, updateCompetency, deleteCompetency,
  getEmployeeCompetencies, assignCompetency, getAllEmployees
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNotify } from '../components/Notify'
import { useSearch } from '../hooks/useSearch'
import SearchBar from '../components/SearchBar'
import { DUMMY_COMPETENCIES, DUMMY_EMPLOYEES } from '../data/dummy'

const COMP_EMPTY = { name: '', description: '', category: '' }
const EC_EMPTY   = { employee_id: '', competency_id: '', current_level: 1, target_level: 3 }

export default function CompetenciesPage() {
  const [competencies, setCompetencies]   = useState([])
  const [employeeComps, setEmployeeComps] = useState([])
  const [employees, setEmployees]         = useState([])
  const [loading, setLoading]             = useState(true)
  const [compOpen, setCompOpen]           = useState(false)
  const [assignOpen, setAssignOpen]       = useState(false)
  const [editing, setEditing]             = useState(null)
  const [editingEc, setEditingEc]         = useState(null)
  const [compForm, setCompForm]           = useState(COMP_EMPTY)
  const [ecForm, setEcForm]               = useState(EC_EMPTY)
  const [saving, setSaving]               = useState(false)
  const { canWrite, canDelete, hasRole }  = useAuth()
  const notify                            = useNotify()

  // Only HR may create/edit the competency library; managers may only assign
  const isHR = hasRole('hr')

  const { query, setQuery, filtered: visibleComps } = useSearch(competencies, [
    (c) => c.name,
    (c) => c.category,
  ])

  const load = async () => {
    setLoading(true)
    try {
      const [c, ec, e] = await Promise.all([getCompetencies(), getEmployeeCompetencies(), getAllEmployees()])
      setCompetencies(c.data?.length ? c.data : DUMMY_COMPETENCIES)
      setEmployeeComps(ec.data ?? [])
      setEmployees(e.data ?? [])
    } catch {
      notify('Failed to load competencies', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const setC = (k) => (e) => setCompForm((f) => ({ ...f, [k]: e.target.value }))
  const setE = (k) => (e) => setEcForm((f) => ({ ...f, [k]: e.target.value }))

  const saveComp = async () => {
    if (!compForm.name) { notify('Name required', 'warning'); return }
    setSaving(true)
    try {
      if (editing) await updateCompetency(editing.id, compForm)
      else await createCompetency(compForm)
      notify(editing ? 'Competency updated' : 'Competency created', 'success')
      setCompOpen(false); load()
    } catch (ex) { notify(ex.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const saveAssign = async () => {
    if (!ecForm.employee_id || !ecForm.competency_id) {
      notify('Employee and competency required', 'warning'); return
    }
    setSaving(true)
    try {
      await assignCompetency(ecForm)
      notify(editingEc ? 'Assignment updated' : 'Competency assigned', 'success')
      setAssignOpen(false); setEditingEc(null); load()
    } catch (ex) { notify(ex.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const removeComp = async (id) => {
    if (!window.confirm('Delete this competency?')) return
    try { await deleteCompetency(id); notify('Deleted', 'success'); load() }
    catch (ex) { notify(ex.response?.data?.error || 'Delete failed', 'error') }
  }

  const empName = (id) => {
    const e = employees.find((x) => x.id === id)
    return e ? `${e.first_name} ${e.last_name}` : id
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} gap={2} flexWrap="wrap">
        <Typography variant="h5" fontWeight={700}>Competencies & Skills</Typography>
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <SearchBar value={query} onChange={setQuery} placeholder="Search competencies…" />
          {canWrite() ? (
            <Button variant="outlined" startIcon={<Add />}
              onClick={() => { setAssignOpen(true); setEcForm(EC_EMPTY) }}>
              Assign
            </Button>
          ) : (
            <Chip icon={<LockOutlined />} label="Read-only access" variant="outlined" color="default" />
          )}
          {isHR && (
            <Button variant="contained" startIcon={<Add />}
              onClick={() => { setEditing(null); setCompForm(COMP_EMPTY); setCompOpen(true) }}>
              New Competency
            </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
      ) : (
        <>
          <Typography variant="h6" mb={1}>Competency Library</Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  {isHR && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleComps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isHR ? 4 : 3} align="center" sx={{ color: '#9CA3AF', py: 3 }}>
                      {query ? `No results for "${query}"` : 'No competencies defined'}
                    </TableCell>
                  </TableRow>
                )}
                {visibleComps.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.category || '—'}</TableCell>
                    <TableCell>{c.description || '—'}</TableCell>
                    {isHR && (
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => {
                            setEditing(c)
                            setCompForm({ name: c.name, description: c.description || '', category: c.category || '' })
                            setCompOpen(true)
                          }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canDelete() && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => removeComp(c.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" mb={1}>Employee Skill Assignments</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Competency</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Current / Target</TableCell>
                  <TableCell>Gap</TableCell>
                  {canWrite() && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {employeeComps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canWrite() ? 6 : 5} align="center">No assignments yet</TableCell>
                  </TableRow>
                )}
                {employeeComps.map((ec) => (
                  <TableRow key={ec.id} hover>
                    <TableCell>{empName(ec.employee_id)}</TableCell>
                    <TableCell>{ec.competency_name}</TableCell>
                    <TableCell>{ec.competency_category || '—'}</TableCell>
                    <TableCell>{ec.current_level} / {ec.target_level}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress variant="determinate"
                          value={(ec.current_level / ec.target_level) * 100}
                          color={ec.gap > 1 ? 'error' : 'success'}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }} />
                        <Chip label={ec.gap > 0 ? `Gap: ${ec.gap}` : 'Met'} size="small"
                          color={ec.gap > 1 ? 'error' : ec.gap === 1 ? 'warning' : 'success'} />
                      </Box>
                    </TableCell>
                    {canWrite() && (
                      <TableCell align="right">
                        <Tooltip title="Edit levels">
                          <IconButton size="small" onClick={() => {
                            setEditingEc(ec)
                            setEcForm({
                              employee_id:   ec.employee_id,
                              competency_id: ec.competency_id,
                              current_level: ec.current_level,
                              target_level:  ec.target_level,
                            })
                            setAssignOpen(true)
                          }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Competency dialog — HR only */}
      <Dialog open={compOpen} onClose={() => setCompOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Competency' : 'New Competency'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Name" value={compForm.name} onChange={setC('name')} required fullWidth />
            <TextField label="Category" value={compForm.category} onChange={setC('category')} fullWidth />
            <TextField label="Description" multiline rows={2} value={compForm.description} onChange={setC('description')} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveComp} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Assign dialog — hr + manager */}
      <Dialog open={assignOpen} onClose={() => { setAssignOpen(false); setEditingEc(null) }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEc ? 'Edit Skill Levels' : 'Assign Competency to Employee'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Employee" select value={ecForm.employee_id} onChange={setE('employee_id')} required fullWidth
              disabled={!!editingEc}>
              {employees.map((e) => (
                <MenuItem key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}{e.status === 'inactive' ? ' (inactive)' : ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Competency" select value={ecForm.competency_id} onChange={setE('competency_id')} required fullWidth
              disabled={!!editingEc}>
              {competencies.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <Box display="flex" gap={2}>
              <TextField label="Current Level (1–5)" type="number" inputProps={{ min: 1, max: 5 }}
                value={ecForm.current_level} onChange={setE('current_level')} fullWidth />
              <TextField label="Target Level (1–5)"  type="number" inputProps={{ min: 1, max: 5 }}
                value={ecForm.target_level}  onChange={setE('target_level')}  fullWidth />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAssignOpen(false); setEditingEc(null) }}>Cancel</Button>
          <Button variant="contained" onClick={saveAssign} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
