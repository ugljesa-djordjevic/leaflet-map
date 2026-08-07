import type * as React from 'react';
import '@mui/material/styles';

/**
 * Host-app theme surface the widget depends on: `category4` palette, the
 * `subtle`/`subtleContrast` tokens used by status chips, and the `display1`
 * typography variant.
 */
declare module '@mui/material/styles' {
  interface PaletteColor {
    subtle?: string;
    subtleContrast?: string;
  }
  interface SimplePaletteColorOptions {
    subtle?: string;
    subtleContrast?: string;
  }
  interface Palette {
    category4: Palette['primary'];
  }
  interface PaletteOptions {
    category4?: PaletteOptions['primary'];
  }
  interface TypographyVariants {
    display1: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    display1?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    display1: true;
  }
}
