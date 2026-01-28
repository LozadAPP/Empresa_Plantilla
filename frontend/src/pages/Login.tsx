import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  keyframes,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

// Keyframe animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(2deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login({ email, password });
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/dashboard');
    }
  };

  // Premium color palette
  const colors = {
    background: '#0a0a0f',
    cardBg: 'rgba(18, 18, 28, 0.95)',
    accent: '#c9a227', // Golden amber
    accentLight: '#e6c453',
    accentDark: '#a68520',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    border: 'rgba(201, 162, 39, 0.2)',
    inputBg: 'rgba(255, 255, 255, 0.03)',
    inputBorder: 'rgba(255, 255, 255, 0.1)',
    error: '#ff6b6b',
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: colors.background,
        fontFamily: '"Outfit", "Sora", system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Import Google Fonts */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Sora:wght@400;500;600;700&display=swap');
        `}
      </style>

      {/* Left Panel - Branded Visual */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          background: `linear-gradient(135deg, ${colors.background} 0%, #12121c 50%, #0d0d14 100%)`,
          overflow: 'hidden',
        }}
      >
        {/* Animated background elements */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
          }}
        >
          {/* Grid pattern */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(201, 162, 39, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(201, 162, 39, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
              animation: `${fadeIn} 2s ease-out`,
            }}
          />

          {/* Diagonal accent lines */}
          {[...Array(5)].map((_, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                width: '1px',
                height: '200%',
                background: `linear-gradient(180deg, transparent 0%, ${colors.accent}20 50%, transparent 100%)`,
                left: `${20 + i * 15}%`,
                top: '-50%',
                transform: 'rotate(15deg)',
                animation: `${pulse} ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}

          {/* Glowing orbs */}
          <Box
            sx={{
              position: 'absolute',
              top: '10%',
              right: '20%',
              width: '400px',
              height: '400px',
              background: `radial-gradient(circle, ${colors.accent}15 0%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(30px)',  // OPTIMIZADO: reducido de 80px
              animation: `${float} 8s ease-in-out infinite`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '20%',
              left: '10%',
              width: '300px',
              height: '300px',
              background: `radial-gradient(circle, ${colors.accent}10 0%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(30px)',  // OPTIMIZADO: reducido de 60px
              animation: `${float} 10s ease-in-out infinite reverse`,
            }}
          />
        </Box>

        {/* Main content - Logo & Branding */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
            px: 6,
            animation: `${slideInLeft} 1s ease-out`,
          }}
        >
          {/* Logo Mark */}
          <Box
            sx={{
              position: 'relative',
              display: 'inline-block',
              mb: 4,
            }}
          >
            {/* Outer ring */}
            <Box
              sx={{
                width: 140,
                height: 140,
                border: `2px solid ${colors.accent}`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 8,
                  border: `1px solid ${colors.accent}40`,
                  borderRadius: '50%',
                },
              }}
            >
              {/* Car silhouette using CSS */}
              <Box
                sx={{
                  position: 'relative',
                  width: 70,
                  height: 35,
                }}
              >
                {/* Car body */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 0,
                    right: 0,
                    height: 16,
                    background: colors.accent,
                    borderRadius: '4px 4px 2px 2px',
                  }}
                />
                {/* Car roof */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 20,
                    left: '15%',
                    right: '15%',
                    height: 14,
                    background: colors.accent,
                    borderRadius: '8px 8px 0 0',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      right: 4,
                      bottom: 0,
                      background: colors.background,
                      borderRadius: '4px 4px 0 0',
                    },
                  }}
                />
                {/* Wheels */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    left: 8,
                    width: 12,
                    height: 12,
                    background: colors.accent,
                    borderRadius: '50%',
                    border: `2px solid ${colors.background}`,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    right: 8,
                    width: 12,
                    height: 12,
                    background: colors.accent,
                    borderRadius: '50%',
                    border: `2px solid ${colors.background}`,
                  }}
                />
              </Box>
            </Box>

            {/* Decorative elements */}
            <Box
              sx={{
                position: 'absolute',
                top: -10,
                left: -10,
                width: 20,
                height: 20,
                borderTop: `2px solid ${colors.accent}`,
                borderLeft: `2px solid ${colors.accent}`,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -10,
                right: -10,
                width: 20,
                height: 20,
                borderBottom: `2px solid ${colors.accent}`,
                borderRight: `2px solid ${colors.accent}`,
              }}
            />
          </Box>

          {/* Brand name */}
          <Typography
            sx={{
              fontFamily: '"Sora", sans-serif',
              fontSize: '3.5rem',
              fontWeight: 700,
              letterSpacing: '0.3em',
              color: colors.textPrimary,
              mb: 1,
              textShadow: `0 0 40px ${colors.accent}40`,
            }}
          >
            MOVICAR
          </Typography>

          {/* Tagline with animated underline */}
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Typography
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontSize: '0.9rem',
                fontWeight: 400,
                letterSpacing: '0.25em',
                color: colors.textSecondary,
                textTransform: 'uppercase',
              }}
            >
              Premium Vehicle Rental
            </Typography>
            <Box
              sx={{
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 60,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
              }}
            />
          </Box>

          {/* Features list */}
          <Box
            sx={{
              mt: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {['Gestión Inteligente', 'Control Total', 'Resultados Reales'].map((feature, index) => (
              <Box
                key={feature}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  animation: `${fadeInUp} 0.6s ease-out forwards`,
                  animationDelay: `${0.8 + index * 0.15}s`,
                  opacity: 0,
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    background: colors.accent,
                    transform: 'rotate(45deg)',
                  }}
                />
                <Typography
                  sx={{
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '0.95rem',
                    fontWeight: 300,
                    color: colors.textMuted,
                    letterSpacing: '0.1em',
                  }}
                >
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Bottom decorative line */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ width: 40, height: 1, background: colors.accent }} />
          <Typography
            sx={{
              fontFamily: '"Outfit", sans-serif',
              fontSize: '0.7rem',
              letterSpacing: '0.3em',
              color: colors.textMuted,
              textTransform: 'uppercase',
            }}
          >
            Est. 2026
          </Typography>
          <Box sx={{ width: 40, height: 1, background: colors.accent }} />
        </Box>
      </Box>

      {/* Right Panel - Login Form */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 520px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: { xs: 3, sm: 6 },
          py: 4,
          position: 'relative',
          background: colors.cardBg,
          borderLeft: { md: `1px solid ${colors.border}` },
        }}
      >
        {/* Subtle corner accents */}
        <Box
          sx={{
            position: 'absolute',
            top: 30,
            left: 30,
            width: 40,
            height: 40,
            borderTop: `1px solid ${colors.accent}40`,
            borderLeft: `1px solid ${colors.accent}40`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 30,
            right: 30,
            width: 40,
            height: 40,
            borderBottom: `1px solid ${colors.accent}40`,
            borderRight: `1px solid ${colors.accent}40`,
          }}
        />

        <Box
          sx={{
            width: '100%',
            maxWidth: 380,
            animation: `${fadeInUp} 0.8s ease-out`,
          }}
        >
          {/* Mobile logo */}
          <Box
            sx={{
              display: { xs: 'block', md: 'none' },
              textAlign: 'center',
              mb: 5,
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Sora", sans-serif',
                fontSize: '2rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: colors.accent,
              }}
            >
              MOVICAR
            </Typography>
          </Box>

          {/* Welcome text */}
          <Box sx={{ mb: 5 }}>
            <Typography
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontSize: '0.8rem',
                fontWeight: 500,
                letterSpacing: '0.2em',
                color: colors.accent,
                textTransform: 'uppercase',
                mb: 1,
              }}
            >
              Bienvenido
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Sora", sans-serif',
                fontSize: '2rem',
                fontWeight: 600,
                color: colors.textPrimary,
                lineHeight: 1.2,
              }}
            >
              Inicia sesión en
              <br />
              tu cuenta
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              onClose={clearError}
              sx={{
                mb: 3,
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '12px',
                fontFamily: '"Outfit", sans-serif',
                '& .MuiAlert-icon': {
                  color: colors.error,
                },
                '& .MuiAlert-message': {
                  color: colors.textPrimary,
                },
              }}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <Box sx={{ mb: 3 }}>
              <Typography
                component="label"
                sx={{
                  display: 'block',
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.15em',
                  color: isFocused === 'email' ? colors.accent : colors.textMuted,
                  textTransform: 'uppercase',
                  mb: 1,
                  transition: 'color 0.3s ease',
                }}
              >
                Correo electrónico
              </Typography>
              <TextField
                fullWidth
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused('email')}
                onBlur={() => setIsFocused(null)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon
                        sx={{
                          color: isFocused === 'email' ? colors.accent : colors.textMuted,
                          fontSize: 20,
                          transition: 'color 0.3s ease',
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '0.95rem',
                    backgroundColor: colors.inputBg,
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    '& fieldset': {
                      borderColor: colors.inputBorder,
                      borderWidth: 1,
                      transition: 'all 0.3s ease',
                    },
                    '&:hover fieldset': {
                      borderColor: `${colors.accent}50`,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.accent,
                      borderWidth: 1,
                      boxShadow: `0 0 20px ${colors.accent}20`,
                    },
                    '& input': {
                      color: colors.textPrimary,
                      py: 1.75,
                      '&::placeholder': {
                        color: colors.textMuted,
                        opacity: 1,
                      },
                    },
                  },
                }}
              />
            </Box>

            {/* Password Field */}
            <Box sx={{ mb: 2 }}>
              <Typography
                component="label"
                sx={{
                  display: 'block',
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.15em',
                  color: isFocused === 'password' ? colors.accent : colors.textMuted,
                  textTransform: 'uppercase',
                  mb: 1,
                  transition: 'color 0.3s ease',
                }}
              >
                Contraseña
              </Typography>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFocused('password')}
                onBlur={() => setIsFocused(null)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon
                        sx={{
                          color: isFocused === 'password' ? colors.accent : colors.textMuted,
                          fontSize: 20,
                          transition: 'color 0.3s ease',
                        }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{
                          color: colors.textMuted,
                          '&:hover': {
                            color: colors.accent,
                            backgroundColor: `${colors.accent}10`,
                          },
                        }}
                      >
                        {showPassword ? (
                          <VisibilityOff sx={{ fontSize: 20 }} />
                        ) : (
                          <Visibility sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '0.95rem',
                    backgroundColor: colors.inputBg,
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    '& fieldset': {
                      borderColor: colors.inputBorder,
                      borderWidth: 1,
                      transition: 'all 0.3s ease',
                    },
                    '&:hover fieldset': {
                      borderColor: `${colors.accent}50`,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.accent,
                      borderWidth: 1,
                      boxShadow: `0 0 20px ${colors.accent}20`,
                    },
                    '& input': {
                      color: colors.textPrimary,
                      py: 1.75,
                      '&::placeholder': {
                        color: colors.textMuted,
                        opacity: 1,
                      },
                    },
                  },
                }}
              />
            </Box>

            {/* Forgot Password Link */}
            <Box sx={{ textAlign: 'right', mb: 4 }}>
              <Link
                to="/forgot-password"
                style={{
                  fontFamily: '"Outfit", sans-serif',
                  color: colors.textMuted,
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 400,
                  transition: 'color 0.3s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = colors.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                fontFamily: '"Outfit", sans-serif',
                py: 1.75,
                fontSize: '0.9rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentDark} 100%)`,
                color: colors.background,
                borderRadius: '12px',
                border: 'none',
                boxShadow: `0 4px 20px ${colors.accent}40`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(90deg, transparent, ${colors.accentLight}40, transparent)`,
                  backgroundSize: '200% 100%',
                  animation: `${shimmer} 3s infinite`,
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover': {
                  background: `linear-gradient(135deg, ${colors.accentLight} 0%, ${colors.accent} 100%)`,
                  boxShadow: `0 8px 30px ${colors.accent}50`,
                  transform: 'translateY(-2px)',
                  '&::before': {
                    opacity: 1,
                  },
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&:disabled': {
                  background: `${colors.accent}50`,
                  color: colors.background,
                },
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: colors.background }} />
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          {/* Divider */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              my: 4,
            }}
          >
            <Box sx={{ flex: 1, height: 1, background: colors.inputBorder }} />
            <Typography
              sx={{
                px: 2,
                fontFamily: '"Outfit", sans-serif',
                fontSize: '0.75rem',
                color: colors.textMuted,
                letterSpacing: '0.1em',
              }}
            >
              Sistema de Gestión
            </Typography>
            <Box sx={{ flex: 1, height: 1, background: colors.inputBorder }} />
          </Box>

          {/* Demo credentials hint */}
          <Box
            sx={{
              p: 2.5,
              background: 'rgba(201, 162, 39, 0.05)',
              border: `1px solid ${colors.accent}20`,
              borderRadius: '12px',
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: colors.accent,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                mb: 1,
              }}
            >
              Credenciales de prueba
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontSize: '0.85rem',
                color: colors.textSecondary,
                lineHeight: 1.8,
                '& strong': {
                  color: colors.textPrimary,
                  fontWeight: 500,
                },
              }}
            >
              <strong>Admin:</strong> admin@movicar.com / Admin123!
              <br />
              <strong>Usuario:</strong> user@movicar.com / User123!
            </Typography>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 30,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Outfit", sans-serif',
              fontSize: '0.7rem',
              color: colors.textMuted,
              letterSpacing: '0.1em',
            }}
          >
            © 2026 MOVICAR. Todos los derechos reservados.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
