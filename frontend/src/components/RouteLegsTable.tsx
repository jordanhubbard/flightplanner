import React, { useMemo } from 'react'
import { Box, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'

import type { FlightPlan } from '../types'
import { haversineNm } from '../utils'

type Props = {
  plan: FlightPlan
}

type LegRow = {
  id: number
  leg: number
  from: string
  to: string
  distance_nm: number
  type: string
  vfr_altitude: number
}

const RouteLegsTable: React.FC<Props> = ({ plan }) => {
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const points = useMemo(() => {
    if (!plan.segments || plan.segments.length === 0) {
      return [plan.origin_coords, plan.destination_coords]
    }

    const pts: Array<[number, number]> = [plan.segments[0].start]
    for (const seg of plan.segments) pts.push(seg.end)
    return pts
  }, [plan])

  const rows = useMemo<LegRow[]>(() => {
    const out: LegRow[] = []
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]
      const b = points[i + 1]
      const seg = plan.segments?.[i]

      out.push({
        id: i,
        leg: i + 1,
        from: `${a[0].toFixed(3)}, ${a[1].toFixed(3)}`,
        to: `${b[0].toFixed(3)}, ${b[1].toFixed(3)}`,
        distance_nm: Number(haversineNm(a, b).toFixed(1)),
        type: seg?.type || 'cruise',
        vfr_altitude: seg?.vfr_altitude ?? 0,
      })
    }
    return out
  }, [plan.segments, points])

  const columns = useMemo<GridColDef<LegRow>[]>(() => {
    if (isSmall) {
      return [
        { field: 'leg', headerName: 'Leg', width: 70 },
        { field: 'distance_nm', headerName: 'NM', width: 90 },
        { field: 'vfr_altitude', headerName: 'Alt', width: 90 },
        { field: 'type', headerName: 'Type', width: 100 },
      ]
    }

    return [
      { field: 'leg', headerName: 'Leg', width: 70 },
      { field: 'from', headerName: 'From (lat, lon)', flex: 1, minWidth: 160 },
      { field: 'to', headerName: 'To (lat, lon)', flex: 1, minWidth: 160 },
      { field: 'distance_nm', headerName: 'Distance (nm)', width: 130 },
      { field: 'vfr_altitude', headerName: 'Alt (ft)', width: 110 },
      { field: 'type', headerName: 'Type', width: 110 },
    ]
  }, [isSmall])

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Legs
      </Typography>
      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight
        density="compact"
        disableRowSelectionOnClick
        hideFooter
        sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
      />
    </Box>
  )
}

export default React.memo(RouteLegsTable)
