import { createTheme } from '@mui/material/styles';

/**
 * Preview theme mimicking the host dashboard's design language: MUI with
 * light/dark color schemes (`useColorScheme` drives the basemap style too),
 * the error→warning→success availability ramp the widget interpolates over,
 * and the custom `subtle` chip tokens + `category4` palette + `display1`
 * variant the widget consumes.
 */
export const theme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        background: { default: '#f4f6f8', paper: '#ffffff' },
        divider: 'rgba(15, 23, 42, 0.12)',
        error: {
          main: '#DD1708',
          subtle: 'rgba(221, 23, 8, 0.12)',
          subtleContrast: '#9d1206',
        },
        warning: {
          main: '#ED6C02',
          light: '#F99934',
          subtle: 'rgba(249, 153, 52, 0.16)',
          subtleContrast: '#8a4a00',
        },
        info: {
          main: '#0288d1',
          subtle: 'rgba(2, 136, 209, 0.12)',
          subtleContrast: '#01579b',
        },
        success: { main: '#24802D' },
        category4: {
          main: '#b58a00',
          subtle: 'rgba(181, 138, 0, 0.16)',
          subtleContrast: '#7a5d00',
        },
        text: { primary: '#1a2027', secondary: '#5b6470' },
      },
    },
    dark: {
      palette: {
        background: { default: '#0b0d10', paper: '#14171c' },
        divider: 'rgba(148, 163, 184, 0.16)',
        error: {
          main: '#DD1708',
          subtle: 'rgba(221, 23, 8, 0.22)',
          subtleContrast: '#ff8a80',
        },
        warning: {
          main: '#ED6C02',
          light: '#F99934',
          subtle: 'rgba(249, 153, 52, 0.2)',
          subtleContrast: '#ffc477',
        },
        info: {
          main: '#4fc3f7',
          subtle: 'rgba(79, 195, 247, 0.18)',
          subtleContrast: '#a6e2ff',
        },
        success: { main: '#24802D' },
        category4: {
          main: '#d4a72c',
          subtle: 'rgba(212, 167, 44, 0.2)',
          subtleContrast: '#ffd97a',
        },
        text: { primary: '#e7ebf0', secondary: '#9aa4b1' },
      },
    },
  },
  typography: {
    fontFamily: 'Roboto, "Segoe UI", Helvetica, Arial, sans-serif',
    display1: { fontSize: '34px', fontWeight: 600, lineHeight: 1.2 },
    overline: { fontWeight: 600, letterSpacing: '0.8px' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});
