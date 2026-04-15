import { Alert, Snackbar } from '@mui/material'
import { useState, useCallback, createContext, useContext } from 'react'

const SnackCtx = createContext(null)

export function SnackProvider({ children }) {
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'info' })

  const notify = useCallback((msg, severity = 'info') => {
    setSnack({ open: true, msg, severity })
  }, [])

  return (
    <SnackCtx.Provider value={notify}>
      {children}
      <Snackbar open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </SnackCtx.Provider>
  )
}

export const useNotify = () => useContext(SnackCtx)
