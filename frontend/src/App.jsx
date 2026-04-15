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

// ─── Design tokens ────────────────────────────────────────────────────────
const P = '#1E3A8A'   // primary blue
const S = '#06B6D4'   // secondary cyan
const A = '#F59E0B'   // accent amber
const BG = '#F3F4F6'  // background
const TX = '#111827'  // text

const theme = createTheme({
  palette: {
    primary:    { main: P,    light: '#3B5FBF', dark: '#162D6E', contrastText: '#fff' },
    secondary:  { main: S,    light: '#38D4EC', dark: '#0891B2', contrastText: '#fff' },
    warning:    { main: A,    light: '#FBB740', dark: '#D97706', contrastText: '#fff' },
    success:    { main: '#10B981', light: '#34D399', dark: '#059669', contrastText: '#fff' },
    error:      { main: '#EF4444', light: '#F87171', dark: '#DC2626', contrastText: '#fff' },
    background: { default: BG, paper: '#ffffff' },
    text:       { primary: TX, secondary: '#6B7280' },
    divider:    'rgba(30,58,138,0.10)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, color: TX },
    h2: { fontWeight: 700, color: TX },
    h3: { fontWeight: 700, color: TX },
    h4: { fontWeight: 700, color: TX },
    h5: { fontWeight: 700, color: TX },
    h6: { fontWeight: 600, color: TX },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 600, color: '#6B7280' },
    body2:     { color: '#6B7280' },
    button:    { fontWeight: 600, letterSpacing: '0.02em', textTransform: 'none' },
    caption:   { color: '#9CA3AF' },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 3px rgba(30,58,138,0.06), 0 1px 2px rgba(30,58,138,0.04)',
    '0 2px 6px rgba(30,58,138,0.08), 0 1px 3px rgba(30,58,138,0.05)',
    '0 4px 12px rgba(30,58,138,0.10), 0 2px 4px rgba(30,58,138,0.06)',
    '0 6px 16px rgba(30,58,138,0.12), 0 3px 6px rgba(30,58,138,0.07)',
    '0 8px 24px rgba(30,58,138,0.13), 0 4px 8px rgba(30,58,138,0.08)',
    '0 10px 28px rgba(30,58,138,0.14)',
    '0 12px 32px rgba(30,58,138,0.15)',
    '0 14px 36px rgba(30,58,138,0.16)',
    '0 16px 40px rgba(30,58,138,0.17)',
    '0 18px 44px rgba(30,58,138,0.18)',
    '0 20px 48px rgba(30,58,138,0.19)',
    '0 22px 52px rgba(30,58,138,0.20)',
    '0 24px 56px rgba(30,58,138,0.21)',
    '0 26px 60px rgba(30,58,138,0.22)',
    '0 28px 64px rgba(30,58,138,0.23)',
    '0 30px 68px rgba(30,58,138,0.24)',
    '0 32px 72px rgba(30,58,138,0.25)',
    '0 34px 76px rgba(30,58,138,0.26)',
    '0 36px 80px rgba(30,58,138,0.27)',
    '0 38px 84px rgba(30,58,138,0.28)',
    '0 40px 88px rgba(30,58,138,0.29)',
    '0 42px 92px rgba(30,58,138,0.30)',
    '0 44px 96px rgba(30,58,138,0.31)',
    '0 46px 100px rgba(30,58,138,0.32)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: BG,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          scrollbarWidth: 'thin',
          scrollbarColor: `${S}55 transparent`,
          '&::-webkit-scrollbar':       { width: 5 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: `${S}66`, borderRadius: 4 },
        },
        // Page-level fade-in on route change
        '#root': { animation: 'fadeIn 0.25s ease' },
        '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
      },
    },

    // ── AppBar ──────────────────────────────────────────────────────────────
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(90deg, ${P} 0%, #2563EB 100%)`,
          boxShadow: `0 2px 16px rgba(30,58,138,0.30)`,
          backdropFilter: 'blur(8px)',
        },
      },
    },

    // ── Drawer / Sidebar ────────────────────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '3px 0 16px rgba(30,58,138,0.09)',
          background: '#ffffff',
        },
      },
    },

    // ── Sidebar nav items ───────────────────────────────────────────────────
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 10px',
          width: 'calc(100% - 20px)',
          transition: 'background 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease',
          '&.Mui-selected': {
            background: `linear-gradient(90deg, ${P}18 0%, ${S}14 100%)`,
            boxShadow: `inset 3px 0 0 ${P}`,
            '& .MuiListItemIcon-root': { color: P },
            '& .MuiListItemText-primary': { color: P, fontWeight: 700 },
            '&:hover': { background: `linear-gradient(90deg, ${P}22 0%, ${S}18 100%)` },
          },
          '&:hover': {
            background: `${P}09`,
            transform: 'translateX(2px)',
          },
        },
      },
    },

    // ── Buttons ─────────────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 9,
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: '0.02em',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          '&:hover': { transform: 'translateY(-1px)' },
          '&:active': { transform: 'translateY(0)' },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${P} 0%, #2563EB 100%)`,
          boxShadow: `0 3px 10px ${P}44`,
          '&:hover': { boxShadow: `0 6px 18px ${P}55` },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${S} 0%, #0EA5E9 100%)`,
          boxShadow: `0 3px 10px ${S}44`,
          '&:hover': { boxShadow: `0 6px 18px ${S}55` },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px', background: `${P}06` },
        },
        text: {
          '&:hover': { background: `${P}08`, transform: 'none' },
        },
      },
    },

    // ── IconButton ──────────────────────────────────────────────────────────
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'background 0.18s ease, transform 0.15s ease',
          '&:hover': { background: `${P}0D`, transform: 'scale(1.08)' },
        },
      },
    },

    // ── Cards ───────────────────────────────────────────────────────────────
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(30,58,138,0.07), 0 4px 20px rgba(30,58,138,0.05)',
          transition: 'box-shadow 0.22s ease, transform 0.22s ease',
          border: '1px solid rgba(30,58,138,0.06)',
          '&:hover': {
            boxShadow: '0 8px 28px rgba(30,58,138,0.14), 0 4px 12px rgba(30,58,138,0.08)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: { padding: '20px 24px', '&:last-child': { paddingBottom: 20 } },
      },
    },

    // ── Paper ───────────────────────────────────────────────────────────────
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation1: { boxShadow: '0 1px 4px rgba(30,58,138,0.07), 0 4px 16px rgba(30,58,138,0.05)' },
        elevation2: { boxShadow: '0 2px 8px rgba(30,58,138,0.09), 0 6px 20px rgba(30,58,138,0.06)' },
        elevation3: { boxShadow: '0 4px 14px rgba(30,58,138,0.11), 0 8px 28px rgba(30,58,138,0.07)' },
      },
    },

    // ── Tables ──────────────────────────────────────────────────────────────
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: BG,
            color: P,
            fontWeight: 700,
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            borderBottom: `2px solid ${P}1A`,
            padding: '10px 16px',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background 0.15s ease',
          '&:hover': { backgroundColor: `${P}05` },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: `${P}0D`, padding: '10px 16px' },
      },
    },

    // ── Forms ───────────────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 9,
            transition: 'box-shadow 0.18s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: P },
            '&.Mui-focused': { boxShadow: `0 0 0 3px ${P}1A` },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: P, borderWidth: '1.5px' },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: { borderRadius: 9 },
      },
    },

    // ── Chips ───────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 7, fontWeight: 600, fontSize: '0.75rem' },
      },
    },

    // ── Dialogs ─────────────────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(30,58,138,0.20)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '1.05rem',
          color: TX,
          borderBottom: `1px solid ${P}12`,
          paddingBottom: 12,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { padding: '12px 20px', borderTop: `1px solid ${P}0D` },
      },
    },

    // ── Accordion ───────────────────────────────────────────────────────────
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: '12px !important',
          border: `1px solid ${P}0D`,
          boxShadow: '0 1px 4px rgba(30,58,138,0.06)',
          transition: 'box-shadow 0.2s ease',
          '&:before': { display: 'none' },
          '&.Mui-expanded': { boxShadow: '0 4px 16px rgba(30,58,138,0.12)' },
        },
      },
    },

    // ── Tooltip ─────────────────────────────────────────────────────────────
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: TX,
          fontSize: '0.72rem',
          borderRadius: 6,
          padding: '5px 10px',
        },
        arrow: { color: TX },
      },
    },

    // ── Snackbar ────────────────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, fontWeight: 500 },
      },
    },

    // ── LinearProgress ──────────────────────────────────────────────────────
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 6, backgroundColor: `${P}14` },
        bar:  { borderRadius: 6 },
      },
    },

    // ── Divider ─────────────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: `${P}10` },
      },
    },
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
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="plans" element={<PlansPage />} />
                <Route path="competencies" element={<CompetenciesPage />} />
                <Route path="training" element={<TrainingPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </SnackProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
