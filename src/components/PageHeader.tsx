import React from 'react'

import { Breadcrumbs, Typography, Link, Button, Box } from '@mui/material'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  onSubmit?: () => void
  onCancel?: () => void
  breadcrumbs?: BreadcrumbItem[]
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, onSubmit, onCancel, breadcrumbs }) => {
  return (
    <React.Fragment>
      <Box display='flex' flexDirection='column' gap={2}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Box>
            <Typography variant='h4' fontWeight='bold'>
              {title}
            </Typography>
            {breadcrumbs && (
              <Breadcrumbs aria-label='breadcrumb'>
                {breadcrumbs.map((breadcrumb, index) =>
                  breadcrumb.href ? (
                    <Link key={index} href={breadcrumb.href} underline='hover' color='inherit'>
                      {breadcrumb.label}
                    </Link>
                  ) : (
                    <Typography key={index} color='text.primary'>
                      {breadcrumb.label}
                    </Typography>
                  )
                )}
              </Breadcrumbs>
            )}
          </Box>

          {/* Buttons */}
          <Box display='flex' gap={2}>
            {onCancel && (
              <Button variant='outlined' color='secondary' onClick={onCancel}>
                Cancel
              </Button>
            )}
            {onSubmit && (
              <Button variant='contained' color='primary' onClick={onSubmit}>
                Submit
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </React.Fragment>
  )
}

export default PageHeader
