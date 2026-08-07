import { ReactNode } from 'react';
import { Box, CircularProgress, useTheme } from '@mui/material';
import { ColorUtils } from 'src/utils/ColorUtils';

type Props = {
  value: number;
  content: ReactNode;
  size?: number;
  ringThickness?: number;
};

/**
 * Preview copy of the host app's availability gauge: a determinate ring
 * colored by `ColorUtils.getProgressColor` with arbitrary centered content.
 */
export const CircularProgressWithContent = ({
  value,
  content,
  size = 64,
  ringThickness = 4,
}: Props) => {
  const theme = useTheme();
  const color = ColorUtils.getProgressColor(theme, value);

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
      <CircularProgress
        variant='determinate'
        value={100}
        size={size}
        thickness={ringThickness}
        sx={{ color: theme.palette.divider, position: 'absolute', left: 0 }}
      />
      <CircularProgress
        variant='determinate'
        value={value}
        size={size}
        thickness={ringThickness}
        sx={{ color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {content}
      </Box>
    </Box>
  );
};
