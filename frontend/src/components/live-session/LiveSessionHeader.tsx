import { Box, Chip, Typography } from "@mui/material";

type LiveSessionHeaderProps = {
  title: string;
  description?: string;
  status: "connecting" | "connected" | "error" | "disconnected" | "reconnecting" | "analyzing";
  statusLabel: string;
};

const LiveSessionHeader = ({ title, description, status, statusLabel }: LiveSessionHeaderProps) => {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Box>
        <Typography variant="h5">{title}</Typography>
        {description ? <Typography color="text.secondary">{description}</Typography> : null}
      </Box>
      <Chip label={statusLabel} color={status === "connected" ? "success" : "default"} />
    </Box>
  );
};

export default LiveSessionHeader;
