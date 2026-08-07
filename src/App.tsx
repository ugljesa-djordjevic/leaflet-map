import {
  AppBar,
  Box,
  Chip,
  IconButton,
  Paper,
  Toolbar,
  Typography,
  useColorScheme,
} from '@mui/material';
import { DarkModeOutlined, LightModeOutlined, MonitorHeartOutlined } from '@mui/icons-material';
import { LocationMap } from 'src/components/LocationMap';
import { LocationSwitcher } from 'src/components/LocationSwitcher';

/** Small stat card in the dashboard's shared widget style. */
const StatCard = ({
  title,
  value,
  chip,
  chipColor,
}: {
  title: string;
  value: string;
  chip: string;
  chipColor: 'success' | 'error' | 'warning';
}) => (
  <Paper variant='outlined' sx={{ p: '16px', borderRadius: '8px', flex: 1 }}>
    <Typography variant='overline'>{title}</Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', mt: '4px' }}>
      <Typography variant='display1'>{value}</Typography>
      <Chip size='small' color={chipColor} variant='outlined' label={chip} />
    </Box>
  </Paper>
);

export const App = () => {
  const { mode, setMode } = useColorScheme();

  return (
    <Box
      sx={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <AppBar position='static' elevation={0} color='transparent' sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2 }}>
          <MonitorHeartOutlined color='primary' />
          <Box sx={{ flex: 1 }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              Store Health Dashboard
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Unified Observability — preview build (mock data)
            </Typography>
          </Box>
          <LocationSwitcher />
          <IconButton
            aria-label='toggle color scheme'
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          >
            {mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        <Box sx={{ display: 'flex', gap: '16px' }}>
          <StatCard title='DEVICE AVAILABILITY' value='84%' chip='+2.1% vs last week' chipColor='success' />
          <StatCard title='OPEN INCIDENTS' value='27' chip='4 critical' chipColor='error' />
          <StatCard title='DEVICES REPORTING' value='12,481' chip='98.6% of fleet' chipColor='success' />
        </Box>

        <Box sx={{ height: '680px' }}>
          <LocationMap />
        </Box>
      </Box>
    </Box>
  );
};
