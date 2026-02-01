import { AppBar, Box, Button, Toolbar } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LOGO_URL =
  "https://firebasestorage.googleapis.com/v0/b/mypitch---saas.firebasestorage.app/o/website_assets%2FBlack%20logo.png?alt=media&token=756320ea-2fac-425f-a85b-d6de723254fd";

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{ background: "transparent", color: "inherit" }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box
          component={RouterLink}
          to="/"
          sx={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
        >
          <Box
            component="img"
            src={LOGO_URL}
            alt="MyPitch"
            sx={{ height: 28, width: "auto", display: "block" }}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button component={RouterLink} to="/" color="inherit">
            Home
          </Button>
          {user ? (
            <>
              <Button component={RouterLink} to="/app" color="inherit">
                Jobs
              </Button>
              <Button variant="contained" color="secondary" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button component={RouterLink} to="/login" color="inherit">
                Login
              </Button>
              <Button variant="contained" color="secondary" component={RouterLink} to="/register">
                Get Started
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
