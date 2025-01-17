'use client'

import React from 'react'

import { useParams } from 'next/navigation'

import { Card, Divider, Grid } from '@mui/material'

import DetailPage from './DetailPage'
import PageHeader from '@/components/PageHeader'

const TimelineDetail: React.FC = () => {
  const params = useParams()

  const timelineId = Array.isArray(params?.timelineId) ? params.timelineId[0] : params?.timelineId

  if (!timelineId) {
    return <div>Loading...</div>
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <PageHeader
          title='History'
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'History', href: '/history' },
            { label: `Detail History ${timelineId}` }
          ]}
        />
        <Card className='mt-5'>
          <Divider />
          <DetailPage timelineId={timelineId} />
        </Card>
      </Grid>
    </Grid>
  )
}

export default TimelineDetail
