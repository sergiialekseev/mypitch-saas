import { Box, Container, Stack, Typography } from "@mui/material";

const LegalPrivacyPage = () => {
  return (
    <Box sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="md">
        <Stack spacing={2}>
          <Typography variant="h4">Privacy Policy</Typography>
          <Typography color="text.secondary">
            We collect interview responses, audio, and optional video to generate interview feedback. Data is
            stored securely and accessed only by authorized hiring team members for this role.
          </Typography>
          <Typography color="text.secondary">
            We retain interview data only as long as needed for evaluation and reporting. You can request
            deletion through the hiring team that invited you.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default LegalPrivacyPage;
