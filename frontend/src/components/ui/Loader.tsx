import { Box, CircularProgress, Stack, Typography } from "@mui/material";

type LoaderVariant = "page" | "section" | "inline";

type LoaderProps = {
  variant?: LoaderVariant;
  label?: string;
  size?: number;
};

const Loader = ({ variant = "section", label = "Loading...", size }: LoaderProps) => {
  if (variant === "inline") {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CircularProgress size={size ?? 18} />
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
    );
  }

  const padding = variant === "page" ? { xs: 8, md: 12 } : { xs: 4, md: 6 };
  const indicatorSize = size ?? (variant === "page" ? 36 : 28);

  return (
    <Box sx={{ py: padding, display: "flex", justifyContent: "center" }}>
      <Stack spacing={2} alignItems="center">
        <CircularProgress size={indicatorSize} />
        <Typography color="text.secondary">{label}</Typography>
      </Stack>
    </Box>
  );
};

export default Loader;
