import {
  Box, Card, CardContent, Chip, CircularProgress, Grid,
  LinearProgress, Paper, Skeleton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography, Avatar, Alert
} from '@mui/material'
import {
  People, Assessment, TrendingUp, School,
  Warning, Star, EmojiEvents, Psychology, Refresh
} from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { getDashboard } from '../services/api'

// Chart palette — matches the theme tokens; exported for use by chart components
export const CHART_COLORS = {
  primary: '#1E3A8A',
  cyan:    '#06B6D4',
  amber:   '#F59E0B',
  green:   '#10B981',
  red:     '#EF4444',
  purple:  '#8B5CF6',
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg, trend, loading }) {
  return (
    <Card sx={{ position: 'relative', overflow: 'hidden' }}>
      <Box sx={{
        position: 'absolute', top: -18, right: -18,
        width: 80, height: 80, borderRadius: '50%',
        background: `${color}14`, pointerEvents: 'none',
      }} />
      <CardContent>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box>
            {loading
              ? <Skeleton width={48} height={48} />
              : <Typography variant="h3" fontWeight={800} color="#111827" lineHeight={1.1}>{value}</Typography>
            }
            <Typography variant="body2" color="#6B7280" mt={0.5} fontWeight={500}>{label}</Typography>
            {trend && !loading && (
              <Typography variant="caption" sx={{ color: CHART_COLORS.green, fontWeight: 600, mt: 0.5, display: 'block' }}>
                {trend}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: bg, width: 46, height: 46, borderRadius: '12px' }}>
            <Box sx={{ color, display: 'flex' }}>{icon}</Box>
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  )
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ icon, title, color = CHART_COLORS.primary }) {
  return (
    <Box display="flex" alignItems="center" gap={1} mb={2}>
      <Box sx={{ width: 3, height: 20, borderRadius: 2, bgcolor: color, flexShrink: 0 }} />
      <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography variant="h6" fontWeight={700} color="#111827">{title}</Typography>
    </Box>
  )
}

// ── Table skeleton rows ────────────────────────────────────────────────────
function TableSkeleton({ cols = 3, rows = 3 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: cols }).map((_, j) => (
        <TableCell key={j}><Skeleton /></TableCell>
      ))}
    </TableRow>
  ))
}

