import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    LinearProgress,
    Paper,
    Stack,
    Tooltip,
    Typography
} from "@mui/material";

import DashboardLayout from "../layouts/DashboardLayout";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import WaterDamageRoundedIcon from "@mui/icons-material/WaterDamageRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import DomainDisabledRoundedIcon from "@mui/icons-material/DomainDisabledRounded";
import TrafficRoundedIcon from "@mui/icons-material/TrafficRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import { API_BASE_URL } from "../config/apiConfig";

const API_URL = `${API_BASE_URL}/analytics/dashboard`;

const ReportsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    const token = localStorage.getItem("token");

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(API_URL, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Failed to load analytics");
            }

            const result = await response.json();
            setData(result);
            setLastUpdated(new Date().toLocaleTimeString());
        } catch (err) {
            console.error(err);
            setError(err.message || "Unable to reach analytics service.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const summary = data?.summary || {};
    const categoryStats = data?.categoryStats || [];
    const severityStats = data?.severityStats || [];
    const dailyTrend = data?.dailyTrend || [];
    const aiStats = data?.aiStats || {};

    const totalCategoryCount = categoryStats.reduce(
        (sum, item) => sum + Number(item.count || 0),
        0
    );

    // Helper for category styling & icons
    const getCategoryConfig = (cat) => {
        const name = String(cat || "").toLowerCase();
        if (name.includes("medic")) {
            return { icon: <LocalHospitalRoundedIcon sx={{ fontSize: 18 }} />, color: "#DC2626", bg: "#FEF2F2" };
        }
        if (name.includes("flood") || name.includes("water")) {
            return { icon: <WaterDamageRoundedIcon sx={{ fontSize: 18 }} />, color: "#0284C7", bg: "#F0F9FF" };
        }
        if (name.includes("fire")) {
            return { icon: <LocalFireDepartmentRoundedIcon sx={{ fontSize: 18 }} />, color: "#EA580C", bg: "#FFF7ED" };
        }
        if (name.includes("collapse") || name.includes("build")) {
            return { icon: <DomainDisabledRoundedIcon sx={{ fontSize: 18 }} />, color: "#7C3AED", bg: "#F5F3FF" };
        }
        if (name.includes("road") || name.includes("traffic")) {
            return { icon: <TrafficRoundedIcon sx={{ fontSize: 18 }} />, color: "#475569", bg: "#F8FAFC" };
        }
        return { icon: <WarningAmberRoundedIcon sx={{ fontSize: 18 }} />, color: "#2563EB", bg: "#EFF6FF" };
    };

    // Export CSV handler
    const handleExportCSV = () => {
        if (!data) return;
        const rows = [
            ["Metric", "Value"],
            ["Total SOS Reports", summary.totalSOS ?? 0],
            ["Active SOS Reports", summary.activeSOS ?? 0],
            ["Resolved SOS Reports", summary.resolvedSOS ?? 0],
            ["Critical / High Priority", summary.highPriority ?? 0],
            ["Available Resources", summary.resourcesAvailable ?? 0],
            ["Deployed Resources", summary.resourcesBusy ?? 0],
            ["Available Volunteers", summary.volunteersAvailable ?? 0],
            ["Assigned Volunteers", summary.volunteersBusy ?? 0],
            ["Average AI Priority", aiStats.average_priority ?? "N/A"],
            ["Peak AI Priority", aiStats.highest_priority ?? "N/A"],
            [],
            ["Disaster Category", "Report Count"],
            ...categoryStats.map((c) => [c.category, c.count]),
            [],
            ["Severity Level", "Report Count"],
            ...severityStats.map((s) => [s.severity, s.count])
        ];

        const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ResilientNet_Report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
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
                                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.18)",
                                    objectFit: "cover"
                                }}
                            />

                            <Box>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Typography variant="h5" fontWeight={850} color="#0F172A" letterSpacing="-0.5px">
                                        Emergency Analytics & Reports
                                    </Typography>
                                    <Chip
                                        label="EXECUTIVE TELEMETRY"
                                        size="small"
                                        sx={{
                                            bgcolor: "#F1F5F9",
                                            color: "#334155",
                                            fontWeight: 800,
                                            fontSize: "0.68rem",
                                            height: 22,
                                            border: "1px solid #CBD5E1"
                                        }}
                                    />
                                </Stack>
                                <Typography variant="body2" color="#64748B" fontWeight={500}>
                                    Live situational awareness, incident distribution, responder readiness, and resource burn rates
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
                                variant="outlined"
                                startIcon={<DownloadRoundedIcon />}
                                onClick={handleExportCSV}
                                disabled={loading || !data}
                                sx={{
                                    borderRadius: "12px",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    color: "#334155",
                                    borderColor: "#CBD5E1",
                                    px: 2,
                                    "&:hover": { borderColor: "#94A3B8", bgcolor: "#F8FAFC" }
                                }}
                            >
                                Export CSV
                            </Button>

                            <Button
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshRoundedIcon />}
                                onClick={fetchAnalytics}
                                disabled={loading}
                                sx={{
                                    bgcolor: "#0F172A",
                                    borderRadius: "12px",
                                    textTransform: "none",
                                    fontWeight: 750,
                                    px: 2.2,
                                    "&:hover": { bgcolor: "#1E293B" }
                                }}
                            >
                                Refresh
                            </Button>
                        </Stack>
                    </Box>

                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: "14px" }} onClose={() => setError("")}>
                            {error}
                        </Alert>
                    )}

                    {loading && !data ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                            <CircularProgress size={44} sx={{ color: "#2563EB" }} />
                        </Box>
                    ) : (
                        <Stack spacing={3.5}>
                            {/* Summary Metrics Cards */}
                            <Grid container spacing={2.5}>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                                                TOTAL SOS REPORTS
                                            </Typography>
                                            <Box sx={{ p: 1, borderRadius: "12px", bgcolor: "#FEF2F2", color: "#DC2626" }}>
                                                <WarningAmberRoundedIcon fontSize="small" />
                                            </Box>
                                        </Stack>
                                        <Typography variant="h4" fontWeight={900} sx={{ mt: 1.5, color: "#0F172A" }}>
                                            {summary.totalSOS ?? 0}
                                        </Typography>
                                        <Typography variant="caption" color="#64748B" fontWeight={650}>
                                            <strong style={{ color: "#DC2626" }}>{summary.activeSOS ?? 0} active</strong> • {summary.resolvedSOS ?? 0} resolved
                                        </Typography>
                                    </Card>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                                                CRITICAL / HIGH SEVERITY
                                            </Typography>
                                            <Box sx={{ p: 1, borderRadius: "12px", bgcolor: "#FEE2E2", color: "#DC2626" }}>
                                                <TrendingUpRoundedIcon fontSize="small" />
                                            </Box>
                                        </Stack>
                                        <Typography variant="h4" fontWeight={900} sx={{ mt: 1.5, color: "#DC2626" }}>
                                            {summary.highPriority ?? 0}
                                        </Typography>
                                        <Typography variant="caption" color="#DC2626" fontWeight={600}>
                                            Priority score &ge; 70
                                        </Typography>
                                    </Card>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                                                RESOURCES ONLINE
                                            </Typography>
                                            <Box sx={{ p: 1, borderRadius: "12px", bgcolor: "#D1FAE5", color: "#059669" }}>
                                                <Inventory2RoundedIcon fontSize="small" />
                                            </Box>
                                        </Stack>
                                        <Typography variant="h4" fontWeight={900} sx={{ mt: 1.5, color: "#059669" }}>
                                            {summary.resourcesAvailable ?? 0}
                                        </Typography>
                                        <Typography variant="caption" color="#059669" fontWeight={650}>
                                            {summary.resourcesBusy ?? 0} in active field deployment
                                        </Typography>
                                    </Card>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: "20px",
                                            border: "1px solid rgba(37, 99, 235, 0.2)",
                                            bgcolor: "rgba(239, 246, 255, 0.6)",
                                            boxShadow: "0 2px 10px rgba(37, 99, 235, 0.05)"
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" color="#2563EB" fontWeight={750}>
                                                ACTIVE RESPONDERS
                                            </Typography>
                                            <Box sx={{ p: 1, borderRadius: "12px", bgcolor: "#DBEAFE", color: "#2563EB" }}>
                                                <GroupsRoundedIcon fontSize="small" />
                                            </Box>
                                        </Stack>
                                        <Typography variant="h4" fontWeight={900} sx={{ mt: 1.5, color: "#2563EB" }}>
                                            {summary.volunteersAvailable ?? 0}
                                        </Typography>
                                        <Typography variant="caption" color="#2563EB" fontWeight={650}>
                                            {summary.volunteersBusy ?? 0} assigned on field missions
                                        </Typography>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Detailed Analytics Breakdown Grid */}
                            <Grid container spacing={3.5}>
                                {/* Left Column: Category Distribution */}
                                <Grid size={{ xs: 12, md: 7 }}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            p: 3.5,
                                            borderRadius: "20px",
                                            border: "1px solid #E2E8F0",
                                            bgcolor: "#FFFFFF",
                                            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                                            height: "100%"
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                            <Typography variant="h6" fontWeight={850} color="#0F172A">
                                                Disaster Classification Distribution
                                            </Typography>
                                            <Chip
                                                label={`${totalCategoryCount} Total Ingested`}
                                                size="small"
                                                sx={{ fontWeight: 750, bgcolor: "#F1F5F9", color: "#475569" }}
                                            />
                                        </Stack>
                                        <Typography variant="body2" color="#64748B" sx={{ mb: 3 }}>
                                            Incident volume categorised by disaster nature and emergency typology
                                        </Typography>

                                        {categoryStats.length === 0 ? (
                                            <Typography variant="body2" color="#94A3B8" sx={{ py: 4, textAlign: "center" }}>
                                                No category records available.
                                            </Typography>
                                        ) : (
                                            <Stack spacing={2.5}>
                                                {categoryStats.map((item) => {
                                                    const cfg = getCategoryConfig(item.category);
                                                    const percentage = totalCategoryCount
                                                        ? Math.round((Number(item.count) / totalCategoryCount) * 100)
                                                        : 0;

                                                    return (
                                                        <Box
                                                            key={item.category}
                                                            sx={{
                                                                p: 2,
                                                                borderRadius: "16px",
                                                                bgcolor: "#F8FAFC",
                                                                border: "1px solid #F1F5F9"
                                                            }}
                                                        >
                                                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
                                                                <Stack direction="row" spacing={1.2} alignItems="center">
                                                                    <Box
                                                                        sx={{
                                                                            p: 0.8,
                                                                            borderRadius: "10px",
                                                                            bgcolor: cfg.bg,
                                                                            color: cfg.color,
                                                                            display: "flex"
                                                                        }}
                                                                    >
                                                                        {cfg.icon}
                                                                    </Box>
                                                                    <Typography fontWeight={800} variant="body1" color="#0F172A">
                                                                        {item.category}
                                                                    </Typography>
                                                                </Stack>

                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <Chip
                                                                        label={`${item.count} reports`}
                                                                        size="small"
                                                                        sx={{
                                                                            fontWeight: 800,
                                                                            fontSize: "0.72rem",
                                                                            bgcolor: "#FFFFFF",
                                                                            border: "1px solid #E2E8F0"
                                                                        }}
                                                                    />
                                                                    <Typography fontWeight={850} variant="body2" color={cfg.color}>
                                                                        {percentage}%
                                                                    </Typography>
                                                                </Stack>
                                                            </Stack>

                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={percentage}
                                                                sx={{
                                                                    height: 7,
                                                                    borderRadius: 4,
                                                                    bgcolor: "#E2E8F0",
                                                                    "& .MuiLinearProgress-bar": {
                                                                        bgcolor: cfg.color
                                                                    }
                                                                }}
                                                            />
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                        )}
                                    </Card>
                                </Grid>

                                {/* Right Column: Severity Triage & AI Intelligence */}
                                <Grid size={{ xs: 12, md: 5 }}>
                                    <Stack spacing={3}>
                                        {/* Severity Triage Card */}
                                        <Card
                                            elevation={0}
                                            sx={{
                                                p: 3,
                                                borderRadius: "20px",
                                                border: "1px solid #E2E8F0",
                                                bgcolor: "#FFFFFF",
                                                boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
                                            }}
                                        >
                                            <Typography variant="h6" fontWeight={850} color="#0F172A" gutterBottom>
                                                Severity Triage Breakdown
                                            </Typography>
                                            <Typography variant="body2" color="#64748B" sx={{ mb: 2.5 }}>
                                                Distribution of critical, medium, and low distress reports
                                            </Typography>

                                            <Stack spacing={1.5}>
                                                {severityStats.map((item) => {
                                                    const sev = String(item.severity || "").toUpperCase();
                                                    const isHigh = sev === "HIGH" || sev === "CRITICAL";
                                                    const isMed = sev === "MEDIUM";

                                                    return (
                                                        <Stack
                                                            key={item.severity}
                                                            direction="row"
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                            sx={{
                                                                p: 1.8,
                                                                borderRadius: "14px",
                                                                bgcolor: isHigh ? "#FEF2F2" : isMed ? "#FFFBEB" : "#F0FDF4",
                                                                border: "1px solid",
                                                                borderColor: isHigh ? "#FECACA" : isMed ? "#FDE68A" : "#BBF7D0"
                                                            }}
                                                        >
                                                            <Stack direction="row" spacing={1.2} alignItems="center">
                                                                <Box
                                                                    sx={{
                                                                        width: 10,
                                                                        height: 10,
                                                                        borderRadius: "50%",
                                                                        bgcolor: isHigh ? "#DC2626" : isMed ? "#D97706" : "#059669"
                                                                    }}
                                                                />
                                                                <Typography fontWeight={800} variant="body2" color="#0F172A">
                                                                    {sev} SEVERITY
                                                                </Typography>
                                                            </Stack>

                                                            <Chip
                                                                label={`${item.count} alerts`}
                                                                size="small"
                                                                sx={{
                                                                    fontWeight: 800,
                                                                    bgcolor: isHigh ? "#DC2626" : isMed ? "#D97706" : "#059669",
                                                                    color: "#FFFFFF"
                                                                }}
                                                            />
                                                        </Stack>
                                                    );
                                                })}
                                            </Stack>
                                        </Card>

                                        {/* AI Engine Performance Terminal */}
                                        <Card
                                            elevation={0}
                                            sx={{
                                                p: 3,
                                                borderRadius: "20px",
                                                bgcolor: "#0F172A",
                                                color: "#FFFFFF",
                                                border: "1px solid #1E293B",
                                                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.4)"
                                            }}
                                        >
                                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 38,
                                                        height: 38,
                                                        borderRadius: "12px",
                                                        bgcolor: "rgba(56, 189, 248, 0.15)",
                                                        color: "#38BDF8",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center"
                                                    }}
                                                >
                                                    <PsychologyRoundedIcon sx={{ fontSize: 24 }} />
                                                </Box>
                                                <Box>
                                                    <Typography fontWeight={850} variant="subtitle1" color="#FFFFFF">
                                                        AI Heuristic Decision Engine
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                                                        Automated multi-factor priority & dispatch engine
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            <Divider sx={{ borderColor: "#1E293B", my: 2 }} />

                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 6 }}>
                                                    <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 700 }}>
                                                        AVG PRIORITY SCORE
                                                    </Typography>
                                                    <Typography variant="h4" fontWeight={900} sx={{ color: "#38BDF8", mt: 0.5 }}>
                                                        {aiStats.average_priority ?? "N/A"}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#64748B" }}>
                                                        Across all evaluated alerts
                                                    </Typography>
                                                </Grid>

                                                <Grid size={{ xs: 6 }}>
                                                    <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 700 }}>
                                                        PEAK TRIAGE SEVERITY
                                                    </Typography>
                                                    <Typography variant="h4" fontWeight={900} sx={{ color: "#F43F5E", mt: 0.5 }}>
                                                        {aiStats.highest_priority ?? "N/A"}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#64748B" }}>
                                                        Highest emergency score
                                                    </Typography>
                                                </Grid>
                                            </Grid>

                                            <Box
                                                sx={{
                                                    mt: 2.5,
                                                    p: 1.5,
                                                    borderRadius: "12px",
                                                    bgcolor: "rgba(255,255,255,0.04)",
                                                    border: "1px solid rgba(255,255,255,0.08)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between"
                                                }}
                                            >
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <CheckCircleRoundedIcon sx={{ fontSize: 16, color: "#10B981" }} />
                                                    <Typography variant="caption" sx={{ color: "#CBD5E1", fontWeight: 650 }}>
                                                        Total Evaluated Incidents: <strong>{aiStats.total_analysis ?? 0}</strong>
                                                    </Typography>
                                                </Stack>

                                                <Chip
                                                    label="OPERATIONAL"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: "rgba(16, 185, 129, 0.15)",
                                                        color: "#10B981",
                                                        fontWeight: 800,
                                                        fontSize: "0.65rem",
                                                        height: 20
                                                    }}
                                                />
                                            </Box>
                                        </Card>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Stack>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ReportsDashboard;