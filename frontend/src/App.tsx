import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Container, AppBar, Toolbar, Typography, Box } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Navigation from './components/Navigation'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingState } from './components/shared'

// Code splitting with React.lazy for better performance
const FlightPlannerPage = lazy(() => import('./pages/FlightPlannerPage'))
const WeatherPage = lazy(() => import('./pages/WeatherPage'))
const AirportsPage = lazy(() => import('./pages/AirportsPage'))

// Animation variants for page transitions
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

function App() {
  const location = useLocation()
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <ErrorBoundary>
      <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" component="header" role="banner">
          <Toolbar>
            <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
              ✈️ VFR Flight Planner
            </Typography>
          </Toolbar>
        </AppBar>

        <Navigation />

        <Container
          maxWidth="xl"
          sx={{ mt: isSmall ? 2 : 4, mb: isSmall ? 2 : 4, flex: 1 }}
          component="main"
          role="main"
        >
          <Suspense fallback={<LoadingState message="Loading page..." />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Routes location={location}>
                  <Route path="/" element={<FlightPlannerPage />} />
                  <Route path="/weather" element={<WeatherPage />} />
                  <Route path="/airports" element={<AirportsPage />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </Container>
      </Box>
    </ErrorBoundary>
  )
}

export default App
