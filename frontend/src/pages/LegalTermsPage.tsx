import { Box, Container, Stack, Typography } from "@mui/material";

const LegalTermsPage = () => {
  return (
    <Box sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="md">
        <Stack spacing={2}>
          <Typography variant="h4">Terms of Service</Typography>
          <Typography color="text.secondary">
            These Terms govern your use of MyPitch interview sessions. By continuing, you agree to the
            collection and processing of interview responses, audio, and optional video for the purpose of
            generating feedback and reports.
          </Typography>
          <Typography color="text.secondary">
            Interview data is stored securely and shared only with the hiring team for the role you were
            invited to. Do not share sensitive personal or confidential information unrelated to the role.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default LegalTermsPage;
