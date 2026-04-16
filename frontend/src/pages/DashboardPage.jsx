import {
  Box, Chip, Grid, Paper, Skeleton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography, Alert
} from '@mui/material'
import { useEffect, useState } from 'react'
import { BarChart, PieChart } from '@mui/x-charts'
import {
  getDashboard,
  getAnalyticsPerformanceDist,
  getAnalyticsTrainingCompletion,
  getAnalyticsEmployeesByRole,
} from '../services/api'
import { DUMMY_DASHBOARD } from '../data/dummy'

// ── Corporate palette — 4 colors only ────────────────────────────────────
const C = {
  blue:  '#1E3A8A',
  slate: '#64748B',
  green: '#10B981',
  red:   '#EF4444',
  bg:    '#F8FAFC',
  border:'#E2E8F0',
  text:  '#0F172A',
  muted: '#64748B',
}

// Department slices use tints of the primary blue + slate
const DEPT_COLORS = ['#1E3A8A','#2563EB','#3B82F6','#64748B','#94A3B8','#CBD5E1','#1D4ED8','#475569']

// ── Shared sub-components ─────────────────────────────────────────────────

function PanelTitle({ children }) {
  return (
    <Typography
      variant="subtitle2"
      fontWeight={700}
      color={C.text}
      sx={{ mb: 2.5, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}
    >
      {children}
    </Typography>
  )
}

function Panel({ children, sx = {} }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3, height: '100%',
        border: `1px solid ${C.border}`,
        borderRadius: 2,
        bgcolor: '#fff',
        transition: 'box-shadow 0.2s ease',
        '&:hover': { boxShadow: '0 4px 20px rgba(15,23,42,0.08)' },
        ...sx,
      }}
    >
      {children}
    </Paper>
  )
}

