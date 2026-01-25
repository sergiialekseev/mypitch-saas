import { Box, Button, Card, CardContent, Container, Grid, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const features = [
  {
    title: "Job-ready setup",
    description: "Create roles, add candidates, and ship invite links in minutes."
  },
  {
    title: "Interview consistency",
    description: "Standardize candidate experience with clear guidance and structured flows."
  },
  {
    title: "Recruiter focus",
    description: "Track interview sessions and feedback without wrestling with tools."
  }
];

const LandingPage = () => {
  return (
    <Box>
      <Box
        sx={{
          py: { xs: 10, md: 14 },
          background: "linear-gradient(120deg, rgba(15,118,110,0.1), rgba(245,158,11,0.12))"
        }}
      >
        <Container>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={3} className="fade-up">
                <Typography variant="h1">Recruiter-first interview workflows.</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.1rem" }}>
                  MyPitch helps recruiting teams create jobs, invite candidates, and run structured interviews with
                  zero friction.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button variant="contained" color="primary" size="large" component={RouterLink} to="/register">
                    Start free
                  </Button>
                  <Button variant="outlined" color="primary" size="large" component={RouterLink} to="/login">
                    Login
                  </Button>
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                className="fade-up"
                sx={{
                  borderRadius: 6,
                  p: 4,
                  background: "linear-gradient(140deg, rgba(15,118,110,0.2), rgba(15,118,110,0.05))",
                  border: "1px solid rgba(15,118,110,0.2)"
                }}
              >
                <Typography variant="h3" gutterBottom>
                  Candidate room
                </Typography>
                <Typography color="text.secondary">
                  Share a secure invite link and guide candidates through a consistent interview experience.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container sx={{ py: { xs: 8, md: 12 } }}>
        <Typography variant="h2" sx={{ mb: 4 }}>
          Built for fast-moving teams
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature) => (
            <Grid item xs={12} md={4} key={feature.title}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">{feature.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Container sx={{ pb: { xs: 10, md: 14 } }}>
        <Box
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            background: "#0f172a",
            color: "#f8fafc",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            gap: 4
          }}
        >
          <Box>
            <Typography variant="h3" gutterBottom>
              Ready to shape the next interview?
            </Typography>
            <Typography color="rgba(248,250,252,0.7)">
              Kickstart your team with a clean, production-ready SaaS foundation.
            </Typography>
          </Box>
          <Button variant="contained" color="secondary" size="large" component={RouterLink} to="/register">
            Create account
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
