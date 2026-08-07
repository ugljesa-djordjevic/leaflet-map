import { Box, Typography, useTheme } from '@mui/material';
import { LEGEND_TICKS } from './availability';
import { Z_INDEX } from './mapConstants';

/** Bottom-left legend showing the availability colour scale (0–100%). */
export const LocationMapLegend = () => {
  const theme = useTheme();
  const legendGradient = `linear-gradient(to right, ${theme.palette.error.main}, ${theme.palette.warning.light} 50%, ${theme.palette.success.main})`;
  return (
    <Box sx={{ position: 'absolute', bottom: 25, left: 25, zIndex: Z_INDEX.mapOverlay }}>
      <Box
        sx={{ height: '12px', width: '200px', borderRadius: '20px', background: legendGradient }}
      />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'text.secondary',
          marginTop: '0.25rem',
        }}
      >
        {LEGEND_TICKS.map((tick) => (
          <Typography key={tick} fontSize='small'>
            {tick}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};