// ── Empty state ────────────────────────────────────────────────────────────
function EmptyRow({ cols, message }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} align="center" sx={{ color: '#9CA3AF', py: 3 }}>
        {message}
      </TableCell>
    </TableRow>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getDashboard()
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.error || 'Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [])

  const summary           = data?.summary           || {}
  const high_performers   = data?.high_performers   || []
  const skill_gaps        = data?.skill_gaps        || []
  const at_risk           = data?.at_risk           || []
  const performance_trends = data?.performance_trends || []

  return (
    <Box>
      {/* Page header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color="#111827">Dashboard</Typography>
        <Typography variant="body2" color="#6B7280" mt={0.25}>
          Overview of employee performance and development activity
        </Typography>
      </Box>

      {/* API error banner */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<Refresh />}>
          {error}
        </Alert>
      )}

      {/* Summary stat cards */}
      <Grid container spacing={2.5} mb={4}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<People />} label="Active Employees"
            value={summary.total_employees ?? '—'}
            color={CHART_COLORS.primary} bg={`${CHART_COLORS.primary}18`}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<Assessment />} label="Approved Reviews"
            value={summary.total_reviews ?? '—'}
            color={CHART_COLORS.green} bg={`${CHART_COLORS.green}18`}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<TrendingUp />} label="Active Dev Plans"
            value={summary.active_plans ?? '—'}
            color={CHART_COLORS.amber} bg={`${CHART_COLORS.amber}18`}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<School />} label="Training (90 days)"
            value={summary.recent_training ?? '—'}
            color={CHART_COLORS.cyan} bg={`${CHART_COLORS.cyan}18`}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Detail panels */}
      <Grid container spacing={2.5}>

        {/* High performers */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <SectionHeader icon={<EmojiEvents fontSize="small" />} title="High Performers" color={CHART_COLORS.amber} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell align="right">Avg Rating</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && <TableSkeleton cols={3} rows={3} />}
                  {!loading && high_performers.length === 0 && <EmptyRow cols={3} message="No high performers yet" />}
                  {!loading && high_performers.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 26, height: 26, fontSize: '0.7rem', fontWeight: 700, bgcolor: `${CHART_COLORS.primary}22`, color: CHART_COLORS.primary }}>
                            {e.first_name?.[0]}
                          </Avatar>
                          {e.first_name} {e.last_name}
                        </Box>
                      </TableCell>
                      <TableCell>{e.department || '—'}</TableCell>
                      <TableCell align="right">
                        <Chip label={e.avg_rating} color="success" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* At-risk employees */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <SectionHeader icon={<Warning fontSize="small" />} title="Employees at Risk" color={CHART_COLORS.red} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell align="right">Avg Rating</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && <TableSkeleton cols={3} rows={3} />}
                  {!loading && at_risk.length === 0 && <EmptyRow cols={3} message="No at-risk employees" />}
                  {!loading && at_risk.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 26, height: 26, fontSize: '0.7rem', fontWeight: 700, bgcolor: `${CHART_COLORS.red}18`, color: CHART_COLORS.red }}>
                            {e.first_name?.[0]}
                          </Avatar>
                          {e.first_name} {e.last_name}
                        </Box>
                      </TableCell>
                      <TableCell>{e.department || '—'}</TableCell>
                      <TableCell align="right">
                        <Chip label={e.avg_rating ?? 'N/A'} color="error" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Skill gap analysis */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <SectionHeader icon={<Psychology fontSize="small" />} title="Skill Gap Analysis" color={CHART_COLORS.cyan} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Competency</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && <TableSkeleton cols={3} rows={3} />}
                  {!loading && skill_gaps.length === 0 && <EmptyRow cols={3} message="No skill gaps found" />}
                  {!loading && skill_gaps.map((g, i) => (
                    <TableRow key={i}>
                      <TableCell>{g.first_name} {g.last_name}</TableCell>
                      <TableCell>{g.competency}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress
                            variant="determinate"
                            value={(g.current_level / g.target_level) * 100}
                            sx={{
                              flexGrow: 1, height: 7, borderRadius: 4,
                              bgcolor: `${CHART_COLORS.cyan}18`,
                              '& .MuiLinearProgress-bar': { bgcolor: CHART_COLORS.cyan },
                            }}
                          />
                          <Typography variant="caption" color="#6B7280" fontWeight={600}>
                            {g.current_level}/{g.target_level}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Performance trends */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <SectionHeader icon={<Star fontSize="small" />} title="Performance Trends" color={CHART_COLORS.primary} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">Avg Rating</TableCell>
                    <TableCell align="right">Reviews</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && <TableSkeleton cols={4} rows={3} />}
                  {!loading && performance_trends.length === 0 && <EmptyRow cols={4} message="No trend data yet" />}
                  {!loading && performance_trends.map((t) => (
                    <TableRow key={t.period}>
                      <TableCell fontWeight={600}>{t.period}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={t.avg_rating}
                          size="small"
                          sx={{
                            bgcolor: t.avg_rating >= 4 ? `${CHART_COLORS.green}18` : t.avg_rating >= 3 ? `${CHART_COLORS.amber}18` : `${CHART_COLORS.red}18`,
                            color:   t.avg_rating >= 4 ? CHART_COLORS.green        : t.avg_rating >= 3 ? CHART_COLORS.amber        : CHART_COLORS.red,
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">{t.count}</TableCell>
                      <TableCell>
                        <LinearProgress
                          variant="determinate"
                          value={(t.avg_rating / 5) * 100}
                          sx={{
                            height: 6, borderRadius: 3,
                            bgcolor: `${CHART_COLORS.primary}12`,
                            '& .MuiLinearProgress-bar': {
                              background: `linear-gradient(90deg, ${CHART_COLORS.primary} 0%, ${CHART_COLORS.cyan} 100%)`,
                            },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  )
}
