import { useState, useEffect } from "react";
import {
    Alert,
    AppBar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Grid,
    MenuItem,
    Paper,
    Stack,
    Tab,
    Tabs,
    TextField,
    Toolbar,
    Typography
} from "@mui/material";

import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import BluetoothRoundedIcon from "@mui/icons-material/BluetoothRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import api from "../api/api";
import meshService from "../services/meshService";

const CitizenDashboard = () => {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
        user = null;
    }

    const [currentTab, setCurrentTab] = useState(0); // 0 = SOS, 1 = Resource Request, 2 = My Status

    // SOS State
    const [sosMessage, setSosMessage] = useState("");
    const [sosCategory, setSosCategory] = useState("Medical");
    const [sosSeverity, setSosSeverity] = useState("HIGH");
    const [sosLocation, setSosLocation] = useState(null);
    const [locating, setLocating] = useState(false);
    const [sosLoading, setSosLoading] = useState(false);
    const [sosFeedback, setSosFeedback] = useState(null);

    // Resource Request State
    const [reqCategory, setReqCategory] = useState("Drinking Water");
    const [reqName, setReqName] = useState("");
    const [reqQuantity, setReqQuantity] = useState("1");
    const [reqUnit, setReqUnit] = useState("Packs");
    const [reqPriority, setReqPriority] = useState("HIGH");
    const [reqNotes, setReqNotes] = useState("");
    const [reqLoading, setReqLoading] = useState(false);
    const [reqFeedback, setReqFeedback] = useState(null);

    // My Requests History
    const [mySOSList, setMySOSList] = useState([]);
    const [myResourceList, setMyResourceList] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Bluetooth Mesh State
    const [meshStats, setMeshStats] = useState(meshService.getStats());
    const [meshOutbox, setMeshOutbox] = useState(meshService.getOutbox());
    const [meshRelayed, setMeshRelayed] = useState(meshService.getRelayedPackets());

    // Auto-detect GPS and subscribe to mesh
    useEffect(() => {
        detectLocation();
        fetchMyHistory();

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

    const detectLocation = () => {
        if (!navigator.geolocation) {
            setSosFeedback({
                type: "error",
                text: "Location services are not supported by this device."
            });
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setSosLocation({
                    latitude: Number(pos.coords.latitude.toFixed(6)),
                    longitude: Number(pos.coords.longitude.toFixed(6)),
                    accuracy: Math.round(pos.coords.accuracy)
                });
                setLocating(false);
            },
            () => {
                setLocating(false);
                setSosFeedback({
                    type: "warning",
                    text: "Could not automatically fetch GPS coordinates. Please allow location permissions in your browser."
                });
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    const fetchMyHistory = async () => {
        setHistoryLoading(true);
        try {
            const [sosRes, reqRes] = await Promise.all([
                api.get("/sos"),
                api.get("/resource-requests")
            ]);
            setMySOSList(Array.isArray(sosRes.data) ? sosRes.data : []);
            setMyResourceList(Array.isArray(reqRes.data) ? reqRes.data : []);
        } catch (err) {
            console.error("Failed to load history:", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    // ---------------------------------------------------------
    // SUBMIT SOS
    // ---------------------------------------------------------
    const handleSOSSubmit = async (e) => {
        e.preventDefault();
        if (!sosLocation) {
            setSosFeedback({
                type: "error",
                text: "Please detect your GPS location before broadcasting an SOS alert."
            });
            return;
        }

        setSosLoading(true);
        setSosFeedback(null);

        // 1. If device is explicitly offline, immediately package into Bluetooth Mesh packet
        if (!navigator.onLine) {
            const packet = meshService.createOfflineSOS({
                sender_name: user?.full_name || "Emergency Citizen",
                sender_phone: user?.phone || "",
                message: sosMessage.trim(),
                category: sosCategory,
                severity: sosSeverity,
                latitude: sosLocation.latitude,
                longitude: sosLocation.longitude
            });

            setSosFeedback({
                type: "info",
                text: `No Internet Detected: Activated Bluetooth Mesh Mode! SOS stored safely (ID: ${packet.mesh_message_id.slice(0, 16)}...) and actively broadcasting to nearby mobile devices via Bluetooth.`
            });
            setSosMessage("");
            setSosLoading(false);
            return;
        }

        // 2. If online, attempt direct transmission; on failure, automatically save to mesh queue
        try {
            await api.post("/sos", {
                message: sosMessage.trim(),
                category: sosCategory,
                severity: sosSeverity,
                latitude: sosLocation.latitude,
                longitude: sosLocation.longitude
            });

            setSosFeedback({
                type: "success",
                text: "Emergency SOS broadcasted successfully! Responders are notified."
            });
            setSosMessage("");
            fetchMyHistory();
        } catch (err) {
            // Server down or network dropped -> Store in Bluetooth Mesh!
            const packet = meshService.createOfflineSOS({
                sender_name: user?.full_name || "Emergency Citizen",
                sender_phone: user?.phone || "",
                message: sosMessage.trim(),
                category: sosCategory,
                severity: sosSeverity,
                latitude: sosLocation.latitude,
                longitude: sosLocation.longitude
            });

            setSosFeedback({
                type: "info",
                text: `Server unreachable. Automatically switched to Bluetooth Mesh Mode! Your emergency alert is stored locally and broadcasting via Bluetooth to passing devices.`
            });
            setSosMessage("");
        } finally {
            setSosLoading(false);
        }
    };

    // ---------------------------------------------------------
    // SUBMIT RESOURCE REQUEST
    // ---------------------------------------------------------
    const handleResourceSubmit = async (e) => {
        e.preventDefault();
        if (!reqName.trim()) {
            setReqFeedback({ type: "error", text: "Please enter the item name needed." });
            return;
        }

        setReqLoading(true);
        setReqFeedback(null);

        try {
            await api.post("/resource-requests", {
                resource_category: reqCategory,
                resource_name: reqName.trim(),
                quantity_requested: Number(reqQuantity) || 1,
                unit: reqUnit,
                priority: reqPriority,
                notes: reqNotes.trim(),
                latitude: sosLocation?.latitude || 0,
                longitude: sosLocation?.longitude || 0
            });

            setReqFeedback({
                type: "success",
                text: "Resource request submitted successfully! Logistics team will review."
            });
            setReqName("");
            setReqNotes("");
            fetchMyHistory();
        } catch (err) {
            setReqFeedback({
                type: "error",
                text: err.response?.data?.message || "Failed to submit request."
            });
        } finally {
            setReqLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#F8FAFC",
                backgroundImage: "radial-gradient(at 0% 0%, rgba(239, 68, 68, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.08) 0px, transparent 50%)",
                color: "#0F172A",
                pb: 8
            }}
        >
            {/* Top Navigation Bar */}
            <AppBar
                position="static"
                elevation={0}
                sx={{
                    bgcolor: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(20px)",
                    borderBottom: "1px solid rgba(226, 232, 240, 0.8)"
                }}
            >
                <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                            component="img"
                            src="/logo.png"
                            alt="ResilientNet Logo"
                            sx={{ width: 38, height: 38, borderRadius: "10px" }}
                        />
                        <Box>
                            <Typography variant="subtitle1" fontWeight={800} color="#0F172A" lineHeight={1.2}>
                                ResilientNet
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#DC2626", fontWeight: 700 }}>
                                Citizen Emergency Portal
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Chip
                            label={user?.full_name || "Citizen"}
                            size="small"
                            sx={{
                                bgcolor: "#EFF6FF",
                                color: "#1D4ED8",
                                fontWeight: 700,
                                border: "1px solid #BFDBFE"
                            }}
                        />
                        <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={handleLogout}
                            startIcon={<LogoutRoundedIcon />}
                            sx={{
                                borderRadius: "10px",
                                textTransform: "none",
                                fontWeight: 700
                            }}
                        >
                            Sign Out
                        </Button>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: 3 }}>
                {/* Navigation Tabs */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 0.8,
                        borderRadius: "16px",
                        bgcolor: "rgba(255, 255, 255, 0.85)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(226, 232, 240, 0.9)",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                        mb: 3
                    }}
                >
                    <Tabs
                        value={currentTab}
                        onChange={(e, val) => setCurrentTab(val)}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{
                            "& .MuiTabs-indicator": {
                                height: "100%",
                                borderRadius: "12px",
                                bgcolor:
                                    currentTab === 0
                                        ? "#DC2626"
                                        : currentTab === 1
                                        ? "#0284C7"
                                        : currentTab === 2
                                        ? "#2563EB"
                                        : "#059669",
                                zIndex: 0
                            },
                            "& .MuiTab-root": {
                                zIndex: 1,
                                textTransform: "none",
                                fontWeight: 850,
                                fontSize: { xs: "0.85rem", sm: "0.95rem" },
                                color: "#1E293B",
                                minHeight: 48,
                                minWidth: { xs: 130, sm: 160 },
                                px: { xs: 1.5, sm: 2.5 },
                                whiteSpace: "nowrap",
                                "&.Mui-selected": { color: "#FFFFFF !important" }
                            }
                        }}
                    >
                        <Tab label="🚨 Emergency SOS" />
                        <Tab label="📦 Request Supplies" />
                        <Tab label={`📡 Bluetooth Mesh (${meshOutbox.length + meshRelayed.length})`} />
                        <Tab label={`📋 My Status (${mySOSList.length + myResourceList.length})`} />
                    </Tabs>
                </Paper>

                {/* 1. SOS TAB */}
                {currentTab === 0 && (
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: "20px",
                            bgcolor: "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(20px)",
                            border: "1px solid rgba(226, 232, 240, 0.9)",
                            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)"
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                                <WarningAmberRoundedIcon sx={{ color: "#DC2626", fontSize: 34 }} />
                                <Box>
                                    <Typography variant="h6" fontWeight={800} color="#0F172A">
                                        Send Distress SOS Alert
                                    </Typography>
                                    <Typography variant="body2" color="#64748B">
                                        Your distress alert and GPS coordinates will be transmitted directly to rescue teams.
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2.5, borderColor: "#E2E8F0" }} />

                            {sosFeedback && (
                                <Alert
                                    severity={sosFeedback.type}
                                    onClose={() => setSosFeedback(null)}
                                    sx={{ mb: 2.5, borderRadius: "12px" }}
                                >
                                    {sosFeedback.text}
                                </Alert>
                            )}

                            {/* Bluetooth Mesh Relay Banner */}
                            <Box
                                sx={{
                                    mb: 2.5,
                                    p: 2,
                                    borderRadius: "14px",
                                    bgcolor: !navigator.onLine ? "#FFFBEB" : "#F0F9FF",
                                    border: `1.5px solid ${!navigator.onLine ? "#F59E0B" : "#0284C7"}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: 1.5
                                }}
                            >
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box
                                        sx={{
                                            width: 42,
                                            height: 42,
                                            borderRadius: "12px",
                                            bgcolor: !navigator.onLine ? "#D97706" : "#0284C7",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: !navigator.onLine ? "0 4px 12px rgba(217, 119, 6, 0.35)" : "0 4px 12px rgba(2, 132, 199, 0.35)",
                                            flexShrink: 0
                                        }}
                                    >
                                        <BluetoothRoundedIcon sx={{ color: "#FFFFFF", fontSize: 24 }} />
                                    </Box>
                                    <Box>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                            <Typography variant="subtitle2" fontWeight={850} color="#0F172A">
                                                {navigator.onLine ? "Offline-Ready Bluetooth Mesh: ACTIVE" : "Offline Bluetooth Mesh Active (No Internet Required)"}
                                            </Typography>
                                            <Chip
                                                label={navigator.onLine ? "ONLINE + MESH" : "OFFLINE MESH"}
                                                size="small"
                                                sx={{
                                                    bgcolor: navigator.onLine ? "#DCFCE7" : "#FEF3C7",
                                                    color: navigator.onLine ? "#15803D" : "#78350F",
                                                    fontWeight: 850,
                                                    fontSize: "0.72rem",
                                                    border: `1px solid ${navigator.onLine ? "#86EFAC" : "#FDE68A"}`
                                                }}
                                            />
                                        </Stack>
                                        <Typography variant="caption" sx={{ color: "#1E293B !important", fontWeight: 700, mt: 0.3, display: "block" }}>
                                            Node: <strong style={{ color: "#0284C7", fontWeight: 850 }}>{meshStats.nodeId}</strong> • If internet is down, your SOS automatically hops across passing phones until reaching rescue teams.
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => setCurrentTab(2)}
                                    sx={{
                                        borderRadius: "10px",
                                        textTransform: "none",
                                        fontWeight: 850,
                                        fontSize: "0.8rem",
                                        color: "#FFFFFF",
                                        bgcolor: !navigator.onLine ? "#D97706" : "#0284C7",
                                        "&:hover": {
                                            bgcolor: !navigator.onLine ? "#B45309" : "#0369A1"
                                        },
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
                                    }}
                                >
                                    Open Bluetooth Mesh →
                                </Button>
                            </Box>

                            <Box component="form" onSubmit={handleSOSSubmit}>
                                <Stack spacing={2.5}>
                                    {/* GPS Location Box */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: "14px",
                                            bgcolor: "#F8FAFC",
                                            border: "1px solid #E2E8F0",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            flexWrap: "wrap",
                                            gap: 1.5
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                                                Current Emergency Location
                                            </Typography>
                                            <Typography variant="body1" fontWeight={700} color="#0F172A">
                                                {sosLocation
                                                    ? `${sosLocation.latitude}° N, ${sosLocation.longitude}° E (±${sosLocation.accuracy}m)`
                                                    : "GPS Location Not Detected"}
                                            </Typography>
                                        </Box>

                                        <Button
                                            type="button"
                                            variant="outlined"
                                            size="small"
                                            onClick={detectLocation}
                                            disabled={locating}
                                            startIcon={locating ? <CircularProgress size={16} /> : <MyLocationRoundedIcon />}
                                            sx={{
                                                borderRadius: "10px",
                                                textTransform: "none",
                                                fontWeight: 700
                                            }}
                                        >
                                            {locating ? "Locating..." : sosLocation ? "Update GPS" : "Detect GPS"}
                                        </Button>
                                    </Paper>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Emergency Category"
                                                value={sosCategory}
                                                onChange={(e) => setSosCategory(e.target.value)}
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        borderRadius: "14px",
                                                        bgcolor: "#FFFFFF"
                                                    }
                                                }}
                                            >
                                                {["Medical", "Trapped / Rescue", "Flood", "Fire", "Food / Water", "General Distress"].map((cat) => (
                                                    <MenuItem key={cat} value={cat}>
                                                        {cat}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Severity Level"
                                                value={sosSeverity}
                                                onChange={(e) => setSosSeverity(e.target.value)}
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        borderRadius: "14px",
                                                        bgcolor: "#FFFFFF"
                                                    }
                                                }}
                                            >
                                                <MenuItem value="HIGH">🔴 HIGH (Immediate Danger)</MenuItem>
                                                <MenuItem value="MEDIUM">🟡 MEDIUM (Urgent Need)</MenuItem>
                                                <MenuItem value="LOW">🟢 LOW (Precautionary)</MenuItem>
                                            </TextField>
                                        </Grid>
                                    </Grid>

                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Emergency Message / Details"
                                        placeholder="Describe what help you need (e.g. 2 elderly persons trapped on 2nd floor due to floodwater)..."
                                        value={sosMessage}
                                        onChange={(e) => setSosMessage(e.target.value)}
                                        required
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: "14px",
                                                bgcolor: "#FFFFFF"
                                            }
                                        }}
                                    />

                                    <Button
                                        fullWidth
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        disabled={sosLoading || locating || !sosLocation}
                                        startIcon={<WarningAmberRoundedIcon />}
                                        sx={{
                                            minHeight: 52,
                                            borderRadius: "14px",
                                            background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
                                            fontWeight: 800,
                                            fontSize: "1.05rem",
                                            textTransform: "none",
                                            boxShadow: "0 6px 20px rgba(220, 38, 38, 0.35)",
                                            "&:hover": {
                                                background: "linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)"
                                            }
                                        }}
                                    >
                                        {sosLoading ? <CircularProgress size={24} color="inherit" /> : "TRANSMIT EMERGENCY SOS"}
                                    </Button>
                                </Stack>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* 2. RESOURCE REQUEST TAB */}
                {currentTab === 1 && (
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: "20px",
                            bgcolor: "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(20px)",
                            border: "1px solid rgba(226, 232, 240, 0.9)",
                            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)"
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                                <Inventory2RoundedIcon sx={{ color: "#0284C7", fontSize: 34 }} />
                                <Box>
                                    <Typography variant="h6" fontWeight={800} color="#0F172A">
                                        Request Emergency Supplies
                                    </Typography>
                                    <Typography variant="body2" color="#64748B">
                                        Request clean drinking water, food rations, first aid kits, or emergency blankets.
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2.5, borderColor: "#E2E8F0" }} />

                            {reqFeedback && (
                                <Alert
                                    severity={reqFeedback.type}
                                    onClose={() => setReqFeedback(null)}
                                    sx={{ mb: 2.5, borderRadius: "12px" }}
                                >
                                    {reqFeedback.text}
                                </Alert>
                            )}

                            <Box component="form" onSubmit={handleResourceSubmit}>
                                <Stack spacing={2.5}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Supply Category"
                                                value={reqCategory}
                                                onChange={(e) => setReqCategory(e.target.value)}
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        borderRadius: "14px",
                                                        bgcolor: "#FFFFFF"
                                                    }
                                                }}
                                            >
                                                {["Drinking Water", "Food & Rations", "First Aid & Medicine", "Blankets & Shelter", "Hygiene Supplies"].map((cat) => (
                                                    <MenuItem key={cat} value={cat}>
                                                        {cat}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Item Description"
                                                placeholder="e.g. Clean drinking water bottles, Meal packs"
                                                value={reqName}
                                                onChange={(e) => setReqName(e.target.value)}
                                                required
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        borderRadius: "14px",
                                                        bgcolor: "#FFFFFF"
                                                    }
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={6} sm={3}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Quantity"
                                                value={reqQuantity}
                                                onChange={(e) => setReqQuantity(e.target.value)}
                                                inputProps={{ min: 1 }}
                                                required
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        borderRadius: "14px",
                                                        bgcolor: "#FFFFFF"
                                                    }
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={6} sm={3}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Unit"
                                                value={reqUnit}
                                                onChange={(e) => setReqUnit(e.target.value)}
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        borderRadius: "14px",
                                                        bgcolor: "#FFFFFF"
                                                    }
                                                }}
                                            >
                                                {["Packs", "Bottles", "Kits", "Boxes", "Units"].map((u) => (
                                                    <MenuItem key={u} value={u}>
                                                        {u}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Urgency"
                                                value={reqPriority}
                                                onChange={(e) => setReqPriority(e.target.value)}
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        borderRadius: "14px",
                                                        bgcolor: "#FFFFFF"
                                                    }
                                                }}
                                            >
                                                <MenuItem value="CRITICAL">🔴 Critical (Immediate Life Need)</MenuItem>
                                                <MenuItem value="HIGH">🟡 High (Needed within 24h)</MenuItem>
                                                <MenuItem value="MEDIUM">🟢 Medium (Low Urgency)</MenuItem>
                                            </TextField>
                                        </Grid>
                                    </Grid>

                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        label="Special Instructions / Medical Notes"
                                        placeholder="e.g. 1 infant present, needs baby formula; 1 senior needs insulin..."
                                        value={reqNotes}
                                        onChange={(e) => setReqNotes(e.target.value)}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: "14px",
                                                bgcolor: "#FFFFFF"
                                            }
                                        }}
                                    />

                                    <Button
                                        fullWidth
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        disabled={reqLoading}
                                        startIcon={<Inventory2RoundedIcon />}
                                        sx={{
                                            minHeight: 50,
                                            borderRadius: "14px",
                                            background: "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)",
                                            fontWeight: 800,
                                            fontSize: "1rem",
                                            textTransform: "none",
                                            boxShadow: "0 6px 20px rgba(2, 132, 199, 0.3)",
                                            "&:hover": {
                                                background: "linear-gradient(135deg, #0369A1 0%, #0284C7 100%)"
                                            }
                                        }}
                                    >
                                        {reqLoading ? <CircularProgress size={24} color="inherit" /> : "Submit Resource Request"}
                                    </Button>
                                </Stack>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* 2. BLUETOOTH MESH RADAR & RELAY TRACKER */}
                {currentTab === 2 && (
                    <Stack spacing={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, sm: 3 },
                                borderRadius: "20px",
                                bgcolor: "#FFFFFF",
                                border: "1.5px solid #CBD5E1",
                                boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
                            }}
                        >
                            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 2.5 }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <BluetoothRoundedIcon sx={{ color: "#FFFFFF", fontSize: 26 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight={850} color="#0F172A">
                                            Bluetooth Offline Mesh Relay
                                        </Typography>
                                        <Typography variant="body2" color="#1E293B" fontWeight={650}>
                                            Node ID: <strong style={{ color: "#0284C7", fontWeight: 850 }}>{meshStats.nodeId}</strong> • When offline, messages hop from phone to phone
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
                                        sx={{ borderRadius: "10px", bgcolor: "#D97706", color: "#FFFFFF", textTransform: "none", fontWeight: 800, "&:hover": { bgcolor: "#B45309" } }}
                                    >
                                        Simulate Passing Phone Hop
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => meshService.flushMeshQueueToServer()}
                                        startIcon={<RefreshRoundedIcon />}
                                        sx={{ borderRadius: "10px", bgcolor: "#0284C7", color: "#FFFFFF", textTransform: "none", fontWeight: 800, "&:hover": { bgcolor: "#0369A1" } }}
                                    >
                                        Sync Gateway
                                    </Button>
                                </Stack>
                            </Stack>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ p: 2, borderRadius: "14px", bgcolor: "#FEF2F2", border: "1.5px solid #FECACA" }}>
                                        <Typography variant="caption" color="#991B1B" fontWeight={850}>MY LOCAL OUTBOX</Typography>
                                        <Typography variant="h5" fontWeight={900} color="#7F1D1D" sx={{ my: 0.5 }}>{meshOutbox.length}</Typography>
                                        <Typography variant="body2" color="#991B1B" fontWeight={700}>SOS packets stored on this device</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ p: 2, borderRadius: "14px", bgcolor: "#F0F9FF", border: "1.5px solid #BAE6FD" }}>
                                        <Typography variant="caption" color="#0369A1" fontWeight={850}>RELAY CARRIER QUEUE</Typography>
                                        <Typography variant="h5" fontWeight={900} color="#0C4A6E" sx={{ my: 0.5 }}>{meshRelayed.length}</Typography>
                                        <Typography variant="body2" color="#0369A1" fontWeight={700}>Carried packets for other citizens</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Box sx={{ p: 2, borderRadius: "14px", bgcolor: navigator.onLine ? "#F0FDF4" : "#FFFBEB", border: `1.5px solid ${navigator.onLine ? "#BBF7D0" : "#FDE68A"}` }}>
                                        <Typography variant="caption" color={navigator.onLine ? "#166534" : "#92400E"} fontWeight={850}>GATEWAY UPLINK</Typography>
                                        <Typography variant="h5" fontWeight={900} color={navigator.onLine ? "#14532D" : "#78350F"} sx={{ my: 0.5 }}>
                                            {navigator.onLine ? "Online (Uplink)" : "Offline (Relaying)"}
                                        </Typography>
                                        <Typography variant="body2" color={navigator.onLine ? "#166534" : "#92400E"} fontWeight={700}>
                                            {navigator.onLine ? "Auto-syncs packets to HQ" : "Broadcasting via BLE"}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Packet List */}
                            <Typography variant="subtitle2" fontWeight={850} color="#0F172A" sx={{ mb: 1.5 }}>
                                Active Emergency Mesh Packets ({meshOutbox.length + meshRelayed.length})
                            </Typography>

                            {meshOutbox.length === 0 && meshRelayed.length === 0 ? (
                                <Box sx={{ py: 4, px: 2, textAlign: "center", bgcolor: "#F8FAFC", borderRadius: "14px", border: "2px dashed #94A3B8" }}>
                                    <HubRoundedIcon sx={{ fontSize: 44, color: "#475569", mb: 1 }} />
                                    <Typography variant="subtitle1" color="#0F172A" fontWeight={800}>Mesh Buffer is Clear</Typography>
                                    <Typography variant="body2" color="#334155" fontWeight={650} sx={{ mt: 0.5 }}>
                                        When you send an SOS without internet, it will safely store here and actively hop across passing mobile devices.
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack spacing={1.5}>
                                    {[...meshOutbox, ...meshRelayed].map((pkt) => (
                                        <Paper
                                            key={pkt.mesh_message_id}
                                            sx={{
                                                p: 2,
                                                borderRadius: "14px",
                                                bgcolor: "#F8FAFC",
                                                border: "1.5px solid #CBD5E1",
                                                display: "flex",
                                                flexDirection: { xs: "column", sm: "row" },
                                                justifyContent: "space-between",
                                                alignItems: { xs: "flex-start", sm: "center" },
                                                gap: 1.5
                                            }}
                                        >
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }} flexWrap="wrap">
                                                    <Chip
                                                        label={pkt.origin_node === meshStats.nodeId ? "MY SOS" : "CARRIED RELAY"}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: pkt.origin_node === meshStats.nodeId ? "#FEE2E2" : "#E0F2FE",
                                                            color: pkt.origin_node === meshStats.nodeId ? "#B91C1C" : "#0369A1",
                                                            fontWeight: 850,
                                                            fontSize: "0.72rem"
                                                        }}
                                                    />
                                                    <Chip
                                                        label={`${pkt.hops || 0} HOPS`}
                                                        size="small"
                                                        sx={{ bgcolor: "#E2E8F0", color: "#1E293B", fontWeight: 800, fontSize: "0.72rem" }}
                                                    />
                                                    <Chip
                                                        label={pkt.status === "DELIVERED_TO_RESCUE_HQ" ? "DELIVERED TO HQ" : "IN TRANSIT / BROADCASTING"}
                                                        size="small"
                                                        icon={pkt.status === "DELIVERED_TO_RESCUE_HQ" ? <CheckCircleRoundedIcon sx={{ fontSize: "16px !important", color: "#15803D !important" }} /> : <BluetoothRoundedIcon sx={{ fontSize: "16px !important", color: "#B45309 !important" }} />}
                                                        sx={{
                                                            bgcolor: pkt.status === "DELIVERED_TO_RESCUE_HQ" ? "#DCFCE7" : "#FEF3C7",
                                                            color: pkt.status === "DELIVERED_TO_RESCUE_HQ" ? "#14532D" : "#78350F",
                                                            fontWeight: 850,
                                                            fontSize: "0.72rem"
                                                        }}
                                                    />
                                                </Stack>
                                                <Typography variant="body1" fontWeight={800} color="#0F172A">
                                                    {pkt.message}
                                                </Typography>
                                                <Typography variant="body2" color="#334155" fontWeight={700} sx={{ mt: 0.5, display: "block" }}>
                                                    Path: {(pkt.hop_path || [meshStats.nodeId]).join(" ──BLE──> ")}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Paper>
                    </Stack>
                )}

                {/* 3. MY STATUS TRACKER */}
                {currentTab === 3 && (
                    <Stack spacing={3}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="h6" fontWeight={800} color="#0F172A">
                                My Active Emergency Requests
                            </Typography>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={fetchMyHistory}
                                disabled={historyLoading}
                                startIcon={<RefreshRoundedIcon />}
                                sx={{
                                    borderRadius: "10px",
                                    textTransform: "none",
                                    fontWeight: 700
                                }}
                            >
                                {historyLoading ? "Refreshing..." : "Refresh Status"}
                            </Button>
                        </Box>

                        {/* SOS Reports Section */}
                        <Typography variant="subtitle2" fontWeight={800} color="#DC2626" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                            Distress SOS Alerts ({mySOSList.length})
                        </Typography>

                        {mySOSList.length === 0 ? (
                            <Paper elevation={0} sx={{ p: 3, borderRadius: "14px", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", textAlign: "center" }}>
                                <Typography color="#64748B">No emergency SOS alerts submitted by your account.</Typography>
                            </Paper>
                        ) : (
                            mySOSList.map((sos) => (
                                <Paper
                                    key={sos.id}
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: "16px",
                                        bgcolor: "#FFFFFF",
                                        border: "1px solid #E2E8F0",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        flexWrap: "wrap",
                                        gap: 2
                                    }}
                                >
                                    <Box sx={{ maxWidth: "70%" }}>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                            <Chip
                                                label={sos.category}
                                                size="small"
                                                sx={{ bgcolor: "#FEE2E2", color: "#DC2626", fontWeight: 700 }}
                                            />
                                            <Typography variant="caption" color="#64748B">
                                                {new Date(sos.created_at).toLocaleString()}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="body1" fontWeight={700} color="#0F172A" sx={{ mb: 0.5 }}>
                                            {sos.message}
                                        </Typography>
                                        <Typography variant="caption" color="#0284C7" fontWeight={600}>
                                            📍 Location: {sos.latitude}° N, {sos.longitude}° E
                                        </Typography>
                                    </Box>

                                    <Chip
                                        label={
                                            sos.status === "RESOLVED"
                                                ? "Resolved / Rescued"
                                                : sos.status === "ASSIGNED"
                                                ? "Responders En Route"
                                                : "Active Alert / Dispatching"
                                        }
                                        sx={{
                                            fontWeight: 800,
                                            bgcolor:
                                                sos.status === "RESOLVED"
                                                    ? "#D1FAE5"
                                                    : sos.status === "ASSIGNED"
                                                    ? "#E0F2FE"
                                                    : "#FEE2E2",
                                            color:
                                                sos.status === "RESOLVED"
                                                    ? "#059669"
                                                    : sos.status === "ASSIGNED"
                                                    ? "#0284C7"
                                                    : "#DC2626"
                                        }}
                                    />
                                </Paper>
                            ))
                        )}

                        {/* Resource Requests Section */}
                        <Typography variant="subtitle2" fontWeight={800} color="#0284C7" sx={{ textTransform: "uppercase", letterSpacing: 0.5, mt: 2 }}>
                            Emergency Supply Requests ({myResourceList.length})
                        </Typography>

                        {myResourceList.length === 0 ? (
                            <Paper elevation={0} sx={{ p: 3, borderRadius: "14px", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", textAlign: "center" }}>
                                <Typography color="#64748B">No supply requests submitted by your account.</Typography>
                            </Paper>
                        ) : (
                            myResourceList.map((req) => (
                                <Paper
                                    key={req.id}
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: "16px",
                                        bgcolor: "#FFFFFF",
                                        border: "1px solid #E2E8F0",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        flexWrap: "wrap",
                                        gap: 2
                                    }}
                                >
                                    <Box sx={{ maxWidth: "70%" }}>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                            <Chip
                                                label={req.resource_category}
                                                size="small"
                                                sx={{ bgcolor: "#E0F2FE", color: "#0284C7", fontWeight: 700 }}
                                            />
                                            <Typography variant="caption" color="#64748B">
                                                {new Date(req.requested_at).toLocaleString()}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="body1" fontWeight={700} color="#0F172A">
                                            {req.resource_name} — {req.quantity_requested} {req.unit}
                                        </Typography>
                                        {req.notes && (
                                            <Typography variant="body2" color="#64748B" sx={{ mt: 0.5 }}>
                                                Notes: {req.notes}
                                            </Typography>
                                        )}
                                    </Box>

                                    <Chip
                                        label={
                                            req.status === "FULFILLED"
                                                ? "Delivered"
                                                : req.status === "ALLOCATED"
                                                ? "Supplies Allocated"
                                                : "Requested / Pending"
                                        }
                                        sx={{
                                            fontWeight: 800,
                                            bgcolor:
                                                req.status === "FULFILLED"
                                                    ? "#D1FAE5"
                                                    : req.status === "ALLOCATED"
                                                    ? "#E0F2FE"
                                                    : "#FEF3C7",
                                            color:
                                                req.status === "FULFILLED"
                                                    ? "#059669"
                                                    : req.status === "ALLOCATED"
                                                    ? "#0284C7"
                                                    : "#D97706"
                                        }}
                                    />
                                </Paper>
                            ))
                        )}
                    </Stack>
                )}
            </Container>
        </Box>
    );
};

export default CitizenDashboard;