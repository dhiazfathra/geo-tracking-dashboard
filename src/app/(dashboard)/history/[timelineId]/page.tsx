'use client'

import React from 'react'

import { useParams } from 'next/navigation'

import DetailPage from './DetailPage'

const TimelineDetail: React.FC = () => {
  const params = useParams()

  const timelineId = Array.isArray(params?.timelineId) ? params.timelineId[0] : params?.timelineId

  if (!timelineId) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Timeline Details</h1>
      <DetailPage timelineId={timelineId} />
    </div>
  )
}

export default TimelineDetail
