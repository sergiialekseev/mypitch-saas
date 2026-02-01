import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import Loader from "../components/ui/Loader";
import TableCard from "../components/ui/TableCard";

const colorSwatches = [
  { label: "Primary", color: "primary.main" },
  { label: "Secondary", color: "secondary.main" },
  { label: "Background", color: "background.default", border: true },
  { label: "Paper", color: "background.paper", border: true },
  { label: "Text primary", color: "text.primary" },
  { label: "Text secondary", color: "text.secondary" }
];

const StyleGuidePage = () => {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ backgroundColor: "background.default", minHeight: "100vh", py: { xs: 6, md: 8 } }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Box>
            <Typography variant="h2">MyPitch Style Guide</Typography>
            <Typography color="text.secondary">
              Internal-only page to review the MUI theme, typography, and core components.
            </Typography>
          </Box>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Color palette
              </Typography>
              <Grid container spacing={2}>
                {colorSwatches.map((swatch) => (
                  <Grid item xs={12} sm={6} md={4} key={swatch.label}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        border: swatch.border ? "1px solid" : "none",
                        borderColor: "divider"
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: swatch.color,
                          border: "1px solid",
                          borderColor: "divider"
                        }}
                      />
                      <Typography>{swatch.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Typography
              </Typography>
              <Stack spacing={1}>
                <Typography variant="h1">Heading 1</Typography>
                <Typography variant="h2">Heading 2</Typography>
                <Typography variant="h3">Heading 3</Typography>
                <Typography variant="h4">Heading 4</Typography>
                <Typography variant="h5">Heading 5</Typography>
                <Typography variant="body1">
                  Body 1 — The quick brown fox jumps over the lazy dog.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Body 2 — The quick brown fox jumps over the lazy dog.
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Buttons & chips
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button variant="contained">Primary</Button>
                <Button variant="outlined">Secondary</Button>
                <Button variant="text">Text</Button>
                <Chip label="Default chip" />
                <Chip label="Success chip" color="success" />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inputs
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField label="Text field" fullWidth />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Email" type="email" fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Multiline" multiline minRows={3} fullWidth />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tabs & alerts
              </Typography>
              <Tabs value={tab} onChange={(_, value) => setTab(value)}>
                <Tab label="Overview" />
                <Tab label="Details" />
                <Tab label="Notes" />
              </Tabs>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                <Alert severity="info">Info alert for general updates.</Alert>
                <Alert severity="warning">Warning alert to highlight attention.</Alert>
                <Alert severity="error">Error alert for failures.</Alert>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Loaders
              </Typography>
              <Stack spacing={3}>
                <Loader variant="page" label="Loading dashboard..." />
                <Loader variant="section" label="Loading candidates..." />
                <Loader variant="inline" label="Saving..." />
              </Stack>
            </CardContent>
          </Card>

          <TableCard title="Table layout">
            <Typography color="text.secondary">Use this wrapper for consistent table headers and spacing.</Typography>
          </TableCard>
        </Stack>
      </Container>
    </Box>
  );
};

export default StyleGuidePage;
