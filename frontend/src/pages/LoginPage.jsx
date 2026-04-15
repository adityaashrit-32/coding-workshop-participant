import {
  Box, Button, Container, Paper, TextField, Typography, Alert, Tabs, Tab
} from '@mui/material'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [tab, setTab] = useState(0)
  const [form, setForm] = useState({ email: '', password: '', role: 'employee' })
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setSuccess('')
    setLoading(true)
    try {
      if (tab === 0) {
        await signIn(form.email, form.password)
        navigate('/dashboard', { replace: true })
      } else {
        await signUp(form.email, form.password, form.role)
        setSuccess('Account created successfully! Redirecting…')
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
      }
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#E3F2FD',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} textAlign="center" mb={2}>
          EPDM Platform
        </Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 3 }}>
          <Tab label="Sign In" />
          <Tab label="Register" />
        </Tabs>
        {err     && <Alert severity="error"   sx={{ mb: 2 }}>{err}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={submit} display="flex" flexDirection="column" gap={2}>
          <TextField label="Email" type="email" value={form.email} onChange={set('email')} required fullWidth />
          <TextField label="Password" type="password" value={form.password} onChange={set('password')} required fullWidth />
          {tab === 1 && (
            <TextField label="Role" select value={form.role} onChange={set('role')} fullWidth
              SelectProps={{ native: true }}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
            </TextField>
          )}
          <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
            {loading ? 'Please wait…' : tab === 0 ? 'Sign In' : 'Register'}
          </Button>
        </Box>
      </Paper>
    </Container>
    </Box>
  )
}
