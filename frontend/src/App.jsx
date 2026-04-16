import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { AuthProvider } from './context/AuthContext'
import { SnackProvider } from './components/Notify'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import EmployeesPage from './pages/EmployeesPage'
import ReviewsPage from './pages/ReviewsPage'
import PlansPage from './pages/PlansPage'
import CompetenciesPage from './pages/CompetenciesPage'
import TrainingPage from './pages/TrainingPage'

const P  = '#1E3A8A'
const SL = '#64748B'
const BG = '#F8FAFC'
const TX = '#0F172A'

const theme = createTheme({
  palette: {
    primary:    { main: P,         light: '#2563EB', dark: '#162D6E', contrastText: '#fff' },
    secondary:  { main: SL,        light: '#94A3B8', dark: '#475569', contrastText: '#fff' },
    success:    { main: '#10B981', light: '#34D399', dark: '#059669', contrastText: '#fff' },
    error:      { main: '#EF4444', light: '#F87171', dark: '#DC2626', contrastText: '#fff' },
    warning:    { main: '#F59E0B', light: '#FBB740', dark: '#D97706', contrastText: '#fff' },
    background: { default: BG, paper: '#ffffff' },
    text:       { primary: TX, secondary: SL },
    divider:    '#E2E8F0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 700, color: TX },
    h6: { fontWeight: 600, color: TX },
    subtitle2: { fontWeight: 600, color: SL },
    body2:     { color: SL },
    button:    { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
    caption:   { color: SL },
  },
  shape: { borderRadius: 8 },
  shadows: [
    'none',
    '0 1px 2px rgba(15,23,42,0.06)','0 1px 4px rgba(15,23,42,0.08)',
    '0 2px 8px rgba(15,23,42,0.08)','0 4px 12px rgba(15,23,42,0.10)',
    '0 4px 20px rgba(15,23,42,0.10)','0 8px 24px rgba(15,23,42,0.12)',
    '0 8px 28px rgba(15,23,42,0.12)','0 12px 32px rgba(15,23,42,0.14)',
    '0 12px 36px rgba(15,23,42,0.14)','0 16px 40px rgba(15,23,42,0.16)',
    '0 16px 44px rgba(15,23,42,0.16)','0 20px 48px rgba(15,23,42,0.18)',
    '0 20px 52px rgba(15,23,42,0.18)','0 24px 56px rgba(15,23,42,0.20)',
    '0 24px 60px rgba(15,23,42,0.20)','0 28px 64px rgba(15,23,42,0.22)',
    '0 28px 68px rgba(15,23,42,0.22)','0 32px 72px rgba(15,23,42,0.24)',
    '0 32px 76px rgba(15,23,42,0.24)','0 36px 80px rgba(15,23,42,0.26)',
    '0 36px 84px rgba(15,23,42,0.26)','0 40px 88px rgba(15,23,42,0.28)',
    '0 40px 92px rgba(15,23,42,0.28)','0 44px 96px rgba(15,23,42,0.30)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: BG,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          scrollbarWidth: 'thin',
          scrollbarColor: `${SL}44 transparent`,
          '&::-webkit-scrollbar':       { width: 5 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: `${SL}55`, borderRadius: 4 },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: { root: { background: P, boxShadow: '0 1px 0 #E2E8F0' } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderRight: '1px solid #E2E8F0', boxShadow: 'none', background: '#ffffff' } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6, margin: '1px 8px', width: 'calc(100% - 16px)',
          transition: 'background 0.15s ease',
          '&.Mui-selected': {
            background: `${P}12`,
            '& .MuiListItemIcon-root': { color: P },
            '& .MuiListItemText-primary': { color: P, fontWeight: 700 },
          },
          '&:hover': { background: `${P}08` },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 6, textTransform: 'none', fontWeight: 600, transition: 'background 0.15s ease' },
        containedPrimary: { background: P, '&:hover': { background: '#162D6E' } },
        outlined: { borderColor: '#E2E8F0', '&:hover': { borderColor: P, background: `${P}06` } },
        text: { '&:hover': { background: `${P}08` } },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { transition: 'background 0.15s ease', '&:hover': { background: `${P}0D` } } },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
          border: '1px solid #E2E8F0', transition: 'box-shadow 0.2s ease',
          '&:hover': { boxShadow: '0 4px 16px rgba(15,23,42,0.10)' },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: { root: { padding: '20px 24px', '&:last-child': { paddingBottom: 20 } } },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation1: { boxShadow: '0 1px 3px rgba(15,23,42,0.06)', border: '1px solid #E2E8F0' },
        elevation2: { boxShadow: '0 2px 8px rgba(15,23,42,0.08)' },
        elevation3: { boxShadow: '0 4px 14px rgba(15,23,42,0.10)' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: BG, color: SL, fontWeight: 700, fontSize: '0.72rem',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            borderBottom: '1px solid #E2E8F0', padding: '10px 16px',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background 0.12s ease',
          '&:hover': { backgroundColor: `${P}05` },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderColor: '#E2E8F0', padding: '10px 16px' } },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: P },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: P },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 5, fontWeight: 600, fontSize: '0.75rem' } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 10, boxShadow: '0 20px 60px rgba(15,23,42,0.18)' } },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: '1rem', color: TX, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 },
      },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: '12px 20px', borderTop: '1px solid #E2E8F0' } },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: '8px !important', border: '1px solid #E2E8F0', boxShadow: 'none',
          transition: 'box-shadow 0.2s ease', '&:before': { display: 'none' },
          '&.Mui-expanded': { boxShadow: '0 4px 16px rgba(15,23,42,0.08)' },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: TX, fontSize: '0.72rem', borderRadius: 4, padding: '4px 8px' },
        arrow:   { color: TX },
      },
    },
    MuiAlert:          { styleOverrides: { root: { borderRadius: 6, fontWeight: 500 } } },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, backgroundColor: '#E2E8F0' }, bar: { borderRadius: 4 } } },
    MuiDivider:        { styleOverrides: { root: { borderColor: '#E2E8F0' } } },
  },
})

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <SnackProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard"    element={<DashboardPage />} />
                <Route path="employees"    element={<EmployeesPage />} />
                <Route path="reviews"      element={<ReviewsPage />} />
                <Route path="plans"        element={<PlansPage />} />
                <Route path="competencies" element={<CompetenciesPage />} />
                <Route path="training"     element={<TrainingPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </SnackProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
