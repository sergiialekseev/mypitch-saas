import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  Typography
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { Link as RouterLink } from "react-router-dom";

const capabilities = [
  {
    title: "Structured AI interviews",
    description: "Standardize every candidate experience with consistent questions and scoring."
  },
  {
    title: "Instant reporting",
    description: "Generate interview summaries, Q&A transcripts, and scores in seconds."
  },
  {
    title: "Team visibility",
    description: "Share results across recruiting and hiring managers in a clean workspace."
  }
];

const outcomes = [
  {
    title: "Faster cycles",
    value: "30–50%",
    description: "Reduce time spent scheduling and reviewing interviews."
  },
  {
    title: "Higher consistency",
    value: "100%",
    description: "Every candidate gets the same structured experience."
  },
  {
    title: "Clearer decisions",
    value: "1 place",
    description: "Interview insights, scores, and Q&A in one report."
  }
];

const steps = [
  {
    title: "Create a role",
    description: "Upload a job description and define interview questions."
  },
  {
    title: "Invite candidates",
    description: "Send secure links; candidates join without setup."
  },
  {
    title: "Review reports",
    description: "Get summaries, scores, and Q&A tables instantly."
  }
];

const LOGO_URL =
  "https://firebasestorage.googleapis.com/v0/b/mypitch---saas.firebasestorage.app/o/website_assets%2FBlack%20logo.png?alt=media&token=756320ea-2fac-425f-a85b-d6de723254fd";

const LandingPage = () => {
  return (
    <Box>
      <Box
        sx={{
          py: { xs: 10, md: 14 },
          background: "radial-gradient(circle at 20% 20%, rgba(11, 59, 91, 0.12), transparent 45%)"
        }}
      >
        <Container>
          <Stack spacing={6}>
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={7}>
                <Stack spacing={3} className="fade-up">
                  <Stack spacing={1.5}>
                    <Typography variant="overline" color="text.secondary">
                      AI interviews for modern hiring teams
                    </Typography>
                  </Stack>
                  <Typography variant="h1">Structured interviews. Instant, decision-ready reports.</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.1rem" }}>
                    MyPitch helps companies run consistent AI interviews, capture every answer, and deliver clear
                    scoring so teams can move faster with confidence.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Button variant="contained" color="primary" size="large" component={RouterLink} to="/register">
                      Start free
                    </Button>
                    <Button variant="outlined" color="primary" size="large" component={RouterLink} to="/login">
                      Log in
                    </Button>
                  </Stack>
                </Stack>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box
                  component="img"
                  className="fade-up"
                  src="https://firebasestorage.googleapis.com/v0/b/mypitch---saas.firebasestorage.app/o/website_assets%2Finterview_screen.png?alt=media&token=d87245b0-9d18-47c5-88a5-ed71d4b88e83"
                  alt="Interview workspace preview"
                  sx={{
                    width: "100%",
                    borderRadius: 4,
                    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
                    border: "1px solid rgba(15, 23, 42, 0.08)"
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              {outcomes.map((item) => (
                <Grid item xs={12} md={4} key={item.title}>
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography variant="h4">{item.value}</Typography>
                      <Typography variant="subtitle1" sx={{ mt: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography color="text.secondary">{item.description}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Box>

      <Container sx={{ py: { xs: 8, md: 12 } }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h2">Built for B2B hiring teams</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Reduce bias, improve consistency, and move candidates through the funnel faster.
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {capabilities.map((feature) => (
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
        </Stack>
      </Container>

      <Box sx={{ backgroundColor: "background.paper", py: { xs: 8, md: 10 } }}>
        <Container>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Typography variant="h2">How it works</Typography>
                <Typography color="text.secondary">
                  From role setup to final decision, your team stays aligned and every interview is consistent.
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                {steps.map((step, index) => (
                  <Card key={step.title}>
                    <CardContent>
                      <Typography variant="overline" color="text.secondary">
                        Step {index + 1}
                      </Typography>
                      <Typography variant="h6">{step.title}</Typography>
                      <Typography color="text.secondary">{step.description}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container sx={{ pb: { xs: 10, md: 14 } }}>
        <Box
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            background: "#0B3B5B",
            color: "#F8FAFC",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            gap: 4
          }}
        >
          <Box>
            <Typography variant="h3" gutterBottom>
              Ready to run consistent AI interviews?
            </Typography>
            <Typography color="rgba(248,250,252,0.75)">
              Launch a structured interview process your team can trust.
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
