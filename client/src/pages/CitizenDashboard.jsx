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

import api from "../api/api";

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

    // Auto-detect GPS on initial load
    useEffect(() => {
        detectLocation();
        fetchMyHistory();
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
            setSosFeedback({
                type: "error",
                text: err.response?.data?.message || "Failed to transmit SOS. Please retry."
            });
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
                        variant="fullWidth"
                        sx={{
                            "& .MuiTabs-indicator": {
                                height: "100%",
                                borderRadius: "12px",
                                bgcolor:
                                    currentTab === 0
                                        ? "#DC2626"
                                        : currentTab === 1
                                        ? "#0284C7"
                                        : "#059669",
                                zIndex: 0
                            },
                            "& .MuiTab-root": {
                                zIndex: 1,
                                textTransform: "none",
                                fontWeight: 800,
                                fontSize: "0.95rem",
                                color: "#64748B",
                                minHeight: 46,
                                "&.Mui-selected": { color: "#FFFFFF" }
                            }
                        }}
                    >
                        <Tab label="🚨 Emergency SOS" />
                        <Tab label="📦 Request Supplies" />
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

                {/* 3. MY STATUS TRACKER */}
                {currentTab === 2 && (
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