import React from 'react'
import { Typography, Box } from '@mui/material'

interface PageHeaderProps {
  icon: React.ReactElement
  title: string
}

const PageHeaderComponent: React.FC<PageHeaderProps> = ({ icon, title }) => {
  return (
    <Typography variant="h4" gutterBottom component="h1">
      <Box component="span" sx={{ mr: 1, verticalAlign: 'middle' }} aria-hidden="true">
        {React.cloneElement(icon, { sx: { verticalAlign: 'middle' }, 'aria-hidden': 'true' })}
      </Box>
      {title}
    </Typography>
  )
}

export const PageHeader = React.memo(PageHeaderComponent)
