import { Box, Stack, Typography } from "@mui/material";
import { useLocalVideo } from "./useLocalVideo";

type LocalVideoPaneProps = {
  name: string;
  fill?: boolean;
};

const LocalVideoPane = ({ name: _name, fill = false }: LocalVideoPaneProps) => {
  const { videoRef, error } = useLocalVideo();

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: fill ? "100%" : "auto",
        aspectRatio: fill ? undefined : "16 / 9",
        overflow: "hidden",
        backgroundColor: "rgba(15, 23, 42, 0.9)"
      }}
    >
      <Box
        component="video"
        ref={videoRef}
        autoPlay
        muted
        playsInline
        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {error ? (
        <Typography
          variant="body2"
          color="rgba(248,250,252,0.8)"
          sx={{ position: "absolute", top: 16, left: 16 }}
        >
          {error}
        </Typography>
      ) : null}
    </Box>
  );
};

export default LocalVideoPane;
