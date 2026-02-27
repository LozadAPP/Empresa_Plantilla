import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  alpha,
  useTheme as useMuiTheme
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  DirectionsCar as CarIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { authService } from '../services/authService';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError('Token de recuperación no válido');
      setVerifying(false);
      return;
    }

    // Verify token on mount
    const verifyToken = async () => {
      try {
        const result = await authService.verifyResetToken(token);
        if (!result.success) {
          setTokenError(result.message);
        }
      } catch (err: any) {
        setTokenError('Error al verificar el token');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  // OPTIMIZADO: Redirect con cleanup para evitar memory leak
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (success) {
      timer = setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!token) {
      setError('Token de recuperación no válido');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.resetPassword(token, newPassword);
      if (result.success) {
        setSuccess(true);
        // Redirect handled by useEffect below with proper cleanup
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
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
        }}
      >
        <CircularProgress size={48} sx={{ color: '#8b5cf6' }} />
      </Box>
    );
  }

  if (tokenError) {
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
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ mb: 2, color: 'text.primary' }}
              >
                Token Inválido o Expirado
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {tokenError}
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/forgot-password')}
              sx={{
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
              }}
            >
              Solicitar Nuevo Enlace
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

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
                <CheckCircleIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ mb: 2, color: 'text.primary' }}
              >
                Contraseña Actualizada
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                Tu contraseña ha sido restablecida correctamente.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Redirigiendo al login...
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
              Ir al Login
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

      {/* Reset Password Card */}
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
              Restablecer Contraseña
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresa tu nueva contraseña
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
              label="Nueva Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              required
              autoFocus
              autoComplete="new-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: 'text.secondary' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
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

            <TextField
              fullWidth
              label="Confirmar Contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="new-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{ color: 'text.secondary' }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
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
                'Restablecer Contraseña'
              )}
            </Button>
          </form>
        </Box>
      </Box>
    </Box>
  );
};

export default ResetPassword;
