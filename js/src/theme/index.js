import { createTheme, alpha } from '@mui/material/styles';

/**
 * ============================================================================
 * DESIGN TOKENS — single source of truth for all colors.
 *
 * Add new colors here, never inline in components. Components should reference
 * the palette via semantic names (e.g. `primary.main`, `grey.100`, `divider`)
 * so the whole app can be re-themed by editing this file alone.
 *
 * Usage in components:
 *   sx={{ color: 'primary.main' }}                  // brand coral
 *   sx={{ bgcolor: 'background.paper' }}            // card surface
 *   sx={{ borderColor: 'divider' }}                 // hairline borders
 *   sx={{ color: 'text.secondary' }}                // de-emphasized text
 *   sx={{ bgcolor: 'grey.100' }}                    // neutral fill
 *   sx={{ color: 'error.main' }}                    // destructive / red
 *   sx={{ color: 'success.main' }}                  // confirmations / green
 *
 * For custom tokens (gradients, brand alphas), use a theme callback:
 *   sx={{ background: (t) => t.palette.custom.gradientPrimary }}
 *   sx={{ bgcolor: (t) => t.palette.custom.primarySoft }}
 *
 * To add a dark theme later: extract `buildPalette(mode)` and branch on mode.
 * ============================================================================
 */

// --- Brand ------------------------------------------------------------------
const CORAL = {
  main: '#FF6B6B',
  light: '#FF8E8E',
  dark: '#FF4848',
  contrastText: '#FFFFFF',
};

const TEAL = {
  main: '#4ECDC4',
  light: '#71D7D0',
  dark: '#2BC4B8',
  contrastText: '#FFFFFF',
};

// --- Intent (status) --------------------------------------------------------
const ERROR = {
  main: '#E53935',
  light: '#EF5350',
  dark: '#C62828',
  contrastText: '#FFFFFF',
};

const WARNING = {
  main: '#F9A825',
  light: '#FFCA28',
  dark: '#F57F17',
  contrastText: '#FFFFFF',
};

const SUCCESS = {
  main: '#25D366', // WhatsApp green — used for positive confirmations
  light: '#4CE38A',
  dark: '#128C7E',
  contrastText: '#FFFFFF',
};

const INFO = {
  main: '#1976D2',
  light: '#42A5F5',
  dark: '#1565C0',
  contrastText: '#FFFFFF',
};

// --- Neutrals (grey scale) --------------------------------------------------
// Based on greys already in use across the codebase. Reference as `grey.100`,
// `grey.300`, etc. Use `divider` for borders and `text.*` for typography.
const GREY = {
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#EEEEEE',
  300: '#E0E0E0',
  400: '#BDBDBD',
  500: '#9E9E9E',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
};

// --- Text -------------------------------------------------------------------
const TEXT = {
  primary: '#212121',
  secondary: '#616161',
  disabled: '#9E9E9E',
};

// --- Surfaces ---------------------------------------------------------------
const BACKGROUND = {
  default: '#F7F7F7',
  paper: '#FFFFFF',
  subtle: '#FAFAFA', // for subtle fills (e.g. input backgrounds)
};

// --- App-specific custom tokens ---------------------------------------------
// Anything that doesn't fit MUI's standard palette keys goes here.
const CUSTOM = {
  // Brand gradient (already in use)
  gradientPrimary: `linear-gradient(108.73deg, #F9881F 23.73%, #FF774C 79.34%)`,
  // Coral-based gradient used for selected states / CTAs
  gradientCoral: `linear-gradient(45deg, ${CORAL.main} 30%, #FF8E53 90%)`,
  gradientCoralHover: `linear-gradient(45deg, #FF8E53 30%, ${CORAL.main} 90%)`,
  // Soft coral backgrounds (tinted fills like chips, hover states)
  primarySoft: alpha(CORAL.main, 0.08),
  primarySoftHover: alpha(CORAL.main, 0.12),
  primarySoftActive: alpha(CORAL.main, 0.16),
  // Shadows keyed to brand for glows under buttons
  primaryGlow: `0 4px 14px ${alpha(CORAL.main, 0.4)}`,
  primaryGlowHover: `0 6px 20px ${alpha(CORAL.main, 0.5)}`,
  // WhatsApp channel (distinct from success semantics)
  whatsapp: {
    main: '#25D366',
    dark: '#128C7E',
    contrastText: '#FFFFFF',
  },
  // Menu-item hover tint (lavender accent, used in header/profile menus)
  menuHover: 'rgba(145, 127, 179, 0.1)',
};

// ============================================================================

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: CORAL,
    secondary: TEAL,
    error: ERROR,
    warning: WARNING,
    success: SUCCESS,
    info: INFO,
    grey: GREY,
    text: TEXT,
    background: BACKGROUND,
    divider: GREY[300],
    custom: CUSTOM,
  },

  shape: {
    borderRadius: 8,
  },

  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

export default theme;
