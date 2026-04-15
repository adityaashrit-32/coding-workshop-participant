import {
  AppBar, Box, CssBaseline, Divider, Drawer, IconButton,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Menu, MenuItem, Chip, Avatar
} from '@mui/material'
import {
  Menu as MenuIcon, Dashboard, People, Assessment,
  TrendingUp, School, Psychology, Logout, KeyboardArrowDown
} from '@mui/icons-material'
import { useState } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DRAWER_WIDTH = 240

const NAV = [
  { label: 'Dashboard',        path: '/dashboard',    icon: <Dashboard /> },
  { label: 'Employees',        path: '/employees',    icon: <People /> },
  { label: 'Performance',      path: '/reviews',      icon: <Assessment /> },
  { label: 'Development Plans',path: '/plans',        icon: <TrendingUp /> },
  { label: 'Competencies',     path: '/competencies', icon: <Psychology /> },
  { label: 'Training',         path: '/training',     icon: <School /> },
]

const ROLE_COLOR  = { hr: 'error', manager: 'warning', employee: 'info' }
const ROLE_LABEL  = { hr: 'HR', manager: 'Manager', employee: 'Employee' }
const AVATAR_BG   = { hr: '#EF4444', manager: '#F59E0B', employee: '#06B6D4' }

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand header */}
      <Box sx={{
        px: 2.5, py: 2,
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
        minHeight: 64,
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: '10px',
          background: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Assessment sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Typography variant="h6" color="white" fontWeight={800} noWrap letterSpacing="0.01em" fontSize="0.95rem">
          EPDM Platform
        </Typography>
      </Box>

      <Divider />

      {/* Nav section label */}
      <Typography variant="caption" sx={{ px: 2.5, pt: 2, pb: 0.5, color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Navigation
      </Typography>

      <List sx={{ px: 0.5, flexGrow: 1 }}>
        {NAV.map(({ label, path, icon }) => {
          const active = location.pathname.startsWith(path)
          return (
            <ListItem key={path} disablePadding>
              <ListItemButton
                selected={active}
                onClick={() => { navigate(path); setMobileOpen(false) }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: active ? '#1E3A8A' : '#6B7280' }}>
                  {icon}
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 700 : 500, color: active ? '#1E3A8A' : '#374151' }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* Bottom user card */}
      <Box sx={{ p: 1.5, borderTop: '1px solid rgba(30,58,138,0.08)' }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          px: 1.5, py: 1, borderRadius: 2,
          background: 'rgba(30,58,138,0.04)',
        }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700, bgcolor: AVATAR_BG[user?.role] || '#1E3A8A' }}>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ overflow: 'hidden', flexGrow: 1 }}>
            <Typography variant="caption" fontWeight={700} color="#111827" noWrap display="block">
              {user?.email?.split('@')[0] || 'User'}
            </Typography>
            <Typography variant="caption" color="#9CA3AF" noWrap display="block" fontSize="0.68rem">
              {ROLE_LABEL[user?.role] || user?.role}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 1, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>

          {/* Page title */}
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600, fontSize: '1rem' }}>
            Employee Performance & Development
          </Typography>

          {/* Role badge */}
          <Chip
            label={ROLE_LABEL[user?.role] || user?.role}
            color={ROLE_COLOR[user?.role] || 'default'}
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.72rem', height: 24 }}
          />

          {/* User menu */}
          <Box
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer',
              px: 1, py: 0.5, borderRadius: 2,
              transition: 'background 0.15s',
              '&:hover': { background: 'rgba(255,255,255,0.12)' },
            }}
          >
            <Avatar sx={{ width: 30, height: 30, fontSize: '0.78rem', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.22)', color: '#fff' }}>
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Typography variant="body2" color="white" fontWeight={600} sx={{ display: { xs: 'none', sm: 'block' }, fontSize: '0.82rem' }}>
              {user?.email?.split('@')[0] || 'User'}
            </Typography>
            <KeyboardArrowDown sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }} />
          </Box>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
            PaperProps={{ sx: { mt: 1, minWidth: 180, borderRadius: 2, boxShadow: '0 8px 24px rgba(30,58,138,0.18)' } }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(30,58,138,0.08)' }}>
              <Typography variant="body2" fontWeight={700} color="#111827">{user?.email}</Typography>
              <Typography variant="caption" color="#9CA3AF">{ROLE_LABEL[user?.role]}</Typography>
            </Box>
            <MenuItem onClick={() => { signOut(); navigate('/login') }} sx={{ gap: 1.5, py: 1.2, color: '#EF4444', '&:hover': { background: '#FEF2F2' } }}>
              <Logout fontSize="small" /> Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
          open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, mt: 8, minHeight: '100vh' }}
        className="page-enter">
        <Outlet />
      </Box>
    </Box>
  )
}
