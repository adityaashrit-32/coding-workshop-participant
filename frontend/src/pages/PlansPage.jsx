import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button,
  Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  LinearProgress, MenuItem, Paper, Skeleton, Slider, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography
} from '@mui/material'
import { Add, Delete, Edit, ExpandMore, LockOutlined, Refresh } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import {
  getPlans, createPlan, updatePlan, deletePlan,
  createGoal, updateGoal, getEmployees
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNotify } from '../components/Notify'
import { useApi } from '../hooks/useApi'

const PLAN_EMPTY   = { employee_id: '', title: '', description: '', start_date: '', end_date: '', status: 'active' }
const GOAL_EMPTY   = { plan_id: '', title: '', description: '', progress: 0, due_date: '', status: 'pending' }
const STATUS_COLOR = { active: 'success', completed: 'info', cancelled: 'default' }
const GOAL_COLOR   = { pending: 'default', in_progress: 'warning', completed: 'success' }

export default function PlansPage() {
  const { data: plans,     loading: pLoading, error, run: runPlans }     = useApi([])
  const { data: employees, loading: eLoading, run: runEmployees }         = useApi([])
  const [planOpen, setPlanOpen]       = useState(false)
  const [goalOpen, setGoalOpen]       = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)
  const [planForm, setPlanForm]       = useState(PLAN_EMPTY)
  const [goalForm, setGoalForm]       = useState(GOAL_EMPTY)
  const [saving, setSaving]           = useState(false)
  const { canWrite, canDelete }       = useAuth()
  const notify                        = useNotify()

  const load = () => {
    runPlans(getPlans)
    runEmployees(getEmployees)
  }

  useEffect(() => { load() }, [])

  const empName = (id) => {
    const e = (employees ?? []).find((x) => x.id === id)
    return e ? `${e.first_name} ${e.last_name}` : id
  }

  const setP = (k) => (e) => setPlanForm((f) => ({ ...f, [k]: e.target.value }))
  const setG = (k) => (e) => setGoalForm((f) => ({ ...f, [k]: e.target.value }))

  const savePlan = async () => {
    if (!planForm.employee_id || !planForm.title) {
      notify('Employee and title required', 'warning')
      return
    }
    setSaving(true)
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, planForm)
        notify('Plan updated', 'success')
      } else {
        await createPlan(planForm)
        notify('Plan created', 'success')
      }
      setPlanOpen(false)
      runPlans(getPlans)
    } catch (ex) {
      notify(ex.response?.data?.error || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveGoal = async () => {
    if (!goalForm.title) { notify('Title required', 'warning'); return }
    setSaving(true)
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, goalForm)
        notify('Goal updated', 'success')
      } else {
        await createGoal(goalForm)
        notify('Goal created', 'success')
      }
      setGoalOpen(false)
      runPlans(getPlans)
    } catch (ex) {
      notify(ex.response?.data?.error || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const removePlan = async (id) => {
    if (!window.confirm('Delete this plan?')) return
    try {
      await deletePlan(id)
      notify('Plan deleted', 'success')
      runPlans(getPlans)
    } catch (ex) {
      notify(ex.response?.data?.error || 'Delete failed', 'error')
    }
  }

  const loading = pLoading || eLoading

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Development Plans</Typography>
        {canWrite() ? (
          <Button variant="contained" startIcon={<Add />}
            onClick={() => { setEditingPlan(null); setPlanForm(PLAN_EMPTY); setPlanOpen(true) }}>
            New Plan
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

      {loading && Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} height={64} sx={{ mb: 1, borderRadius: 2 }} />
      ))}

      {!loading && (plans ?? []).length === 0 && !error && (
        <Typography color="text.secondary">No development plans found.</Typography>
      )}

      {!loading && (plans ?? []).map((plan) => (
        <Accordion key={plan.id} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={2} width="100%">
              <Typography fontWeight={600} sx={{ flexGrow: 1 }}>{plan.title}</Typography>
              <Typography variant="body2" color="text.secondary">{empName(plan.employee_id)}</Typography>
              <Chip label={plan.status} color={STATUS_COLOR[plan.status]} size="small" sx={{ mr: 1 }} />
              {canWrite() && (
                <Tooltip title="Edit plan">
                  <IconButton size="small" onClick={(e) => {
                    e.stopPropagation()
                    setEditingPlan(plan)
                    setPlanForm({ ...plan, start_date: plan.start_date?.slice(0, 10) || '', end_date: plan.end_date?.slice(0, 10) || '' })
                    setPlanOpen(true)
                  }}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {canDelete() && (
                <Tooltip title="Delete plan">
                  <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); removePlan(plan.id) }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </AccordionSummary>

          <AccordionDetails>
            {plan.description && <Typography variant="body2" mb={2}>{plan.description}</Typography>}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2">Goals</Typography>
              {canWrite() && (
                <Button size="small" startIcon={<Add />}
                  onClick={() => { setEditingGoal(null); setGoalForm({ ...GOAL_EMPTY, plan_id: plan.id }); setGoalOpen(true) }}>
                  Add Goal
                </Button>
              )}
            </Box>

            {(!plan.goals || plan.goals.length === 0) ? (
              <Typography variant="body2" color="text.secondary">No goals yet.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Goal</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Due</TableCell>
                      <TableCell>Status</TableCell>
                      {canWrite() && <TableCell align="right">Edit</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {plan.goals.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell>{g.title}</TableCell>
                        <TableCell sx={{ minWidth: 140 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress variant="determinate" value={g.progress}
                              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }} />
                            <Typography variant="caption">{g.progress}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{g.due_date?.slice(0, 10) || '—'}</TableCell>
                        <TableCell>
                          <Chip label={g.status} color={GOAL_COLOR[g.status]} size="small" />
                        </TableCell>
                        {canWrite() && (
                          <TableCell align="right">
                            <Tooltip title="Edit goal">
                              <IconButton size="small" onClick={() => {
                                setEditingGoal(g)
                                setGoalForm({ ...g, due_date: g.due_date?.slice(0, 10) || '' })
                                setGoalOpen(true)
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
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Plan dialog */}
      <Dialog open={planOpen} onClose={() => setPlanOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPlan ? 'Edit Plan' : 'New Development Plan'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Employee" select value={planForm.employee_id} onChange={setP('employee_id')} required fullWidth>
              {(employees ?? []).map((e) => <MenuItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</MenuItem>)}
            </TextField>
            <TextField label="Title" value={planForm.title} onChange={setP('title')} required fullWidth />
            <TextField label="Description" multiline rows={2} value={planForm.description} onChange={setP('description')} fullWidth />
            <Box display="flex" gap={2}>
              <TextField label="Start Date" type="date" value={planForm.start_date} onChange={setP('start_date')} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="End Date"   type="date" value={planForm.end_date}   onChange={setP('end_date')}   fullWidth InputLabelProps={{ shrink: true }} />
            </Box>
            <TextField label="Status" select value={planForm.status} onChange={setP('status')} fullWidth>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePlan} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Goal dialog */}
      <Dialog open={goalOpen} onClose={() => setGoalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Title" value={goalForm.title} onChange={setG('title')} required fullWidth />
            <TextField label="Description" multiline rows={2} value={goalForm.description} onChange={setG('description')} fullWidth />
            <Box>
              <Typography gutterBottom>Progress: {goalForm.progress}%</Typography>
              <Slider value={goalForm.progress} onChange={(_, v) => setGoalForm((f) => ({ ...f, progress: v }))}
                min={0} max={100} step={5} valueLabelDisplay="auto" />
            </Box>
            <TextField label="Due Date" type="date" value={goalForm.due_date} onChange={setG('due_date')} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Status" select value={goalForm.status} onChange={setG('status')} fullWidth>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveGoal} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
