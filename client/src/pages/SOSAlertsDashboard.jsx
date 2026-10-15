import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";

import DashboardLayout from "../layouts/DashboardLayout";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import BluetoothRoundedIcon from "@mui/icons-material/BluetoothRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";

import socket from "../services/socket";
import { API_BASE_URL } from "../config/apiConfig";

const SOSAlertsDashboard = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    // Filters
    const [search, setSearch] = useState("");
    const [severityFilter, setSeverityFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");

    // Incident resolution & Mesh Trace
    const [resolvingId, setResolvingId] = useState(null);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [selectedMeshAlert, setSelectedMeshAlert] = useState(null);
    const [meshFilterOnly, setMeshFilterOnly] = useState(false);

    const token = localStorage.getItem("token");

    // -------------------------------------------------------------
    // FETCH ALERTS
    // -------------------------------------------------------------
    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`${API_BASE_URL}/sos`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to load SOS alerts");
            }

            const data = await response.json();
            setAlerts(Array.isArray(data) ? data : []);
            setLastUpdated(new Date().toLocaleTimeString());
        } catch (err) {
            console.error("Error fetching SOS alerts:", err);
            setError(err.message || "Failed to load emergency SOS alerts");
        } finally {
            setLoading(false);
        }
    }, [token]);

    // -------------------------------------------------------------
    // REALTIME SOCKET LISTENERS
    // -------------------------------------------------------------
    useEffect(() => {
        fetchAlerts();

        const handleNewSOS = (newAlert) => {
            if (!newAlert?.id) return;
            setAlerts((prev) => {
                if (prev.some((a) => String(a.id) === String(newAlert.id))) {
                    return prev;
                }
                return [newAlert, ...prev];
            });
            setLastUpdated(new Date().toLocaleTimeString());
        };

        if (socket) {
            socket.on("newSOS", handleNewSOS);
        }

        return () => {
            if (socket) {
                socket.off("newSOS", handleNewSOS);
            }
        };
    }, [fetchAlerts]);

    // -------------------------------------------------------------
    // RESOLVE INCIDENT
    // -------------------------------------------------------------
    const handleResolve = async (alertItem) => {
        const incidentId = alertItem.incident_id || alertItem.id;
        if (!incidentId) return;

        setResolvingId(alertItem.id);
        setError("");
        setSuccessMsg("");

        try {
            const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}/resolve`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to resolve incident");
            }

            // Update local state
            setAlerts((prev) =>
                prev.map((a) =>
                    a.id === alertItem.id || a.incident_id === incidentId
                        ? { ...a, status: "RESOLVED" }
                        : a
                )
            );
            setSuccessMsg(`Incident #${String(incidentId).slice(0, 8)} successfully marked as RESOLVED.`);
            setSelectedAlert(null);
        } catch (err) {
            console.error("Resolve error:", err);
            setError(err.message || "Could not mark incident as resolved.");
        } finally {
            setResolvingId(null);
        }
    };

    // -------------------------------------------------------------
    // FILTERED ALERTS
    // -------------------------------------------------------------
    const filteredAlerts = useMemo(() => {
        return alerts.filter((item) => {
            const query = search.trim().toLowerCase();
            const matchesSearch =
                !query ||
                item.message?.toLowerCase().includes(query) ||
                item.sender_name?.toLowerCase().includes(query) ||
                item.category?.toLowerCase().includes(query);

            const matchesSeverity =
                severityFilter === "ALL" ||
                String(item.severity).toUpperCase() === severityFilter;

            const matchesStatus =
                statusFilter === "ALL" ||
                String(item.status || "NEW").toUpperCase() === statusFilter;

            const matchesCategory =
                categoryFilter === "ALL" ||
                String(item.category).toUpperCase() === categoryFilter.toUpperCase();

            const matchesMesh =
                !meshFilterOnly || Boolean(item.is_mesh_relay || item.mesh_message_id);

            return matchesSearch && matchesSeverity && matchesStatus && matchesCategory && matchesMesh;
        });
    }, [alerts, search, severityFilter, statusFilter, categoryFilter, meshFilterOnly]);

    // -------------------------------------------------------------
    // METRICS SUMMARY
    // -------------------------------------------------------------
    const metrics = useMemo(() => {
        const total = alerts.length;
        const critical = alerts.filter((a) => String(a.severity).toUpperCase() === "HIGH").length;
        const active = alerts.filter((a) => String(a.status || "NEW").toUpperCase() === "NEW").length;
        const resolved = alerts.filter((a) => String(a.status).toUpperCase() === "RESOLVED").length;
        const meshRelays = alerts.filter((a) => Boolean(a.is_mesh_relay || a.mesh_message_id)).length;
        return { total, critical, active, resolved, meshRelays };
    }, [alerts]);

    // Unique categories for filter dropdown
    const availableCategories = useMemo(() => {
        const set = new Set();
        alerts.forEach((a) => {
            if (a.category) set.add(String(a.category).trim().toUpperCase());
        });
        return Array.from(set);
    }, [alerts]);

    // Format helper
    const formatTimestamp = (iso) => {
        if (!iso) return "Just now";
        try {
            const d = new Date(iso);
            return d.toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return "Recently";
        }
    };

    const getSeverityStyles = (sev) => {
        const val = String(sev || "").toUpperCase();
        if (val === "HIGH" || val === "CRITICAL") {
            return {
                bg: "rgba(239, 68, 68, 0.12)",
                color: "#DC2626",
                border: "rgba(239, 68, 68, 0.3)",
                label: "CRITICAL HIGH"
            };
        }
        if (val === "MEDIUM") {
            return {
                bg: "rgba(245, 158, 11, 0.12)",
                color: "#D97706",
                border: "rgba(245, 158, 11, 0.3)",
                label: "MEDIUM"
            };
        }
        return {
            bg: "rgba(16, 185, 129, 0.12)",
            color: "#059669",
            border: "rgba(16, 185, 129, 0.3)",
            label: "LOW"
        };
    };

    const getStatusStyles = (status) => {
        const val = String(status || "NEW").toUpperCase();
        if (val === "RESOLVED") {
            return { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0", label: "Resolved & Secured" };
        }
        if (val === "ASSIGNED" || val === "IN_PROGRESS") {
            return { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE", label: "Responder Dispatched" };
        }
        return { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", label: "Active Distress (NEW)" };
    };

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
                    {/* Header Banner */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: { xs: "flex-start", sm: "center" },
                            flexDirection: { xs: "column", sm: "row" },
                            gap: 2,
                            mb: 3.5
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                                component="img"
                                src="/logo.png"
                                alt="ResilientNet Logo"
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: "16px",
                                    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.15)",
                                    objectFit: "cover"
                                }}
                            />

                            <Box>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Typography variant="h5" fontWeight={850} color="#0F172A" letterSpacing="-0.5px">
                                        Emergency SOS Triage Center
                                    </Typography>
                                    <Chip
                                        label="LIVE STREAM"
                                        size="small"
                                        sx={{
                                            bgcolor: "#DC2626",
                                            color: "#FFFFFF",
                                            fontWeight: 800,
                                            fontSize: "0.68rem",
                                            height: 22,
                                            animation: "pulse 2s infinite",
                                            "@keyframes pulse": {
                                                "0%": { opacity: 1 },
                                                "50%": { opacity: 0.6 },
                                                "100%": { opacity: 1 }
                                            }
                                        }}
                                    />
                                </Stack>
                                <Typography variant="body2" color="#64748B" fontWeight={500}>
                                    Real-time distress broadcasts, live GPS telemetry, and incident triage
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={1.5} alignItems="center">
                            {lastUpdated && (
                                <Chip
                                    label={`Synced: ${lastUpdated}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontWeight: 650, color: "#64748B", borderColor: "#E2E8F0" }}
                                />
                            )}

                            <Button
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshRoundedIcon />}
                                onClick={fetchAlerts}
                                disabled={loading}
                                sx={{
                                    bgcolor: "#0F172A",
                                    borderRadius: "12px",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    px: 2.2,
                                    "&:hover": { bgcolor: "#1E293B" }
                                }}
                            >
                                Refresh Triage
                            </Button>
                        </Stack>
                    </Box>

                    {/* Feedback Alerts */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: "14px" }} onClose={() => setError("")}>
                            {error}
                        </Alert>
                    )}
                    {successMsg && (
                        <Alert severity="success" sx={{ mb: 3, borderRadius: "14px" }} onClose={() => setSuccessMsg("")}>
                            {successMsg}
                        </Alert>
                    )}

                    {/* Summary Metrics Cards */}
                    <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: "20px",
                                    border: "1px solid #E2E8F0",
                                    bgcolor: "#FFFFFF",
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="#64748B" fontWeight={700}>
                                        TOTAL CALLS
                                    </Typography>
                                    <Box sx={{ p: 1, borderRadius: "12px", bgcolor: "#F1F5F9", color: "#475569" }}>
                                        <NotificationsActiveRoundedIcon fontSize="small" />
                                    </Box>
                                </Stack>
                                <Typography variant="h4" fontWeight={900} sx={{ mt: 1.5, color: "#0F172A" }}>
                                    {metrics.total}
                                </Typography>
                                <Typography variant="caption" color="#94A3B8" fontWeight={600}>
                                    All logged reports
                                </Typography>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: "20px",
                                    border: "1px solid rgba(220, 38, 38, 0.2)",
                                    bgcolor: "rgba(254, 242, 242, 0.5)",
                                    boxShadow: "0 2px 10px rgba(220, 38, 38, 0.05)"
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="#DC2626" fontWeight={750}>
                                        HIGH / CRITICAL
                                    </Typography>
                                    <Box sx={{ p: 1, borderRadius: "12px", bgcolor: "#FEE2E2", color: "#DC2626" }}>
                                        <WarningAmberRoundedIcon fontSize="small" />
                                    </Box>
                                </Stack>
                                <Typography variant="h4" fontWeight={900} sx={{ mt: 1.5, color: "#DC2626" }}>
                                    {metrics.critical}
                                </Typography>
                                <Typography variant="caption" color="#DC2626" fontWeight={600}>
                                    Urgent rescue needed
                                </Typography>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: "20px",
                                    border: "1px solid rgba(245, 158, 11, 0.2)",
                                    bgcolor: "rgba(255, 251, 235, 0.6)",
                                    boxShadow: "0 2px 10px rgba(245, 158, 11, 0.05)"
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="#D97706" fontWeight={750}>
                                        PENDING
                                    </Typography>
                                    <Box sx={{ p: 1, borderRadius: "12px", bgcolor: "#FEF3C7", color: "#D97706" }}>
                                        <ShieldRoundedIcon fontSize="small" />
                                    </Box>
                                </Stack>
                                <Typography variant="h4" fontWeight={900} sx={{ mt: 1.5, color: "#D97706" }}>
                                    {metrics.active}
                                </Typography>
                                <Typography variant="caption" color="#B45309" fontWeight={600}>
                                    Awaiting dispatch
                                </Typography>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: "20px",
                                    border: "1px solid rgba(16, 185, 129, 0.2)",
                                    bgcolor: "rgba(240, 253, 244, 0.6)",
                                    boxShadow: "0 2px 10px rgba(16, 185, 129, 0.05)"
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="#059669" fontWeight={750}>
                                        RESOLVED
                                    </Typography>
                                    <Box sx={{ p: 1, borderRadius: "12px", bgcolor: "#D1FAE5", color: "#059669" }}>
                                        <CheckCircleRoundedIcon fontSize="small" />
                                    </Box>
                                </Stack>
                                <Typography variant="h4" fontWeight={900} sx={{ mt: 1.5, color: "#059669" }}>
                                    {metrics.resolved}
                                </Typography>
                                <Typography variant="caption" color="#059669" fontWeight={600}>
                                    Evacuated & safe
                                </Typography>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                            <Card
                                elevation={0}
                                onClick={() => setMeshFilterOnly(!meshFilterOnly)}
                                sx={{
                                    p: 2.5,
                                    borderRadius: "20px",
                                    border: `1.5px solid ${meshFilterOnly ? "#0284C7" : "rgba(2, 132, 199, 0.25)"}`,
                                    bgcolor: meshFilterOnly ? "rgba(2, 132, 199, 0.12)" : "rgba(240, 249, 255, 0.7)",
                                    boxShadow: "0 2px 10px rgba(2, 132, 199, 0.08)",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    "&:hover": {
                                        borderColor: "#0284C7",
                                        transform: "translateY(-2px)"
                                    }
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="#0369A1" fontWeight={750}>
                                        BLE MESH RELAYS
                                    </Typography>
                                    <Box sx={{ p: 1, borderRadius: "12px", bgcolor: "#E0F2FE", color: "#0284C7" }}>
                                        <BluetoothRoundedIcon fontSize="small" />
                                    </Box>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mt: 1.5 }}>
                                    <Typography variant="h4" fontWeight={900} sx={{ color: "#0284C7" }}>
                                        {metrics.meshRelays}
                                    </Typography>
                                    {meshFilterOnly && (
                                        <Chip label="FILTERED" size="small" sx={{ bgcolor: "#0284C7", color: "#FFF", fontSize: "0.62rem", fontWeight: 800, height: 18 }} />
                                    )}
                                </Stack>
                                <Typography variant="caption" color="#0369A1" fontWeight={600}>
                                    Offline P2P Store & Forward
                                </Typography>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Filter & Search Bar */}
                    <Card
                        elevation={0}
                        sx={{
                            p: 2.5,
                            mb: 3.5,
                            borderRadius: "20px",
                            border: "1px solid #E2E8F0",
                            bgcolor: "#FFFFFF"
                        }}
                    >
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search distress message, citizen name, or location..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchRoundedIcon sx={{ color: "#94A3B8" }} />
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "12px",
                                            bgcolor: "#F8FAFC"
                                        }
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Severity</InputLabel>
                                    <Select
                                        value={severityFilter}
                                        label="Severity"
                                        onChange={(e) => setSeverityFilter(e.target.value)}
                                        sx={{ borderRadius: "12px", bgcolor: "#F8FAFC" }}
                                    >
                                        <MenuItem value="ALL">All Severities</MenuItem>
                                        <MenuItem value="HIGH">Critical / High</MenuItem>
                                        <MenuItem value="MEDIUM">Medium</MenuItem>
                                        <MenuItem value="LOW">Low</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        label="Status"
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        sx={{ borderRadius: "12px", bgcolor: "#F8FAFC" }}
                                    >
                                        <MenuItem value="ALL">All Statuses</MenuItem>
                                        <MenuItem value="NEW">Active (New)</MenuItem>
                                        <MenuItem value="ASSIGNED">Assigned</MenuItem>
                                        <MenuItem value="RESOLVED">Resolved</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={categoryFilter}
                                        label="Category"
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        sx={{ borderRadius: "12px", bgcolor: "#F8FAFC" }}
                                    >
                                        <MenuItem value="ALL">All Categories</MenuItem>
                                        {availableCategories.map((c) => (
                                            <MenuItem key={c} value={c}>
                                                {c}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <Button
                                    fullWidth
                                    variant={meshFilterOnly ? "contained" : "outlined"}
                                    onClick={() => setMeshFilterOnly(!meshFilterOnly)}
                                    startIcon={<BluetoothRoundedIcon />}
                                    sx={{
                                        borderRadius: "12px",
                                        height: 40,
                                        textTransform: "none",
                                        fontWeight: 800,
                                        fontSize: "0.78rem",
                                        bgcolor: meshFilterOnly ? "#0284C7" : "rgba(2, 132, 199, 0.05)",
                                        borderColor: "#0284C7",
                                        color: meshFilterOnly ? "#FFFFFF" : "#0284C7",
                                        "&:hover": {
                                            bgcolor: meshFilterOnly ? "#0369A1" : "rgba(2, 132, 199, 0.12)"
                                        }
                                    }}
                                >
                                    {meshFilterOnly ? "All Alerts" : `Mesh Only (${metrics.meshRelays})`}
                                </Button>
                            </Grid>
                        </Grid>
                    </Card>

                    {/* Alerts Grid / Triage Board */}
                    {loading && alerts.length === 0 ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                            <CircularProgress size={44} sx={{ color: "#DC2626" }} />
                        </Box>
                    ) : filteredAlerts.length === 0 ? (
                        <Card
                            elevation={0}
                            sx={{
                                p: 6,
                                textAlign: "center",
                                borderRadius: "20px",
                                border: "1px dashed #CBD5E1",
                                bgcolor: "#F8FAFC"
                            }}
                        >
                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    mx: "auto",
                                    mb: 2,
                                    borderRadius: "50%",
                                    bgcolor: "#E2E8F0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#64748B"
                                }}
                            >
                                <CheckCircleRoundedIcon sx={{ fontSize: 36, color: "#10B981" }} />
                            </Box>
                            <Typography variant="h6" fontWeight={750} color="#0F172A">
                                No Emergency Alerts Found
                            </Typography>
                            <Typography variant="body2" color="#64748B" sx={{ mt: 0.5, maxWidth: 420, mx: "auto" }}>
                                All active distress reports have been triaged or no records match your filter criteria.
                            </Typography>
                        </Card>
                    ) : (
                        <Grid container spacing={3}>
                            {filteredAlerts.map((item) => {
                                const sevStyle = getSeverityStyles(item.severity);
                                const statStyle = getStatusStyles(item.status);
                                const hasCoords = item.latitude && item.longitude;
                                const isResolved = String(item.status).toUpperCase() === "RESOLVED";

                                return (
                                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={item.id}>
                                        <Card
                                            elevation={0}
                                            sx={{
                                                height: "100%",
                                                display: "flex",
                                                flexDirection: "column",
                                                borderRadius: "20px",
                                                border: `1.5px solid ${item.severity === "HIGH" ? "rgba(220, 38, 38, 0.3)" : "#E2E8F0"}`,
                                                bgcolor: "#FFFFFF",
                                                boxShadow: item.severity === "HIGH"
                                                    ? "0 4px 20px rgba(220, 38, 38, 0.08)"
                                                    : "0 2px 10px rgba(0,0,0,0.03)",
                                                transition: "all 0.2s ease-in-out",
                                                "&:hover": {
                                                    boxShadow: "0 8px 26px rgba(0,0,0,0.08)",
                                                    transform: "translateY(-2px)"
                                                }
                                            }}
                                        >
                                            <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
                                                {/* Header row: Severity, BLE Mesh badge, and Status */}
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Chip
                                                            label={sevStyle.label}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: sevStyle.bg,
                                                                color: sevStyle.color,
                                                                border: `1px solid ${sevStyle.border}`,
                                                                fontWeight: 800,
                                                                fontSize: "0.72rem",
                                                                letterSpacing: "0.4px"
                                                            }}
                                                        />

                                                        {Boolean(item.is_mesh_relay || item.mesh_message_id) && (
                                                            <Chip
                                                                icon={<BluetoothRoundedIcon sx={{ fontSize: "14px !important", color: "#0284C7 !important" }} />}
                                                                label={item.hops ? `BLE MESH (${item.hops} HOPS)` : "BLE MESH RELAY"}
                                                                size="small"
                                                                onClick={() => setSelectedMeshAlert(item)}
                                                                clickable
                                                                sx={{
                                                                    bgcolor: "rgba(2, 132, 199, 0.12)",
                                                                    color: "#0284C7",
                                                                    border: "1px solid rgba(2, 132, 199, 0.35)",
                                                                    fontWeight: 800,
                                                                    fontSize: "0.68rem",
                                                                    cursor: "pointer",
                                                                    "&:hover": {
                                                                        bgcolor: "rgba(2, 132, 199, 0.22)"
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    </Stack>

                                                    <Chip
                                                        label={statStyle.label}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: statStyle.bg,
                                                            color: statStyle.color,
                                                            border: `1px solid ${statStyle.border}`,
                                                            fontWeight: 750,
                                                            fontSize: "0.72rem"
                                                        }}
                                                    />
                                                </Stack>

                                                {/* Category & Sender */}
                                                <Box sx={{ mb: 1.5 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                                                        <Chip
                                                            label={item.category || "EMERGENCY"}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: "#0F172A",
                                                                color: "#FFFFFF",
                                                                fontWeight: 800,
                                                                fontSize: "0.68rem"
                                                            }}
                                                        />
                                                        <Typography variant="caption" color="#64748B" fontWeight={600}>
                                                            {formatTimestamp(item.created_at)}
                                                        </Typography>
                                                    </Stack>

                                                    <Typography
                                                        variant="h6"
                                                        fontWeight={800}
                                                        color="#0F172A"
                                                        sx={{
                                                            fontSize: "1.05rem",
                                                            lineHeight: 1.35,
                                                            mb: 1
                                                        }}
                                                    >
                                                        {item.message}
                                                    </Typography>
                                                </Box>

                                                {/* Sender info */}
                                                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
                                                    <Avatar
                                                        sx={{
                                                            width: 28,
                                                            height: 28,
                                                            bgcolor: "#F1F5F9",
                                                            color: "#475569",
                                                            fontSize: "0.75rem",
                                                            fontWeight: 750
                                                        }}
                                                    >
                                                        {(item.sender_name || "C")[0].toUpperCase()}
                                                    </Avatar>
                                                    <Typography variant="body2" color="#475569" fontWeight={650}>
                                                        {item.sender_name || "Anonymous Citizen"}
                                                    </Typography>
                                                </Stack>

                                                {/* GPS Coordinates preview */}
                                                {hasCoords && (
                                                    <Box
                                                        sx={{
                                                            p: 1.2,
                                                            mb: 2.5,
                                                            borderRadius: "12px",
                                                            bgcolor: "#F8FAFC",
                                                            border: "1px solid #E2E8F0",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between"
                                                        }}
                                                    >
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <LocationOnRoundedIcon sx={{ color: "#EF4444", fontSize: 18 }} />
                                                            <Typography variant="caption" color="#334155" fontWeight={700}>
                                                                {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                                                            </Typography>
                                                        </Stack>

                                                        <Button
                                                            size="small"
                                                            component="a"
                                                            href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            endIcon={<OpenInNewRoundedIcon sx={{ fontSize: "14px !important" }} />}
                                                            sx={{
                                                                fontSize: "0.72rem",
                                                                fontWeight: 700,
                                                                textTransform: "none",
                                                                color: "#0284C7",
                                                                p: 0
                                                            }}
                                                        >
                                                            Map Pin
                                                        </Button>
                                                    </Box>
                                                )}

                                                {Boolean(item.is_mesh_relay || item.mesh_message_id) && (
                                                    <Box
                                                        onClick={() => setSelectedMeshAlert(item)}
                                                        sx={{
                                                            p: 1.2,
                                                            mb: 1.5,
                                                            borderRadius: "12px",
                                                            bgcolor: "rgba(2, 132, 199, 0.06)",
                                                            border: "1px dashed rgba(2, 132, 199, 0.4)",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            transition: "all 0.2s",
                                                            "&:hover": {
                                                                bgcolor: "rgba(2, 132, 199, 0.14)"
                                                            }
                                                        }}
                                                    >
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <HubRoundedIcon sx={{ fontSize: 18, color: "#0284C7" }} />
                                                            <Box>
                                                                <Typography variant="caption" sx={{ color: "#0369A1", fontWeight: 800, display: "block", lineHeight: 1.2 }}>
                                                                    Offline Hop Route Available
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.68rem" }}>
                                                                    {item.mesh_message_id ? `ID: ${item.mesh_message_id.slice(0, 16)}...` : "Carried via BLE peer nodes"}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                        <Button
                                                            size="small"
                                                            sx={{
                                                                fontSize: "0.72rem",
                                                                fontWeight: 800,
                                                                color: "#0284C7",
                                                                textTransform: "none",
                                                                p: 0,
                                                                minWidth: "auto"
                                                            }}
                                                        >
                                                            View Route →
                                                        </Button>
                                                    </Box>
                                                )}

                                                <Box sx={{ flexGrow: 1 }} />
                                                <Divider sx={{ my: 1.5, borderColor: "#F1F5F9" }} />

                                                {/* Action Bar */}
                                                <Stack direction="row" spacing={1.2}>
                                                    <Button
                                                        fullWidth
                                                        variant="outlined"
                                                        component="a"
                                                        href="/volunteers"
                                                        startIcon={<GroupsRoundedIcon />}
                                                        sx={{
                                                            borderRadius: "10px",
                                                            borderColor: "#CBD5E1",
                                                            color: "#334155",
                                                            textTransform: "none",
                                                            fontWeight: 700,
                                                            fontSize: "0.82rem",
                                                            "&:hover": { borderColor: "#94A3B8", bgcolor: "#F8FAFC" }
                                                        }}
                                                    >
                                                        Dispatch
                                                    </Button>

                                                    {!isResolved ? (
                                                        <Button
                                                            fullWidth
                                                            variant="contained"
                                                            disabled={resolvingId === item.id}
                                                            onClick={() => handleResolve(item)}
                                                            startIcon={
                                                                resolvingId === item.id ? (
                                                                    <CircularProgress size={16} color="inherit" />
                                                                ) : (
                                                                    <CheckCircleRoundedIcon />
                                                                )
                                                            }
                                                            sx={{
                                                                borderRadius: "10px",
                                                                bgcolor: "#059669",
                                                                color: "#FFFFFF",
                                                                textTransform: "none",
                                                                fontWeight: 750,
                                                                fontSize: "0.82rem",
                                                                "&:hover": { bgcolor: "#047857" }
                                                            }}
                                                        >
                                                            Resolve
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            fullWidth
                                                            variant="text"
                                                            disabled
                                                            startIcon={<CheckCircleRoundedIcon />}
                                                            sx={{
                                                                borderRadius: "10px",
                                                                color: "#059669",
                                                                fontWeight: 750,
                                                                fontSize: "0.82rem"
                                                            }}
                                                        >
                                                            Resolved
                                                        </Button>
                                                    )}
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </div>
            </div>

            {/* Mesh Packet Multi-Hop Route Inspection Dialog */}
            <Dialog
                open={Boolean(selectedMeshAlert)}
                onClose={() => setSelectedMeshAlert(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: "24px",
                        bgcolor: "#0F172A",
                        color: "#FFFFFF",
                        border: "1px solid rgba(2, 132, 199, 0.3)",
                        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
                        p: 1
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: "14px",
                                bgcolor: "rgba(2, 132, 199, 0.2)",
                                border: "1px solid rgba(2, 132, 199, 0.4)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            <BluetoothRoundedIcon sx={{ color: "#38BDF8", fontSize: 26 }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={850} color="#FFFFFF" letterSpacing="-0.3px">
                                Offline BLE Mesh Hop Trail
                            </Typography>
                            <Typography variant="caption" color="#94A3B8">
                                Multi-Hop Store-and-Forward Relay Telemetry
                            </Typography>
                        </Box>
                        <Chip
                            label="PEER-TO-PEER"
                            size="small"
                            sx={{
                                bgcolor: "rgba(56, 189, 248, 0.15)",
                                color: "#38BDF8",
                                fontWeight: 800,
                                fontSize: "0.68rem"
                            }}
                        />
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ py: 2 }}>
                    {selectedMeshAlert && (
                        <Stack spacing={2.5}>
                            {/* Packet Summary Box */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: "16px",
                                    bgcolor: "rgba(30, 41, 59, 0.6)",
                                    border: "1px solid rgba(255, 255, 255, 0.08)"
                                }}
                            >
                                <Typography variant="caption" color="#64748B" fontWeight={750} sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    Distress Packet Payload
                                </Typography>
                                <Typography variant="body1" fontWeight={750} color="#F8FAFC" sx={{ mt: 0.5, mb: 1.2 }}>
                                    "{selectedMeshAlert.message}"
                                </Typography>

                                <Grid container spacing={1.5}>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color="#64748B" display="block">
                                            Mesh Message ID
                                        </Typography>
                                        <Typography variant="caption" fontWeight={700} color="#38BDF8" sx={{ wordBreak: "break-all" }}>
                                            {selectedMeshAlert.mesh_message_id || `MESH-${String(selectedMeshAlert.id).slice(0, 12)}`}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color="#64748B" display="block">
                                            Sender Identity
                                        </Typography>
                                        <Typography variant="caption" fontWeight={700} color="#F8FAFC">
                                            {selectedMeshAlert.sender_name || "Offline Citizen"}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Hop Pathway Trace */}
                            <Box sx={{ px: 1 }}>
                                <Typography variant="subtitle2" fontWeight={800} color="#E2E8F0" sx={{ mb: 2 }}>
                                    Relay Transmission Sequence
                                </Typography>

                                <Stack spacing={2} sx={{ position: "relative" }}>
                                    {/* Step 1: Origin */}
                                    <Stack direction="row" spacing={2} alignItems="flex-start">
                                        <Box
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: "50%",
                                                bgcolor: "rgba(239, 68, 68, 0.2)",
                                                border: "2px solid #EF4444",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0
                                            }}
                                        >
                                            <WifiOffRoundedIcon sx={{ fontSize: 18, color: "#EF4444" }} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" fontWeight={800} color="#F8FAFC">
                                                    Hop 0: Originating Offline Phone
                                                </Typography>
                                                <Chip label="DISTRESS BEACON" size="small" sx={{ bgcolor: "rgba(239, 68, 68, 0.15)", color: "#F87171", fontSize: "0.62rem", fontWeight: 800, height: 20 }} />
                                            </Stack>
                                            <Typography variant="caption" color="#94A3B8" sx={{ display: "block", mt: 0.3 }}>
                                                Distress SOS generated without internet. Queued locally in device Store-and-Forward Outbox and broadcasted over BLE / Wi-Fi Direct.
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    {/* Step 2: Peer-to-Peer Relay */}
                                    <Stack direction="row" spacing={2} alignItems="flex-start">
                                        <Box
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: "50%",
                                                bgcolor: "rgba(2, 132, 199, 0.2)",
                                                border: "2px solid #0284C7",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0
                                            }}
                                        >
                                            <BluetoothRoundedIcon sx={{ fontSize: 20, color: "#38BDF8" }} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" fontWeight={800} color="#F8FAFC">
                                                    Hop 1: Passing Mobile Peer (Data Mule)
                                                </Typography>
                                                <Chip label={`${selectedMeshAlert.hops || 1} MESH HOP(S)`} size="small" sx={{ bgcolor: "rgba(2, 132, 199, 0.2)", color: "#38BDF8", fontSize: "0.62rem", fontWeight: 800, height: 20 }} />
                                            </Stack>
                                            <Typography variant="caption" color="#94A3B8" sx={{ display: "block", mt: 0.3 }}>
                                                Encountered passing phone running ResilientNet within Bluetooth radio perimeter (~30m). Packet transferred peer-to-peer and stored in mule cache.
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    {/* Step 3: Gateway Uplink */}
                                    <Stack direction="row" spacing={2} alignItems="flex-start">
                                        <Box
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: "50%",
                                                bgcolor: "rgba(16, 185, 129, 0.2)",
                                                border: "2px solid #10B981",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0
                                            }}
                                        >
                                            <CloudDoneRoundedIcon sx={{ fontSize: 18, color: "#10B981" }} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" fontWeight={800} color="#F8FAFC">
                                                    Hop 2: Internet Gateway Uplink
                                                </Typography>
                                                <Chip label="HQ SYNCHRONIZED" size="small" sx={{ bgcolor: "rgba(16, 185, 129, 0.15)", color: "#34D399", fontSize: "0.62rem", fontWeight: 800, height: 20 }} />
                                            </Stack>
                                            <Typography variant="caption" color="#94A3B8" sx={{ display: "block", mt: 0.3 }}>
                                                Mobile peer moved into range of surviving cellular / Wi-Fi network. Autonomous gateway service flushed packet to Rescue HQ via POST /api/sos/mesh-sync.
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, pt: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            window.location.href = "/mesh";
                        }}
                        startIcon={<HubRoundedIcon />}
                        sx={{
                            color: "#38BDF8",
                            borderColor: "rgba(56, 189, 248, 0.4)",
                            borderRadius: "12px",
                            textTransform: "none",
                            fontWeight: 750,
                            "&:hover": { borderColor: "#38BDF8", bgcolor: "rgba(56, 189, 248, 0.08)" }
                        }}
                    >
                        Open Mesh Terminal
                    </Button>

                    <Button
                        variant="contained"
                        onClick={() => setSelectedMeshAlert(null)}
                        sx={{
                            bgcolor: "#0284C7",
                            color: "#FFFFFF",
                            borderRadius: "12px",
                            textTransform: "none",
                            fontWeight: 800,
                            "&:hover": { bgcolor: "#0369A1" }
                        }}
                    >
                        Close Hop Trail
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
};

export default SOSAlertsDashboard;
