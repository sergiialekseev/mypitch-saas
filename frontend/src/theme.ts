import { createTheme } from "@mui/material/styles";

const brand = {
  primary: "#0B3B5B",
  secondary: "#E1A845",
  textPrimary: "#0F172A",
  textSecondary: "#4B5A6B",
  bg: "#F7F9FC",
  paper: "#FFFFFF",
  divider: "#E5EAF0",
  focus: "#1F6FEB"
};

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: brand.primary
    },
    secondary: {
      main: brand.secondary
    },
    background: {
      default: brand.bg,
      paper: brand.paper
    },
    text: {
      primary: brand.textPrimary,
      secondary: brand.textSecondary
    },
    divider: brand.divider
  },
  typography: {
    fontFamily: '"Sora", "Segoe UI", sans-serif',
    h1: {
      fontSize: "2.75rem",
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: "-0.02em"
    },
    h2: {
      fontSize: "2.1rem",
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: "-0.01em"
    },
    h3: {
      fontSize: "1.6rem",
      fontWeight: 600,
      lineHeight: 1.3
    },
    h4: {
      fontSize: "1.35rem",
      fontWeight: 600,
      lineHeight: 1.35
    },
    h5: {
      fontSize: "1.1rem",
      fontWeight: 600
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6
    },
    body2: {
      fontSize: "0.95rem",
      lineHeight: 1.6
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
      letterSpacing: "0.01em"
    }
  },
  shape: {
    borderRadius: 14
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: brand.bg,
          color: brand.textPrimary
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 20,
          paddingBlock: 10
        },
        containedPrimary: {
          boxShadow: "0 10px 24px rgba(11, 59, 91, 0.2)"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: `1px solid ${brand.divider}`,
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)"
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        size: "medium"
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12
        },
        notchedOutline: {
          borderColor: brand.divider
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: brand.textSecondary
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: brand.textSecondary,
          backgroundColor: "#F2F5FA"
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: brand.divider
        }
      }
    }
  }
});

export default theme;
