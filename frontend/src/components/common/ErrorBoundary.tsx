import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="md">
          <Box
            sx={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: '24px',
                textAlign: 'center',
                bgcolor: theme => theme.palette.mode === 'dark' ? '#1c1c2e' : '#ffffff',
                border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
              }}
            >
              <ErrorIcon
                sx={{
                  fontSize: 80,
                  color: '#ef4444',
                  mb: 3
                }}
              />

              <Typography
                variant="h4"
                fontWeight={700}
                gutterBottom
                sx={{ color: theme => theme.palette.mode === 'dark' ? '#fff' : '#000' }}
              >
                Algo salió mal
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
              >
                Lo sentimos, ha ocurrido un error inesperado. Por favor, intenta recargar la página o contacta al soporte si el problema persiste.
              </Typography>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                    borderRadius: '12px',
                    border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`,
                    textAlign: 'left',
                    mb: 3
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{ display: 'block', mb: 1, color: '#ef4444' }}
                  >
                    Error Details (Development Only):
                  </Typography>
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                    }}
                  >
                    {this.state.error.toString()}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Intentar de nuevo
                </Button>
                <Button
                  variant="contained"
                  onClick={this.handleReload}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Recargar página
                </Button>
              </Box>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
