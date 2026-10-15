import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatsCards from "../components/StatsCards";
import SOSList from "../components/SOSList";
import EmergencyMap from "../components/EmergencyMap";
import RecentActivity from "../components/RecentActivity";
import SOSForm from "../components/SOSForm";

import { Box, Button, Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import BluetoothRoundedIcon from "@mui/icons-material/BluetoothRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import meshService from "../services/meshService";

const Dashboard = () => {
    // Bluetooth Mesh State
    const [meshStats, setMeshStats] = useState(meshService.getStats());
    const [meshOutbox, setMeshOutbox] = useState(meshService.getOutbox());
    const [meshRelayed, setMeshRelayed] = useState(meshService.getRelayedPackets());

    useEffect(() => {
        const unsub1 = meshService.on("outbox_updated", (list) => {
            setMeshOutbox([...list]);
            setMeshStats(meshService.getStats());
        });
        const unsub2 = meshService.on("relayed_updated", (list) => {
            setMeshRelayed([...list]);
            setMeshStats(meshService.getStats());
        });
        return () => {
            unsub1();
            unsub2();
        };
    }, []);

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

                    {/* Bluetooth Offline Mesh Relay Section */}
                    <Paper
                        elevation={0}
                        sx={{
                            mt: 3.5,
                            p: { xs: 2, sm: 3 },
                            borderRadius: "20px",
                            bgcolor: "#FFFFFF",
                            border: "1.5px solid #CBD5E1",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.04)"
                        }}
                    >
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={2}
                            sx={{ mb: 2.5 }}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Box
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "12px",
                                        bgcolor: "#0284C7",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        boxShadow: "0 4px 14px rgba(2, 132, 199, 0.25)"
                                    }}
                                >
                                    <BluetoothRoundedIcon sx={{ color: "#FFFFFF", fontSize: 26 }} />
                                </Box>
                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                        <Typography variant="h6" fontWeight={850} color="#0F172A">
                                            Bluetooth Offline Mesh Network
                                        </Typography>
                                        <Chip
                                            label={navigator.onLine ? "GATEWAY UPLINK ACTIVE" : "OFFLINE P2P MESH"}
                                            size="small"
                                            sx={{
                                                bgcolor: navigator.onLine ? "#DCFCE7" : "#FEF3C7",
                                                color: navigator.onLine ? "#15803D" : "#78350F",
                                                fontWeight: 850,
                                                fontSize: "0.7rem",
                                                border: `1px solid ${navigator.onLine ? "#86EFAC" : "#FDE68A"}`
                                            }}
                                        />
                                    </Stack>
                                    <Typography variant="body2" color="#1E293B" fontWeight={650}>
                                        Node ID: <strong style={{ color: "#0284C7", fontWeight: 850 }}>{meshStats.nodeId}</strong> • Delay-tolerant store-and-forward mesh across passing mobile devices
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => {
                                        meshService.simulatePassingMobilePeer();
                                        setMeshOutbox(meshService.getOutbox());
                                        setMeshRelayed(meshService.getRelayedPackets());
                                    }}
                                    startIcon={<PlayArrowRoundedIcon />}
                                    sx={{
                                        borderRadius: "10px",
                                        bgcolor: "#D97706",
                                        color: "#FFFFFF",
                                        textTransform: "none",
                                        fontWeight: 800,
                                        "&:hover": { bgcolor: "#B45309" }
                                    }}
                                >
                                    Simulate Passing Phone Hop
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => meshService.flushMeshQueueToServer()}
                                    startIcon={<RefreshRoundedIcon />}
                                    sx={{
                                        borderRadius: "10px",
                                        bgcolor: "#0284C7",
                                        color: "#FFFFFF",
                                        textTransform: "none",
                                        fontWeight: 800,
                                        "&:hover": { bgcolor: "#0369A1" }
                                    }}
                                >
                                    Sync Gateway
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => window.location.href = "/mesh"}
                                    sx={{
                                        borderRadius: "10px",
                                        borderColor: "#0284C7",
                                        color: "#0284C7",
                                        textTransform: "none",
                                        fontWeight: 800,
                                        "&:hover": { borderColor: "#0369A1", bgcolor: "rgba(2, 132, 199, 0.05)" }
                                    }}
                                >
                                    Open Mesh Terminal →
                                </Button>
                            </Stack>
                        </Stack>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Box sx={{ p: 2, borderRadius: "14px", bgcolor: "#FEF2F2", border: "1.5px solid #FECACA" }}>
                                    <Typography variant="caption" color="#991B1B" fontWeight={850}>LOCAL MESH OUTBOX</Typography>
                                    <Typography variant="h5" fontWeight={900} color="#7F1D1D" sx={{ my: 0.5 }}>{meshOutbox.length}</Typography>
                                    <Typography variant="body2" color="#991B1B" fontWeight={700}>Packets stored on this device</Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Box sx={{ p: 2, borderRadius: "14px", bgcolor: "#F0F9FF", border: "1.5px solid #BAE6FD" }}>
                                    <Typography variant="caption" color="#0369A1" fontWeight={850}>RELAY CARRIER QUEUE</Typography>
                                    <Typography variant="h5" fontWeight={900} color="#0C4A6E" sx={{ my: 0.5 }}>{meshRelayed.length}</Typography>
                                    <Typography variant="body2" color="#0369A1" fontWeight={700}>Packets carried for passing citizens</Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Box sx={{ p: 2, borderRadius: "14px", bgcolor: navigator.onLine ? "#F0FDF4" : "#FFFBEB", border: `1.5px solid ${navigator.onLine ? "#BBF7D0" : "#FDE68A"}` }}>
                                    <Typography variant="caption" color={navigator.onLine ? "#166534" : "#92400E"} fontWeight={850}>GATEWAY UPLINK</Typography>
                                    <Typography variant="h5" fontWeight={900} color={navigator.onLine ? "#14532D" : "#78350F"} sx={{ my: 0.5 }}>
                                        {navigator.onLine ? "Online (Uplink)" : "Offline (Relaying)"}
                                    </Typography>
                                    <Typography variant="body2" color={navigator.onLine ? "#166534" : "#92400E"} fontWeight={700}>
                                        {navigator.onLine ? "Auto-syncs packets to HQ" : "Broadcasting via BLE hops"}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>

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