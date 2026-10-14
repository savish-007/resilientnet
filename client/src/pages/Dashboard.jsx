import { useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatsCards from "../components/StatsCards";
import SOSList from "../components/SOSList";
import EmergencyMap from "../components/EmergencyMap";
import RecentActivity from "../components/RecentActivity";
import SOSForm from "../components/SOSForm";

import { Box, Grid, Stack, Typography } from "@mui/material";

const Dashboard = () => {
    // If arriving from /sos or #sos, smoothly scroll directly to the alerts list
    useEffect(() => {
        if (window.location.pathname === "/sos" || window.location.hash === "#sos") {
            setTimeout(() => {
                const element = document.getElementById("sos-alerts-section");
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }, 300);
        }
    }, []);

    return (
        <DashboardLayout>
            <Sidebar />

            <div
                style={{
                    flex: 1,
                    marginLeft: "25px",
                    width: "calc(100vw - 305px)",
                    overflowX: "hidden"
                }}
            >
                <Navbar />

                <div
                    style={{
                        padding: "25px",
                        width: "100%",
                        boxSizing: "border-box"
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3.5 }}>
                        <Box
                            component="img"
                            src="/logo.png"
                            alt="ResilientNet Logo"
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: "16px",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                                objectFit: "cover"
                            }}
                        />
                        <Box>
                            <Typography
                                variant="h4"
                                sx={{
                                    color: "#0F172A",
                                    fontWeight: 850,
                                    letterSpacing: "-0.5px",
                                    lineHeight: 1.2
                                }}
                            >
                                Welcome to ResilientNet
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 500, mt: 0.3 }}>
                                Local emergency response center, real-time dispatch, and situational intelligence
                            </Typography>
                        </Box>
                    </Stack>

                    <StatsCards />

                    <Box sx={{ mt: 3, mb: 3 }}>
                        <SOSForm />
                    </Box>

                    <EmergencyMap />

                    <Grid
                        container
                        spacing={3}
                        sx={{ mt: 1 }}
                    >
                        <Grid size={{ xs: 12, md: 8 }}>
                            <div id="sos-alerts-section" style={{ scrollMarginTop: "24px" }}>
                                <SOSList />
                            </div>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <RecentActivity />
                        </Grid>
                    </Grid>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;