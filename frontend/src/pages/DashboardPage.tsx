import { Box, Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";

const DashboardPage = () => {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Overview
        </Typography>
        <Typography color="text.secondary">
          High-level hiring activity for your team. (Mock data)
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {[
          { label: "Active roles", value: "6", icon: <PersonSearchIcon color="primary" /> },
          { label: "Candidates in pipeline", value: "42", icon: <TrendingUpIcon color="primary" /> },
          { label: "Avg time to hire", value: "18 days", icon: <ScheduleIcon color="primary" /> },
          { label: "Interviews this week", value: "12", icon: <AutoGraphIcon color="primary" /> }
        ].map((stat) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.label}>
            <Paper sx={{ p: 2.5 }}>
              <Stack spacing={1}>
                <Box>{stat.icon}</Box>
                <Typography variant="h5">{stat.value}</Typography>
                <Typography color="text.secondary">{stat.label}</Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Hiring pipeline</Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {[
                  { label: "Screening", count: 18 },
                  { label: "Interviewing", count: 12 },
                  { label: "Offer", count: 4 },
                  { label: "Hired", count: 2 }
                ].map((stage) => (
                  <Paper key={stage.label} sx={{ p: 2, minWidth: 140 }}>
                    <Typography variant="subtitle2">{stage.label}</Typography>
                    <Typography variant="h6">{stage.count}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      candidates
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Recent activity</Typography>
              <Stack spacing={1.5}>
                {[
                  "Product Designer role published",
                  "Interview completed: Sarah K.",
                  "Interview scheduled: Victor O.",
                  "Hiring manager approved shortlist"
                ].map((item) => (
                  <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Chip size="small" label="Update" />
                    <Typography variant="body2">{item}</Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default DashboardPage;
