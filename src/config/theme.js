import { createTheme as createMuiTheme } from '@mui/material/styles';

export const createTheme = (prefersDarkMode) => {
  return createMuiTheme({
    palette: {
      mode: prefersDarkMode ? 'dark' : 'light',
      primary: {
        main: prefersDarkMode ? '#c7db5c' : '#1f4040', // Use bright green in dark mode
        light: prefersDarkMode ? '#dae87d' : '#4a6b6b',
        dark: prefersDarkMode ? '#a3b348' : '#0a1515',
        contrastText: prefersDarkMode ? '#1f4040' : '#ffffff',
        lighter: prefersDarkMode ? 'rgba(199, 219, 92, 0.1)' : 'rgba(31, 64, 64, 0.1)',
      },
      secondary: {
        main: '#c7db5c',
        light: '#dae87d',
        dark: '#a3b348',
        contrastText: prefersDarkMode ? '#1f4040' : '#ffffff',
      },
      background: {
        default: prefersDarkMode ? '#0b171f' : '#f2f2f2',
        paper: prefersDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        neutral: '#f6f6f4',
        gradient: prefersDarkMode 
          ? 'linear-gradient(0deg, rgba(8,45,50,1) 0%, rgba(11,23,31,1) 39%, rgba(32,23,52,1) 100%)'
          : 'linear-gradient(0deg, rgba(240,231,193,1) 0%, rgba(242,219,224,1) 39%, rgba(195,195,234,1) 100%)',
      },
      error: {
        main: '#dc3545',
      },
      success: {
        main: '#198754',
      },
      info: {
        main: '#586fb5',
        light: prefersDarkMode ? 'rgba(88, 111, 181, 1)' : 'rgba(88, 111, 181, 1)',
        contrastText: '#ffffff',
      },
      text: {
        primary: prefersDarkMode ? '#ffffff' : '#1d2125',
        secondary: prefersDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
      },
      action: {
        disabled: prefersDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
        disabledBackground: prefersDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        hover: prefersDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      },
      divider: prefersDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    },
    shape: {
      borderRadius: 2,
    },
    typography: {
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      h1: {
        fontFamily: 'fields, Georgia, serif',
        color: prefersDarkMode ? '#ffffff' : '#1f4040',
      },
      h2: {
        fontFamily: 'fields, Georgia, serif',
        color: prefersDarkMode ? '#ffffff' : '#1f4040',
      },
      h3: {
        fontFamily: 'fields, Georgia, serif',
        color: prefersDarkMode ? '#ffffff' : '#1f4040',
      },
      h4: {
        fontFamily: 'fields, Georgia, serif',
        color: prefersDarkMode ? '#ffffff' : '#1f4040',
      },
      h5: {
        fontFamily: 'fields, Georgia, serif',
        color: prefersDarkMode ? '#ffffff' : '#1f4040',
      },
      h6: {
        fontFamily: 'fields, Georgia, serif',
        color: prefersDarkMode ? '#ffffff' : '#1f4040',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: prefersDarkMode 
              ? 'linear-gradient(0deg, rgba(8,45,50,1) 0%, rgba(11,23,31,1) 39%, rgba(32,23,52,1) 100%)'
              : 'linear-gradient(0deg, rgba(240,231,193,1) 0%, rgba(242,219,224,1) 39%, rgba(195,195,234,1) 100%)',
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true, // Remove all elevation/shadows
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontWeight: 600,
            transition: 'all 0.3s ease',
            boxShadow: 'none !important', // Ensure no shadow
            '&:hover': {
              boxShadow: 'none !important',
            },
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          containedPrimary: {
            backgroundColor: prefersDarkMode ? '#c7db5c' : '#1f4040',
            color: prefersDarkMode ? '#1f4040' : '#ffffff',
            '&:hover': {
              backgroundColor: prefersDarkMode ? '#dae87d' : '#2a5050',
            },
            '&.Mui-disabled': {
              backgroundColor: prefersDarkMode ? '#424242' : '#e0e0e0',
              color: prefersDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
            },
          },
          containedSecondary: {
            backgroundColor: prefersDarkMode ? '#c7db5c' : '#a0bc35',
            color: prefersDarkMode ? '#1f4040' : '#1f4040',
            '&:hover': {
              backgroundColor: prefersDarkMode ? '#cddf6c' : '#c7db5c',
            },
            '&.Mui-disabled': {
              backgroundColor: prefersDarkMode ? '#424242' : '#e0e0e0',
              color: prefersDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
            },
          },
          outlined: {
            borderWidth: '1px',
            '&:hover': {
              borderWidth: '1px',
              backgroundColor: prefersDarkMode 
                ? 'rgba(199, 219, 92, 0.08)' 
                : 'rgba(31, 64, 64, 0.04)',
            },
            '&.Mui-disabled': {
              borderColor: prefersDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            },
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0, // Remove default elevation
        },
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
            backgroundColor: prefersDarkMode 
              ? 'rgba(30, 30, 30, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              backgroundColor: prefersDarkMode 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(255, 255, 255, 0.8)',
              '& fieldset': {
                borderWidth: '1px',
              },
              '&:hover fieldset': {
                borderWidth: '1px',
              },
              '&.Mui-focused fieldset': {
                borderWidth: '1px',
              },
              '&:hover': {
                backgroundColor: prefersDarkMode 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(255, 255, 255, 0.95)',
              },
              '&.Mui-focused': {
                backgroundColor: prefersDarkMode 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(255, 255, 255, 1)',
              },
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: prefersDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            '&.Mui-selected': {
              color: prefersDarkMode ? '#c7db5c' : '#1f4040',
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: prefersDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            boxShadow: 'none',
          },
        },
      },
    },
  });
};