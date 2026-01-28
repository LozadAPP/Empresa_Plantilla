import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  CircularProgress,
  alpha,
  useTheme as useMuiTheme
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  DirectionsCar as CarIcon
} from '@mui/icons-material';
import { authService } from '../services/authService';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await authService.forgotPassword(email);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar el correo de recuperación');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDarkMode
            ? '#13131f'
            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            maxWidth: 460,
            width: '100%',
            p: 3,
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              backgroundColor: isDarkMode ? '#1c1c2e' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: '24px',
              p: 5,
              backdropFilter: 'blur(20px)',
              boxShadow: isDarkMode
                ? '0 20px 60px rgba(0, 0, 0, 0.4)'
                : '0 20px 60px rgba(0, 0, 0, 0.08)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 72,
                  height: 72,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  mb: 3,
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                }}
              >
                <EmailIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ mb: 2, color: 'text.primary' }}
              >
                Correo Enviado
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Revisa tu bandeja de entrada (y spam).
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderColor: '#8b5cf6',
                color: '#8b5cf6',
                '&:hover': {
                  borderColor: '#7c3aed',
                  backgroundColor: alpha('#8b5cf6', 0.1),
                },
              }}
            >
              Volver al Login
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkMode
          ? '#13131f'
          : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorations */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(30px)',  // OPTIMIZADO: reducido de 60px
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '400px',
          height: '400px',
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(30px)',  // OPTIMIZADO: reducido de 60px
        }}
      />

      {/* Forgot Password Card */}
      <Box
        sx={{
          maxWidth: 460,
          width: '100%',
          p: 3,
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            backgroundColor: isDarkMode ? '#1c1c2e' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            borderRadius: '24px',
            p: 5,
            backdropFilter: 'blur(20px)',
            boxShadow: isDarkMode
              ? '0 20px 60px rgba(0, 0, 0, 0.4)'
              : '0 20px 60px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Logo & Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 72,
                height: 72,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                mb: 2,
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
              }}
            >
              <CarIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ mb: 2, color: 'text.primary' }}
            >
              Recuperar Contraseña
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{
                mb: 3,
                backgroundColor: alpha('#ef4444', 0.1),
                border: '1px solid',
                borderColor: alpha('#ef4444', 0.3),
                borderRadius: '12px',
                '& .MuiAlert-icon': {
                  color: '#ef4444',
                },
              }}
            >
              {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Correo Electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: isDarkMode ? 'transparent' : '#f9fafb',
                  '&:hover': {
                    '& fieldset': {
                      borderColor: alpha('#8b5cf6', 0.5),
                    },
                  },
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mb: 2,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                boxShadow: '0 8px 20px rgba(139, 92, 246, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  boxShadow: '0 12px 28px rgba(139, 92, 246, 0.45)',
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Enviar Enlace de Recuperación'
              )}
            </Button>

            <Button
              fullWidth
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/login')}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: alpha('#8b5cf6', 0.1),
                },
              }}
            >
              Volver al Login
            </Button>
          </form>
        </Box>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
