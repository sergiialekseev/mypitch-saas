import { Avatar, Box, Stack, Typography } from "@mui/material";

type AiPictureInPictureProps = {
  isSpeaking: boolean;
};

const AiPictureInPicture = ({ isSpeaking }: AiPictureInPictureProps) => {
  return (
    <Box
      sx={{
        position: "absolute",
        right: 24,
        bottom: 96,
        width: 220,
        p: 2,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        borderRadius: 1,
        backdropFilter: "blur(8px)"
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Box sx={{ position: "relative" }}>
          {isSpeaking ? (
            <Box
              sx={{
                position: "absolute",
                inset: -10,
                borderRadius: "50%",
                border: "2px solid rgba(225, 168, 69, 0.8)",
                animation: "pulse 1.2s ease-out infinite"
              }}
            />
          ) : null}
          <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main" }}>AI</Avatar>
        </Box>
        <Stack spacing={0.5} alignItems="center">
          <Typography variant="subtitle2" color="white">
            MyPitch AI
          </Typography>
          <Typography variant="caption" color="rgba(248,250,252,0.7)">
            {isSpeaking ? "Speaking" : "Listening"}
          </Typography>
        </Stack>
      </Stack>
      <style>
        {`@keyframes pulse { from { transform: scale(0.9); opacity: 0.8; } to { transform: scale(1.15); opacity: 0; } }`}
      </style>
    </Box>
  );
};

export default AiPictureInPicture;