function ChartShell({ loading, height = 260, empty, emptyMessage, children }) {
  if (loading) return <Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: 1.5 }} />
  if (empty)   return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={height}
      sx={{ color: C.muted, fontSize: '0.85rem', border: `1px dashed ${C.border}`, borderRadius: 1.5, gap: 1, px: 3, textAlign: 'center' }}>
      <span>No data available</span>
      {emptyMessage && <span style={{ fontSize: '0.78rem' }}>{emptyMessage}</span>}
    </Box>
  )
  return children
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [dash,     setDash]     = useState(null)
  const [perfDist, setPerfDist] = useState(null)
  const [training, setTraining] = useState(null)
  const [byRole,   setByRole]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [d, p, t, r] = await Promise.all([
          getDashboard(),
          getAnalyticsPerformanceDist(),
          getAnalyticsTrainingCompletion(),
          getAnalyticsEmployeesByRole(),
        ])
        const isEmpty = !d.data?.summary?.total_employees
        setDash(isEmpty ? DUMMY_DASHBOARD : d.data)
        setPerfDist(p.data)
        setTraining(t.data)
        setByRole(r.data)
      } catch {
        setDash(DUMMY_DASHBOARD)
        setError('Could not reach backend — showing sample data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const at_risk = dash?.at_risk || []

  // ── Performance distribution bar data ────────────────────────────────────
  const BAND_ORDER = ['Poor', 'Below', 'Average', 'Strong', 'Exceptional']
  const BAND_COLOR = {
    Exceptional: C.green,
    Strong:      '#2563EB',
    Average:     C.slate,
    Below:       '#F59E0B',
    Poor:        C.red,
  }
  const allBands = (perfDist?.distribution || [])
    .slice()
    .sort((a, b) => BAND_ORDER.indexOf(a.band) - BAND_ORDER.indexOf(b.band))
  const distLabels = allBands.map((d) => d.band)
  const distCounts = allBands.map((d) => d.count)
  const distColors = allBands.map((d) => BAND_COLOR[d.band] || C.slate)

  // ── Employees by department pie data ─────────────────────────────────────
  const deptPieData = (byRole?.breakdown || []).map((r, i) => ({
    id:    i,
    value: r.count,
    label: r.role,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  }))

  // ── Training donut data ───────────────────────────────────────────────────
  const trainingPie = training ? [
    { id: 0, value: training.completed?.count || 0, label: 'Completed', color: C.green },
    { id: 1, value: training.pending?.count   || 0, label: 'Pending',   color: C.slate },
  ] : []
  const trainingEmpty = !training || (trainingPie[0].value === 0 && trainingPie[1].value === 0)

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease both', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } } }}>

      {/* ── Page header ── */}
      <Box mb={4}>
        <Typography variant="h5" fontWeight={700} color={C.text} letterSpacing="-0.01em">
          Dashboard
        </Typography>
        <Typography variant="body2" color={C.muted} mt={0.5}>
          HR analytics overview
        </Typography>
      </Box>

      {error && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2, fontSize: '0.82rem' }}>{error}</Alert>
      )}

      {/* ── Row 1: Performance Distribution + Employees by Department ── */}
      <Grid container spacing={3} mb={3}>

        {/* Performance Distribution — Bar Chart */}
        <Grid item xs={12} md={6}>
          <Panel>
            <PanelTitle>Performance Distribution</PanelTitle>
            <ChartShell loading={loading} height={260} empty={distLabels.length === 0}>
              <BarChart
                height={260}
                series={[{
                  data:  distCounts,
                  label: 'Employees',
                  color: C.blue,
                }]}
                xAxis={[{
                  scaleType: 'band',
                  data: distLabels,
                  colorMap: { type: 'ordinal', colors: distColors },
                  tickLabelStyle: { fontSize: 12, fill: C.muted },
                }]}
                yAxis={[{ min: 0, tickLabelStyle: { fontSize: 11, fill: C.muted } }]}
                margin={{ left: 36, right: 12, top: 12, bottom: 36 }}
                slotProps={{ legend: { hidden: true } }}
              />
            </ChartShell>
            {!loading && perfDist?.avg_rating && (
              <Box display="flex" justifyContent="space-between" mt={2} pt={2} sx={{ borderTop: `1px solid ${C.border}` }}>
                <Typography variant="caption" color={C.muted}>Overall average</Typography>
                <Typography variant="caption" fontWeight={700} color={C.text}>{perfDist.avg_rating} / 5</Typography>
              </Box>
            )}
          </Panel>
        </Grid>

        {/* Employees by Department — Pie Chart */}
        <Grid item xs={12} md={6}>
          <Panel>
            <PanelTitle>Employees by Department</PanelTitle>
            <ChartShell loading={loading} height={260} empty={deptPieData.length === 0}>
              <PieChart
                height={260}
                series={[{
                  data: deptPieData,
                  innerRadius: 0,
                  paddingAngle: 2,
                  cornerRadius: 3,
                  highlightScope: { fade: 'global', highlight: 'item' },
                  arcLabel: (item) => item.value > 0 ? `${item.value}` : '',
                  arcLabelMinAngle: 25,
                }]}
                margin={{ top: 10, bottom: 10, left: 10, right: 150 }}
                slotProps={{
                  legend: {
                    direction: 'column',
                    position: { vertical: 'middle', horizontal: 'right' },
                    itemMarkWidth: 10, itemMarkHeight: 10,
                    labelStyle: { fontSize: 11, fill: C.muted },
                  },
                }}
              />
            </ChartShell>
            {!loading && byRole?.total > 0 && (
              <Box display="flex" justifyContent="space-between" mt={2} pt={2} sx={{ borderTop: `1px solid ${C.border}` }}>
                <Typography variant="caption" color={C.muted}>Total active employees</Typography>
                <Typography variant="caption" fontWeight={700} color={C.text}>{byRole.total}</Typography>
              </Box>
            )}
          </Panel>
        </Grid>

      </Grid>

      {/* ── Row 2: Training Completion + Employees at Risk ── */}
      <Grid container spacing={3}>

        {/* Training Completion — Donut Chart */}
        <Grid item xs={12} md={6}>
          <Panel>
            <PanelTitle>Training Completion</PanelTitle>
            <ChartShell loading={loading} height={260} empty={trainingEmpty}
              emptyMessage="Go to Training → Add Record to populate this chart">
              <PieChart
                height={260}
                series={[{
                  data: trainingPie,
                  innerRadius: 70,
                  paddingAngle: 3,
                  cornerRadius: 4,
                  highlightScope: { fade: 'global', highlight: 'item' },
                  arcLabel: (item) => item.value > 0 ? `${item.value}` : '',
                  arcLabelMinAngle: 20,
                }]}
                margin={{ top: 10, bottom: 10, left: 10, right: 130 }}
                slotProps={{
                  legend: {
                    direction: 'column',
                    position: { vertical: 'middle', horizontal: 'right' },
                    itemMarkWidth: 10, itemMarkHeight: 10,
                    labelStyle: { fontSize: 12, fill: C.muted },
                  },
                }}
              />
            </ChartShell>
            {!loading && training && (
              <Box display="flex" justifyContent="space-between" mt={2} pt={2} sx={{ borderTop: `1px solid ${C.border}` }}>
                <Typography variant="caption" color={C.muted}>Completion rate</Typography>
                <Typography variant="caption" fontWeight={700} color={C.green}>{training.completion_rate_pct}%</Typography>
              </Box>
            )}
          </Panel>
        </Grid>

        {/* Employees at Risk — Table */}
        <Grid item xs={12} md={6}>
          <Panel>
            <PanelTitle>Employees at Risk</PanelTitle>
            {loading
              ? <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 1.5 }} />
              : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {at_risk.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center"
                            sx={{ color: C.muted, py: 6, fontSize: '0.82rem', border: 0 }}>
                            No at-risk employees
                          </TableCell>
                        </TableRow>
                      ) : at_risk.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell sx={{ fontWeight: 500, color: C.text }}>
                            {e.first_name} {e.last_name}
                          </TableCell>
                          <TableCell sx={{ color: C.muted }}>{e.department || '—'}</TableCell>
                          <TableCell align="right">
                            {e.avg_rating != null ? (
                              <Chip
                                label={`Rating: ${e.avg_rating} / 5`}
                                size="small"
                                sx={{ bgcolor: '#EF444412', color: C.red, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${C.red}30` }}
                              />
                            ) : (
                              <Chip
                                label="Never reviewed"
                                size="small"
                                sx={{ bgcolor: '#F59E0B12', color: '#B45309', fontWeight: 700, fontSize: '0.72rem', border: '1px solid #F59E0B40' }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            }
          </Panel>
        </Grid>

      </Grid>
    </Box>
  )
}
