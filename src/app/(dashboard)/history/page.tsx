'use client'

import { Card, Divider, Grid } from '@mui/material'

import TimelineTable from './TimelineTable'
import PageHeader from '@/components/PageHeader'

export default function Page() {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <PageHeader title='History' breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'History' }]} />
        <Card className='mt-5'>
          <Divider />
          <TimelineTable />
        </Card>
      </Grid>
    </Grid>
  )
}
