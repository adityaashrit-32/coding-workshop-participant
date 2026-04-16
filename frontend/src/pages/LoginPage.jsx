import {
  Box, Button, Container, Divider, Paper,
  TextField, Typography, Alert, Link
} from '@mui/material'
import { Groups } from '@mui/icons-material'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const BLUE  = '#1E3A8A'
const SLATE = '#64748B'
const BG    = '#F8FAFC'

function AppLogo() {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
      <Box sx={{
        width: 52, height: 52, borderRadius: 2, bgcolor: BLUE,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        mb: 1.5, boxShadow: `0 4px 14px ${BLUE}35`,
      }}>
        <Groups sx={{ color: '#fff', fontSize: 28 }} />
      </Box>
      <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: BLUE, letterSpacing: '-0.02em', lineHeight: 1 }}>
        ACME
      </Typography>
      <Typography variant="caption" color={SLATE} mt={0.5} letterSpacing="0.06em" fontSize="0.7rem">
        PEOPLE & PERFORMANCE PLATFORM
      </Typography>
    </Box>
  )
}

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm]     = useState({ email: '', password: '', role: 'employee' })
  const [err, setErr]       = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp }  = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/dashboard'

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggle = () => {
    setIsRegister((v) => !v)
    setErr('')
    setSuccess('')
    setForm({ email: '', password: '', role: 'employee' })
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setSuccess('')
    setLoading(true)
    try {
      if (!isRegister) {
        await signIn(form.email, form.password)
        navigate(from, { replace: true })
      } else {
        await signUp(form.email, form.password, form.role)
        setSuccess('Account created — redirecting…')
        setTimeout(() => navigate('/dashboard', { replace: true }), 1200)
      }
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
      <Container maxWidth="xs">
        <AppLogo />
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#fff' }}>
          <Typography variant="h6" fontWeight={700} color={BLUE} mb={0.5}>
            {isRegister ? 'Create an account' : 'Welcome back'}
          </Typography>
          <Typography variant="body2" color={SLATE} mb={3}>
            {isRegister ? 'Fill in your details to get started.' : 'Sign in to your account to continue.'}
          </Typography>

          {err     && <Alert severity="error"   sx={{ mb: 2, borderRadius: 1.5, fontSize: '0.82rem' }}>{err}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5, fontSize: '0.82rem' }}>{success}</Alert>}

          <Box component="form" onSubmit={submit} display="flex" flexDirection="column" gap={2}>
            <TextField label="Email address" type="email"    value={form.email}    onChange={set('email')}    required fullWidth size="small" />
            <TextField label="Password"      type="password" value={form.password} onChange={set('password')} required fullWidth size="small" />
            {isRegister && (
              <TextField label="Role" select value={form.role} onChange={set('role')} fullWidth size="small" SelectProps={{ native: true }}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr">HR</option>
              </TextField>
            )}
            <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth
              sx={{ mt: 0.5, bgcolor: BLUE, fontWeight: 600, '&:hover': { bgcolor: '#162D6E' } }}>
              {loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 2.5, borderColor: '#E2E8F0' }} />

          <Box display="flex" justifyContent="center" alignItems="center" gap={0.75}>
            <Typography variant="body2" color={SLATE}>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
            </Typography>
            <Link component="button" type="button" variant="body2" onClick={toggle}
              sx={{ color: BLUE, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              {isRegister ? 'Sign In' : 'Register'}
            </Link>
          </Box>
        </Paper>
        <Typography variant="caption" color={SLATE} display="block" textAlign="center" mt={3}>
          © {new Date().getFullYear()} ACME Inc. · All rights reserved
        </Typography>
      </Container>
    </Box>
  )
}
