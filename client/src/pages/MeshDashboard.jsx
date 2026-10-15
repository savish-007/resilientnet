import { useEffect, useState, useCallback } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    Paper,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography
} from "@mui/material";

import DashboardLayout from "../layouts/DashboardLayout";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import BluetoothRoundedIcon from "@mui/icons-material/BluetoothRounded";
import BluetoothSearchingRoundedIcon from "@mui/icons-material/BluetoothSearchingRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import meshService from "../services/meshService";

const MeshDashboard = () => {
    const [tabIndex, setTabIndex] = useState(0); // 0 = Outbox, 1 = Relayed, 2 = Nearby Peers
    const [stats, setStats] = useState(meshService.getStats());
    const [outbox, setOutbox] = useState(meshService.getOutbox());
    const [relayed, setRelayed] = useState(meshService.getRelayedPackets());
    const [peers, setPeers] = useState(meshService.getKnownPeers());
    const [scanning, setScanning] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncFeedback, setSyncFeedback] = useState(null);
    const [selectedPacket, setSelectedPacket] = useState(null);

    const refreshData = useCallback(() => {
        setStats(meshService.getStats());
        setOutbox(meshService.getOutbox());
        setRelayed(meshService.getRelayedPackets());
        setPeers(meshService.getKnownPeers());
    }, []);

    useEffect(() => {
        const unsubOutbox = meshService.on("outbox_updated", () => refreshData());
        const unsubRelayed = meshService.on("relayed_updated", () => refreshData());
        const unsubPeers = meshService.on("peers_updated", () => refreshData());
        const unsubSync = meshService.on("mesh_sync_success", (res) => {
            setSyncFeedback({
                type: "success",
                text: `Successfully synced ${res.syncedCount} packet(s) to Rescue Central Command!`
            });
            refreshData();
        });

        const interval = setInterval(refreshData, 3000);
        return () => {
            unsubOutbox();
            unsubRelayed();
            unsubPeers();
            unsubSync();
            clearInterval(interval);
        };
    }, [refreshData]);

    // Handle Manual BLE Scan
    const handleScanBluetooth = async () => {
        setScanning(true);
        const result = await meshService.scanNearbyBluetoothDevices();
        setScanning(false);
        refreshData();
        if (result?.message && !result.cancelled) {
            setSyncFeedback({ type: "info", text: result.message });
        }
    };

    // Handle Simulated Passing Peer (Store-and-forward demonstration)
    const handleSimulatePeerEncounter = () => {
        const result = meshService.simulatePassingMobilePeer();
        refreshData();
        setSyncFeedback({
            type: "info",
            text: `Encountered passing mobile peer (${result.peerId})! Relayed ${result.relayedOutboxCount} packets forward and accepted 1 incoming emergency packet.`
        });
    };

    // Handle Manual Uplink Sync
    const handleForceSync = async () => {
        setSyncing(true);
        setSyncFeedback(null);
        const res = await meshService.flushMeshQueueToServer();
        setSyncing(false);
        refreshData();
        if (res.error) {
            setSyncFeedback({ type: "warning", text: `Sync attempted: ${res.error}. Device will auto-sync when online.` });
        } else if (res.syncedCount === 0) {
            setSyncFeedback({ type: "info", text: "All packets are already delivered to central command." });
        }
    };

    return (
        <DashboardLayout>
            <Sidebar />
            <Box sx={{ flex: 1, ml: { xs: 0, md: "250px" }, minHeight: "100vh", bgcolor: "#0A1120", color: "#F8FAFC" }}>
                <Navbar />

                <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
                    {/* Header */}
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3.5 }}>
                        <Box>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                                <Box sx={{ width: 44, height: 44, borderRadius: "14px", bgcolor: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(2, 132, 199, 0.3)" }}>
                                    <BluetoothRoundedIcon sx={{ color: "#FFFFFF", fontSize: 28 }} />
                                </Box>
                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="h5" fontWeight={850} color="#FFFFFF" letterSpacing="-0.5px">
                                            Bluetooth & Offline Mesh Terminal
                                        </Typography>
                                        <Chip
                                            label={stats.isOnline ? "INTERNET GATEWAY UPLINK" : "OFFLINE MESH MODE"}
                                            size="small"
                                            icon={stats.isOnline ? <WifiRoundedIcon sx={{ fontSize: "16px !important" }} /> : <WifiOffRoundedIcon sx={{ fontSize: "16px !important" }} />}
                                            sx={{
                                                bgcolor: stats.isOnline ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                                color: stats.isOnline ? "#34D399" : "#FBBF24",
                                                fontWeight: 800,
                                                fontSize: "0.72rem",
                                                border: `1px solid ${stats.isOnline ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
                                            }}
                                        />
                                    </Stack>
                                    <Typography variant="body2" color="#94A3B8">
                                        Device Node ID: <strong style={{ color: "#38BDF8" }}>{stats.nodeId}</strong> • Delay-Tolerant Store-and-Forward Mesh Protocol
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>

                        {/* Top Action Buttons */}
                        <Stack direction="row" spacing={1.5} flexWrap="wrap">
                            <Button
                                variant="outlined"
                                onClick={handleSimulatePeerEncounter}
                                startIcon={<PlayArrowRoundedIcon />}
                                sx={{
                                    borderRadius: "12px",
                                    color: "#FBBF24",
                                    borderColor: "rgba(245, 158, 11, 0.4)",
                                    fontWeight: 750,
                                    textTransform: "none",
                                    "&:hover": { borderColor: "#FBBF24", bgcolor: "rgba(245, 158, 11, 0.08)" }
                                }}
                            >
                                Simulate Mobile Peer Hop
                            </Button>

                            <Button
                                variant="contained"
                                onClick={handleForceSync}
                                disabled={syncing}
                                startIcon={<CloudUploadRoundedIcon />}
                                sx={{
                                    borderRadius: "12px",
                                    bgcolor: "#0284C7",
                                    fontWeight: 750,
                                    textTransform: "none",
                                    "&:hover": { bgcolor: "#0369A1" }
                                }}
                            >
                                {syncing ? "Uploading..." : "Sync Gateway to HQ"}
                            </Button>
                        </Stack>
                    </Stack>

                    {/* Feedback Alert */}
                    {syncFeedback && (
                        <Box sx={{ mb: 3, p: 2, borderRadius: "14px", bgcolor: syncFeedback.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(2, 132, 199, 0.12)", border: `1px solid ${syncFeedback.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(2, 132, 199, 0.3)"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="body2" color={syncFeedback.type === "success" ? "#34D399" : "#38BDF8"} fontWeight={600}>
                                {syncFeedback.text}
                            </Typography>
                            <IconButton size="small" onClick={() => setSyncFeedback(null)} sx={{ color: "#94A3B8" }}>×</IconButton>
                        </Box>
                    )}

                    {/* KPI Telemetry Cards */}
                    <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ bgcolor: "rgba(30, 41, 59, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", p: 1 }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" color="#94A3B8" fontWeight={700}>LOCAL OUTBOX</Typography>
                                        <Chip label={`${stats.outboxPending} Pending`} size="small" sx={{ bgcolor: "rgba(239, 68, 68, 0.15)", color: "#F87171", fontWeight: 700, fontSize: "0.7rem" }} />
                                    </Stack>
                                    <Typography variant="h4" fontWeight={850} color="#FFFFFF" sx={{ my: 1 }}>
                                        {stats.outboxTotal}
                                    </Typography>
                                    <Typography variant="caption" color="#64748B">Packets originated on this device</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ bgcolor: "rgba(30, 41, 59, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", p: 1 }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" color="#94A3B8" fontWeight={700}>RELAY CARRIER QUEUE</Typography>
                                        <Chip label={`${stats.relayedPending} In Transit`} size="small" sx={{ bgcolor: "rgba(56, 189, 248, 0.15)", color: "#38BDF8", fontWeight: 700, fontSize: "0.7rem" }} />
                                    </Stack>
                                    <Typography variant="h4" fontWeight={850} color="#FFFFFF" sx={{ my: 1 }}>
                                        {stats.relayedTotal}
                                    </Typography>
                                    <Typography variant="caption" color="#64748B">Packets carried for passing citizens</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ bgcolor: "rgba(30, 41, 59, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", p: 1 }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" color="#94A3B8" fontWeight={700}>NEARBY PEERS DISCOVERED</Typography>
                                        <BluetoothSearchingRoundedIcon sx={{ color: "#38BDF8", fontSize: 20 }} />
                                    </Stack>
                                    <Typography variant="h4" fontWeight={850} color="#38BDF8" sx={{ my: 1 }}>
                                        {stats.knownPeersCount}
                                    </Typography>
                                    <Typography variant="caption" color="#64748B">Mobile devices in BLE radius</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ bgcolor: "rgba(30, 41, 59, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", p: 1 }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" color="#94A3B8" fontWeight={700}>GATEWAY STATUS</Typography>
                                        {stats.isOnline ? <CheckCircleRoundedIcon sx={{ color: "#10B981", fontSize: 20 }} /> : <WifiOffRoundedIcon sx={{ color: "#F59E0B", fontSize: 20 }} />}
                                    </Stack>
                                    <Typography variant="h5" fontWeight={850} color={stats.isOnline ? "#34D399" : "#FBBF24"} sx={{ my: 1 }}>
                                        {stats.isOnline ? "Active Uplink" : "Carrying / Offline"}
                                    </Typography>
                                    <Typography variant="caption" color="#64748B">{stats.isOnline ? "Auto-relays packets to HQ" : "Relaying via BLE hops"}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Radar & Store-and-Forward Navigation Tabs */}
                    <Card sx={{ bgcolor: "rgba(30, 41, 59, 0.75)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", overflow: "hidden" }}>
                        <Tabs
                            value={tabIndex}
                            onChange={(e, v) => setTabIndex(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            allowScrollButtonsMobile
                            sx={{
                                borderBottom: "1px solid rgba(255,255,255,0.08)",
                                px: 2.5,
                                pt: 1,
                                "& .MuiTab-root": {
                                    color: "#CBD5E1",
                                    fontWeight: 800,
                                    textTransform: "none",
                                    fontSize: "0.9rem",
                                    minHeight: 48,
                                    "&.Mui-selected": { color: "#38BDF8 !important" }
                                }
                            }}
                        >
                            <Tab label={`My Outbox (${outbox.length})`} />
                            <Tab label={`Relayed Store (${relayed.length})`} />
                            <Tab label={`Nearby Bluetooth Nodes (${peers.length})`} />
                        </Tabs>

                        <CardContent sx={{ p: 3 }}>
                            {/* TAB 0: OUTBOX */}
                            {tabIndex === 0 && (
                                <Stack spacing={2}>
                                    {outbox.length === 0 ? (
                                        <Box sx={{ py: 6, textAlign: "center" }}>
                                            <HubRoundedIcon sx={{ fontSize: 48, color: "#64748B", mb: 1.5 }} />
                                            <Typography variant="h6" color="#FFFFFF" fontWeight={750}>No Local Packets Queued</Typography>
                                            <Typography variant="body2" color="#64748B">When an SOS is sent without internet, it will be saved here and broadcasted via Bluetooth.</Typography>
                                        </Box>
                                    ) : (
                                        outbox.map((packet) => (
                                            <PacketRow key={packet.mesh_message_id} packet={packet} onView={() => setSelectedPacket(packet)} />
                                        ))
                                    )}
                                </Stack>
                            )}

                            {/* TAB 1: RELAYED BUFFER */}
                            {tabIndex === 1 && (
                                <Stack spacing={2}>
                                    {relayed.length === 0 ? (
                                        <Box sx={{ py: 6, textAlign: "center" }}>
                                            <BluetoothSearchingRoundedIcon sx={{ fontSize: 48, color: "#64748B", mb: 1.5 }} />
                                            <Typography variant="h6" color="#FFFFFF" fontWeight={750}>Relay Buffer Empty</Typography>
                                            <Typography variant="body2" color="#64748B">When another citizen passes by this phone, their SOS alerts will be carried here until an internet uplink is encountered.</Typography>
                                            <Button variant="outlined" onClick={handleSimulatePeerEncounter} sx={{ mt: 2, borderRadius: "10px", color: "#FBBF24", borderColor: "#FBBF24" }}>
                                                Simulate Receiving a Peer Packet
                                            </Button>
                                        </Box>
                                    ) : (
                                        relayed.map((packet) => (
                                            <PacketRow key={packet.mesh_message_id} packet={packet} onView={() => setSelectedPacket(packet)} isRelay />
                                        ))
                                    )}
                                </Stack>
                            )}

                            {/* TAB 2: NEARBY PEERS */}
                            {tabIndex === 2 && (
                                <Box>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1" fontWeight={750} color="#FFFFFF">
                                            Discovered Devices in Bluetooth Range
                                        </Typography>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={handleScanBluetooth}
                                            disabled={scanning}
                                            startIcon={<BluetoothSearchingRoundedIcon />}
                                            sx={{ borderRadius: "10px", color: "#38BDF8", borderColor: "#38BDF8", textTransform: "none" }}
                                        >
                                            {scanning ? "Scanning BLE..." : "Scan for Devices"}
                                        </Button>
                                    </Stack>

                                    {peers.length === 0 ? (
                                        <Box sx={{ py: 6, textAlign: "center" }}>
                                            <BluetoothRoundedIcon sx={{ fontSize: 48, color: "#64748B", mb: 1.5 }} />
                                            <Typography variant="h6" color="#FFFFFF" fontWeight={750}>No Nearby Peers in Range</Typography>
                                            <Typography variant="body2" color="#64748B">Click "Scan for Devices" or "Simulate Mobile Peer Hop" to detect neighboring phones.</Typography>
                                        </Box>
                                    ) : (
                                        <Grid container spacing={2}>
                                            {peers.map((peer) => (
                                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={peer.id}>
                                                    <Paper sx={{ p: 2, borderRadius: "14px", bgcolor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                                            <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                <BluetoothRoundedIcon sx={{ color: "#38BDF8", fontSize: 20 }} />
                                                            </Box>
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography variant="subtitle2" fontWeight={800} color="#FFFFFF" noWrap>{peer.id}</Typography>
                                                                <Typography variant="caption" color="#94A3B8">{peer.role || "Active Mobile Node"}</Typography>
                                                            </Box>
                                                            <Chip label={peer.distanceApprox || "Nearby"} size="small" sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#CBD5E1", fontSize: "0.68rem" }} />
                                                        </Stack>
                                                        <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.06)" }} />
                                                        <Stack direction="row" justifyContent="space-between">
                                                            <Typography variant="caption" color="#64748B">Signal RSSI: <strong>{peer.rssi || -60} dBm</strong></Typography>
                                                            <Typography variant="caption" color="#64748B">Last Seen: {new Date(peer.lastSeen).toLocaleTimeString()}</Typography>
                                                        </Stack>
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Container>
            </Box>

            {/* Packet Detail & Hop Trace Modal */}
            {selectedPacket && (
                <Dialog
                    open={Boolean(selectedPacket)}
                    onClose={() => setSelectedPacket(null)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: { bgcolor: "#0F172A", color: "#FFFFFF", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.12)" }
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 850 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <HubRoundedIcon sx={{ color: "#38BDF8" }} />
                            <span>Mesh Packet Relay Trail</span>
                        </Stack>
                    </DialogTitle>
                    <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
                        <Typography variant="subtitle2" color="#94A3B8" sx={{ mb: 1 }}>PACKET ID</Typography>
                        <Typography variant="body2" fontFamily="monospace" sx={{ bgcolor: "rgba(0,0,0,0.3)", p: 1, borderRadius: "8px", color: "#38BDF8", mb: 2 }}>
                            {selectedPacket.mesh_message_id}
                        </Typography>

                        <Typography variant="subtitle2" color="#94A3B8" sx={{ mb: 1 }}>EMERGENCY MESSAGE</Typography>
                        <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>{selectedPacket.message}</Typography>

                        <Typography variant="subtitle2" color="#94A3B8" sx={{ mb: 1 }}>MULTI-HOP PEER ROUTE ({selectedPacket.hops || 0} Hops)</Typography>
                        <Box sx={{ bgcolor: "rgba(0,0,0,0.25)", p: 2, borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", mb: 2 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                {(selectedPacket.hop_path || [selectedPacket.origin_node || "ORIGIN"]).map((hop, idx, arr) => (
                                    <Stack key={idx} direction="row" spacing={1} alignItems="center">
                                        <Chip
                                            label={hop}
                                            size="small"
                                            sx={{
                                                bgcolor: idx === 0 ? "rgba(239, 68, 68, 0.2)" : idx === arr.length - 1 ? "rgba(16, 185, 129, 0.2)" : "rgba(56, 189, 248, 0.2)",
                                                color: idx === 0 ? "#F87171" : idx === arr.length - 1 ? "#34D399" : "#38BDF8",
                                                fontWeight: 800
                                            }}
                                        />
                                        {idx < arr.length - 1 && <ArrowForwardRoundedIcon sx={{ color: "#64748B", fontSize: 16 }} />}
                                    </Stack>
                                ))}
                            </Stack>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="#94A3B8">Category: <strong>{selectedPacket.category}</strong></Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="#94A3B8">Severity: <strong>{selectedPacket.severity}</strong></Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="#94A3B8">Latitude: <strong>{selectedPacket.latitude?.toFixed(4)}</strong></Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="#94A3B8">Longitude: <strong>{selectedPacket.longitude?.toFixed(4)}</strong></Typography>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, borderColor: "rgba(255,255,255,0.08)" }}>
                        <Button onClick={() => setSelectedPacket(null)} sx={{ color: "#94A3B8" }}>Close</Button>
                    </DialogActions>
                </Dialog>
            )}
        </DashboardLayout>
    );
};

const PacketRow = ({ packet, onView, isRelay }) => {
    const isDelivered = packet.status === "DELIVERED_TO_RESCUE_HQ";

    return (
        <Paper
            sx={{
                p: 2,
                borderRadius: "14px",
                bgcolor: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 1.5
            }}
        >
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Chip
                        label={isRelay ? "RELAYED VIA BLE" : "ORIGIN (THIS PHONE)"}
                        size="small"
                        sx={{ bgcolor: isRelay ? "rgba(56, 189, 248, 0.15)" : "rgba(239, 68, 68, 0.15)", color: isRelay ? "#38BDF8" : "#F87171", fontWeight: 800, fontSize: "0.68rem" }}
                    />
                    <Chip
                        label={`${packet.hops || 0} HOPS`}
                        size="small"
                        sx={{ bgcolor: "rgba(255, 255, 255, 0.08)", color: "#CBD5E1", fontWeight: 700, fontSize: "0.68rem" }}
                    />
                    <Chip
                        label={isDelivered ? "DELIVERED TO HQ" : "IN TRANSIT / BROADCASTING"}
                        size="small"
                        icon={isDelivered ? <CheckCircleRoundedIcon sx={{ fontSize: "14px !important" }} /> : <BluetoothSearchingRoundedIcon sx={{ fontSize: "14px !important" }} />}
                        sx={{ bgcolor: isDelivered ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)", color: isDelivered ? "#34D399" : "#FBBF24", fontWeight: 800, fontSize: "0.68rem" }}
                    />
                </Stack>
                <Typography variant="body1" fontWeight={750} color="#FFFFFF" noWrap sx={{ maxWidth: 500 }}>
                    {packet.message}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="#94A3B8">ID: {packet.mesh_message_id?.slice(0, 18)}...</Typography>
                    <Typography variant="caption" color="#94A3B8">{new Date(packet.created_at).toLocaleTimeString()}</Typography>
                </Stack>
            </Box>

            <Button size="small" variant="outlined" onClick={onView} sx={{ borderRadius: "10px", color: "#38BDF8", borderColor: "rgba(56, 189, 248, 0.4)", textTransform: "none", alignSelf: { xs: "flex-end", sm: "center" } }}>
                View Hop Trail
            </Button>
        </Paper>
    );
};

export default MeshDashboard;
