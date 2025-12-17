import { Component, ErrorInfo, ReactNode } from 'react'
import { Alert, AlertTitle, Button, Box, Typography, Paper } from '@mui/material'
import { Error as ErrorIcon, Refresh } from '@mui/icons-material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 3,
          }}
        >
          <Paper sx={{ p: 4, maxWidth: 600 }}>
            <Alert severity="error" icon={<ErrorIcon fontSize="large" />}>
              <AlertTitle>
                <Typography variant="h5">Something went wrong</Typography>
              </AlertTitle>

              <Typography variant="body1" sx={{ mb: 2 }}>
                The application encountered an unexpected error. This has been logged and we'll look
                into it.
              </Typography>

              {this.state.error && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    overflow: 'auto',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Error Details:
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ mt: 1 }}>
                    {this.state.error.toString()}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button variant="contained" startIcon={<Refresh />} onClick={this.handleReset}>
                  Try Again
                </Button>
                <Button variant="outlined" onClick={() => (window.location.href = '/')}>
                  Go to Home
                </Button>
              </Box>
            </Alert>
          </Paper>
        </Box>
      )
    }

    return this.props.children
  }
}
