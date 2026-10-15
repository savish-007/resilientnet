import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ResourceDashboard from "./pages/ResourceDashboard";
import ResourceRequestDashboard from "./pages/ResourceRequestDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import VolunteerSelfDashboard from "./pages/VolunteerSelfDashboard";
import ReportsDashboard from "./pages/ReportsDashboard";
import AIDashboard from "./pages/AIDashboard";
import ResetPassword from "./pages/ResetPassword";
import CitizenDashboard from "./pages/CitizenDashboard";
import SOSAlertsDashboard from "./pages/SOSAlertsDashboard";
import MeshDashboard from "./pages/MeshDashboard";

import { Box, Card, CardContent, Typography, Button, Chip, Stack } from "@mui/material";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

function App() {
    const token = localStorage.getItem("token");
    if (window.location.pathname === "/reset-password") {
        return <ResetPassword />;
    }

    if (!token) {
        return <Login />;
    }

    let user = null;
    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch (e) {
        user = null;
    }

    // 1. Citizen Role: Exclusively route to dedicated Citizen Emergency Portal
    if (user?.role === "CITIZEN") {
        return <CitizenDashboard />;
    }

    // 2. Pending Volunteer: Application under review screen
    if (user?.role === "PENDING_VOLUNTEER") {
        const handleLogout = () => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/";
        };

        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    bgcolor: "#0A1120",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 3
                }}
            >
                <Card
                    sx={{
                        maxWidth: 480,
                        width: "100%",
                        borderRadius: "24px",
                        bgcolor: "rgba(30, 41, 59, 0.75)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
                        p: 2,
                        textAlign: "center"
                    }}
                >
                    <CardContent>
                        <Box
                            component="img"
                            src="/logo.png"
                            alt="ResilientNet Logo"
                            sx={{ width: 64, height: 64, mx: "auto", mb: 2 }}
                        />

                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 1.5 }}>
                            <HourglassEmptyRoundedIcon sx={{ color: "#F59E0B", fontSize: 26 }} />
                            <Typography variant="h6" fontWeight={800} color="#FFFFFF">
                                Application Under Review
                            </Typography>
                        </Stack>

                        <Chip
                            label="Pending Administrator Approval"
                            size="small"
                            sx={{
                                bgcolor: "rgba(245, 158, 11, 0.15)",
                                color: "#F59E0B",
                                fontWeight: 700,
                                mb: 2.5
                            }}
                        />

                        <Typography variant="body2" color="#94A3B8" sx={{ mb: 3, lineHeight: 1.6 }}>
                            Welcome, <strong style={{ color: "#FFFFFF" }}>{user?.full_name || "Volunteer"}</strong>! Your application to join the emergency responder team has been registered. An Administrator is reviewing your details and will assign you to active duty.
                        </Typography>

                        <Stack spacing={1.5}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() => window.location.reload()}
                                startIcon={<RefreshRoundedIcon />}
                                sx={{
                                    borderRadius: "12px",
                                    py: 1.2,
                                    fontWeight: 700,
                                    textTransform: "none",
                                    bgcolor: "#F59E0B",
                                    color: "#0F172A",
                                    "&:hover": { bgcolor: "#D97706" }
                                }}
                            >
                                Check Approval Status
                            </Button>

                            <Button
                                fullWidth
                                variant="outlined"
                                color="inherit"
                                onClick={handleLogout}
                                startIcon={<LogoutRoundedIcon />}
                                sx={{
                                    borderRadius: "12px",
                                    py: 1,
                                    color: "#94A3B8",
                                    borderColor: "rgba(255,255,255,0.2)",
                                    textTransform: "none",
                                    "&:hover": { borderColor: "rgba(255,255,255,0.4)" }
                                }}
                            >
                                Sign Out
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    // 3. Responders & Administrators: Access standard navigation routes
    const path = window.location.pathname;

    if (path === "/sos") {
        return <SOSAlertsDashboard />;
    }

    if (path === "/mesh") {
        return <MeshDashboard />;
    }

    if (path === "/resources") {
        return <ResourceDashboard />;
    }

    if (path === "/resource-requests") {
        return <ResourceRequestDashboard />;
    }

    if (path === "/volunteers") {
        return user?.role === "ADMIN" || user?.role === "VOLUNTEER_RESPONDER" ? (
            <VolunteerDashboard />
        ) : (
            <VolunteerSelfDashboard />
        );
    }

    if (path === "/reports") {
        return <ReportsDashboard />;
    }

    if (path === "/ai") {
        return <AIDashboard />;
    }

    if (path === "/volunteer-portal" || path === "/my-assignments") {
        return <VolunteerSelfDashboard />;
    }

    return <Dashboard />;
}

export default App;