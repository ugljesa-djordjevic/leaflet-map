import { Box, Typography } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';

/** Preview copies of the host app's shared presentational components. */

export const HeaderTitle = ({ title, subTitle }: { title: string; subTitle?: string }) => (
  <Box sx={{ pt: '6px', pb: '2px' }}>
    <Typography variant='overline' sx={{ display: 'block', lineHeight: 1.6 }}>
      {title}
    </Typography>
    {subTitle && (
      <Typography
        variant='overline'
        sx={{ display: 'block', lineHeight: 1.4, color: 'text.secondary', fontSize: '11px' }}
      >
        {subTitle}
      </Typography>
    )}
  </Box>
);

export const NoData = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 1,
      color: 'text.secondary',
      p: 3,
    }}
  >
    <InboxOutlined fontSize='large' />
    <Typography variant='body2'>No data available</Typography>
  </Box>
);
