import { InputAdornment, TextField } from '@mui/material'
import { Search } from '@mui/icons-material'

/**
 * SearchBar — drop-in search input for any data page.
 * Props:
 *   value    string   — controlled value
 *   onChange fn       — called with the new string on every keystroke
 *   placeholder string
 */
export default function SearchBar({ value, onChange, placeholder = 'Search…' }) {
  return (
    <TextField
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      sx={{ width: { xs: '100%', sm: 260 } }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search sx={{ fontSize: 18, color: '#94A3B8' }} />
          </InputAdornment>
        ),
        sx: {
          bgcolor: '#fff',
          borderRadius: 1.5,
          fontSize: '0.875rem',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
        },
      }}
    />
  )
}
