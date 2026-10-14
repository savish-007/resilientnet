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
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    LinearProgress,
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

import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { API_BASE_URL } from "../config/apiConfig";

const API_URL = `${API_BASE_URL}/ai`;

const AIDashboard = () => {
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    // Filters
    const [search, setSearch] = useState("");
    const [severityFilter, setSeverityFilter] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [scoreTier, setScoreTier] = useState("ALL");

    const token = localStorage.getItem("token");

    // -------------------------------------------------------------
    // FETCH AI ANALYSIS
    // -------------------------------------------------------------
    const fetchAIAnalysis = useCallback(async () => {
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
                throw new Error(errData.message || "Failed to load AI analyses");
            }

            const data = await response.json();
            setAnalyses(Array.isArray(data) ? data : []);
            setLastUpdated(new Date().toLocaleTimeString());
        } catch (err) {
            console.error(err);
            setError(err.message || "Unable to reach AI analysis service.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAIAnalysis();
    }, [fetchAIAnalysis]);

    // -------------------------------------------------------------
    // FILTERING LOGIC
    // -------------------------------------------------------------
    const filteredAnalyses = useMemo(() => {
        return analyses.filter((item) => {
            const query = search.trim().toLowerCase();
            const matchesSearch =
                !query ||
                item.title?.toLowerCase().includes(query) ||
                item.category?.toLowerCase().includes(query) ||
                item.recommended_resource?.toLowerCase().includes(query) ||
                item.recommendation?.toLowerCase().includes(query);

            const matchesSeverity =
                severityFilter === "ALL" ||
                String(item.severity).toUpperCase() === severityFilter.toUpperCase();

            const matchesCategory =
                categoryFilter === "ALL" ||
                String(item.category).toUpperCase() === categoryFilter.toUpperCase();

            const score = Number(item.priority_score) || 0;
            let matchesTier = true;
            if (scoreTier === "CRITICAL") matchesTier = score >= 90;
            else if (scoreTier === "HIGH") matchesTier = score >= 70 && score < 90;
            else if (scoreTier === "MODERATE") matchesTier = score >= 40 && score < 70;
            else if (scoreTier === "LOW") matchesTier = score < 40;

            return matchesSearch && matchesSeverity && matchesCategory && matchesTier;
        });
    }, [analyses, search, severityFilter, categoryFilter, scoreTier]);

    // -------------------------------------------------------------
    // SUMMARY METRICS
    // -------------------------------------------------------------
    const metrics = useMemo(() => {
        const total = analyses.length;
        const critical = analyses.filter((a) => Number(a.priority_score) >= 90).length;
        const high = analyses.filter((a) => Number(a.priority_score) >= 70 && Number(a.priority_score) < 90).length;
        const avg = total
            ? (analyses.reduce((sum, a) => sum + Number(a.priority_score || 0), 0) / total).toFixed(1)
            : "0.0";
        return { total, critical, high, avg };
    }, [analyses]);

    // Categories list for filter dropdown
    const availableCategories = useMemo(() => {
        const set = new Set();
        analyses.forEach((a) => {
            if (a.category) set.add(a.category);
        });
        return Array.from(set);
    }, [analyses]);

    const getScoreBadge = (scoreNum) => {
        const score = Number(scoreNum) || 0;
        if (score >= 90) {
            return {
                label: "CRITICAL PRIORITY",
                bg: "rgba(239, 68, 68, 0.12)",
                color: "#DC2626",
                border: "rgba(239, 68, 68, 0.3)",
                pulse: true
            };
        }
        if (score >= 70) {
            return {
                label: "HIGH PRIORITY",
                bg: "rgba(245, 158, 11, 0.12)",
                color: "#D97706",
                border: "rgba(245, 158, 11, 0.3)",
                pulse: false
            };
        }
        if (score >= 40) {
            return {
                label: "MODERATE",
                bg: "rgba(2, 132, 199, 0.12)",
                color: "#0284C7",
                border: "rgba(2, 132, 199, 0.3)",
                pulse: false
            };
        }
        return {
            label: "STABLE",
            bg: "rgba(16, 185, 129, 0.12)",
            color: "#059669",
            border: "rgba(16, 185, 129, 0.3)",
            pulse: false
        };
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
                                    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.18)",
                                    objectFit: "cover"
                                }}
                            />

                            <Box>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Typography variant="h5" fontWeight={850} color="#0F172A" letterSpacing="-0.5px">
                                        AI Emergency Triage & Decision Engine
                                    </Typography>
                                    <Chip
                                        icon={<AutoAwesomeRoundedIcon sx={{ fontSize: "14px !important", color: "#6366F1 !important" }} />}
                                        label="HEURISTIC v2.4 ACTIVE"
                                        size="small"
                                        sx={{
                                            bgcolor: "#EEF2FF",
                                            color: "#4F46E5",
                                            fontWeight: 800,
                                            fontSize: "0.68rem",
                                            height: 22,
                                            border: "1px solid #C7D2FE"
                                        }}
                                    />
                                </Stack>
                                <Typography variant="body2" color="#64748B" fontWeight={500}>
                                    Automated priority telemetry, incident severity weighting, and instant resource dispatch matching
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
                                onClick={fetchAIAnalysis}
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
                                Re-evaluate
                            </Button>
                        </Stack>
                    </Box>

                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: "14px" }} onClose={() => setError("")}>
                            {error}
                        </Alert>
                    )}

                    {/* Summary Metrics Cards */}
                    <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
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
                                        EVALUATED INCIDENTS
                                    </Typography>
                                    <Box sx={{ p: 1, borderRadius: "12px", bgcolor: "#EEF2FF", color: "#4F46E5" }}>
                                        <PsychologyRoundedIcon fontSize="small" />
                                    </Box>
                                </Stack>
                                <Typography variant="h4" fontWeight={900} sx={{ mt: 1.5, color: "#0F172A" }}>
                                    {metrics.total}
                                </Typography>
                                <Typography variant="caption" color="#4F46E5" fontWeight={650}>
                                    100% confidence heuristic evaluated
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
                                        CRITICAL TRIAGE (&ge; 90)
                                    </Typography>
                                    <Box sx={{ p: 1, borderRadius: "12px", bgcolor: "#FEE2E2", color: "#DC2626" }}>
                                        <WarningAmberRoundedIcon fontSize="small" />
                                    </Box>
                                </Stack>
                                <Typography variant="h4" fontWeight={900} sx={{ mt: 1.5, color: "#DC2626" }}>
                                    {metrics.critical}
                                </Typography>
                                <Typography variant="caption" color="#DC2626" fontWeight={600}>
                                    Immediate dispatch intervention required
                                </Typography>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                                        HIGH CONCERN (70 - 89)
                                    </Typography>
                                    <Box sx={{ p: 1, borderRadius: "12px", bgcolor: "#FEF3C7", color: "#D97706" }}>
                                        <AutoAwesomeRoundedIcon fontSize="small" />
                                    </Box>
                                </Stack>
                                <Typography variant="h4" fontWeight={900} sx={{ mt: 1.5, color: "#D97706" }}>
                                    {metrics.high}
                                </Typography>
                                <Typography variant="caption" color="#B45309" fontWeight={600}>
                                    Secondary queue priority
                                </Typography>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: "20px",
                                    border: "1px solid rgba(2, 132, 199, 0.2)",
                                    bgcolor: "rgba(240, 249, 255, 0.6)",
                                    boxShadow: "0 2px 10px rgba(2, 132, 199, 0.05)"
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="#0284C7" fontWeight={750}>
                                        AVERAGE PRIORITY SCORE
                                    </Typography>
                                    <Box sx={{ p: 1, borderRadius: "12px", bgcolor: "#E0F2FE", color: "#0284C7" }}>
                                        <SpeedRoundedIcon fontSize="small" />
                                    </Box>
                                </Stack>
                                <Typography variant="h4" fontWeight={900} sx={{ mt: 1.5, color: "#0284C7" }}>
                                    {metrics.avg} <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#64748B" }}>/ 100</span>
                                </Typography>
                                <Typography variant="caption" color="#0284C7" fontWeight={600}>
                                    Cross-incident urgency baseline
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
                            <Grid size={{ xs: 12, md: 5 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search incident title, category, action plan, or resources..."
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

                            <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Priority Tier</InputLabel>
                                    <Select
                                        value={scoreTier}
                                        label="Priority Tier"
                                        onChange={(e) => setScoreTier(e.target.value)}
                                        sx={{ borderRadius: "12px", bgcolor: "#F8FAFC" }}
                                    >
                                        <MenuItem value="ALL">All Priority Tiers</MenuItem>
                                        <MenuItem value="CRITICAL">Critical (&ge; 90)</MenuItem>
                                        <MenuItem value="HIGH">High (70 - 89)</MenuItem>
                                        <MenuItem value="MODERATE">Moderate (40 - 69)</MenuItem>
                                        <MenuItem value="LOW">Low / Stable (&lt; 40)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Incident Severity</InputLabel>
                                    <Select
                                        value={severityFilter}
                                        label="Incident Severity"
                                        onChange={(e) => setSeverityFilter(e.target.value)}
                                        sx={{ borderRadius: "12px", bgcolor: "#F8FAFC" }}
                                    >
                                        <MenuItem value="ALL">All Severities</MenuItem>
                                        <MenuItem value="HIGH">High</MenuItem>
                                        <MenuItem value="MEDIUM">Medium</MenuItem>
                                        <MenuItem value="LOW">Low</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
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
                        </Grid>
                    </Card>

                    {/* AI Incident Evaluations List */}
                    {loading && analyses.length === 0 ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                            <CircularProgress size={44} sx={{ color: "#4F46E5" }} />
                        </Box>
                    ) : filteredAnalyses.length === 0 ? (
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
                                    bgcolor: "#EEF2FF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#4F46E5"
                                }}
                            >
                                <AutoAwesomeRoundedIcon sx={{ fontSize: 32 }} />
                            </Box>
                            <Typography variant="h6" fontWeight={750} color="#0F172A">
                                No Incident Evaluations Found
                            </Typography>
                            <Typography variant="body2" color="#64748B" sx={{ mt: 0.5, maxWidth: 420, mx: "auto" }}>
                                All active incidents have been processed or no entries match your selected criteria.
                            </Typography>
                        </Card>
                    ) : (
                        <Stack spacing={3}>
                            {filteredAnalyses.map((item) => {
                                const score = Number(item.priority_score) || 0;
                                const badge = getScoreBadge(score);

                                return (
                                    <Card
                                        key={item.id}
                                        elevation={0}
                                        sx={{
                                            p: 3.5,
                                            borderRadius: "20px",
                                            border: `1.5px solid ${score >= 90 ? "rgba(220, 38, 38, 0.3)" : "#E2E8F0"}`,
                                            bgcolor: "#FFFFFF",
                                            boxShadow: score >= 90
                                                ? "0 4px 20px rgba(220, 38, 38, 0.08)"
                                                : "0 2px 10px rgba(0,0,0,0.02)",
                                            transition: "all 0.2s ease-in-out",
                                            "&:hover": {
                                                boxShadow: "0 8px 26px rgba(0,0,0,0.06)",
                                                transform: "translateY(-2px)"
                                            }
                                        }}
                                    >
                                        <Grid container spacing={3} alignItems="center">
                                            {/* Column 1: Incident Identity & Severity */}
                                            <Grid size={{ xs: 12, md: 5 }}>
                                                <Stack spacing={1.2}>
                                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                                        <Chip
                                                            label={item.category || "INCIDENT"}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: "#0F172A",
                                                                color: "#FFFFFF",
                                                                fontWeight: 800,
                                                                fontSize: "0.7rem",
                                                                px: 0.5
                                                            }}
                                                        />
                                                        <Chip
                                                            label={`${item.severity || "MEDIUM"} SEVERITY`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: item.severity === "HIGH" ? "#FEF2F2" : item.severity === "MEDIUM" ? "#FFFBEB" : "#F0FDF4",
                                                                color: item.severity === "HIGH" ? "#DC2626" : item.severity === "MEDIUM" ? "#D97706" : "#059669",
                                                                fontWeight: 800,
                                                                fontSize: "0.7rem",
                                                                border: "1px solid",
                                                                borderColor: item.severity === "HIGH" ? "#FECACA" : item.severity === "MEDIUM" ? "#FDE68A" : "#BBF7D0"
                                                            }}
                                                        />
                                                    </Stack>

                                                    <Typography variant="h6" fontWeight={850} color="#0F172A" sx={{ lineHeight: 1.3 }}>
                                                        {item.title || "Emergency Incident"}
                                                    </Typography>

                                                    <Stack direction="row" spacing={0.8} alignItems="center">
                                                        <AccessTimeRoundedIcon sx={{ fontSize: 15, color: "#94A3B8" }} />
                                                        <Typography variant="caption" color="#64748B" fontWeight={600}>
                                                            Evaluated {new Date(item.analyzed_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            </Grid>

                                            {/* Column 2: AI Priority Meter */}
                                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: "16px",
                                                        bgcolor: "#F8FAFC",
                                                        border: "1px solid #E2E8F0"
                                                    }}
                                                >
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                                                        <Typography variant="caption" color="#64748B" fontWeight={800}>
                                                            TRIAGE PRIORITY
                                                        </Typography>
                                                        <Chip
                                                            label={badge.label}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: badge.bg,
                                                                color: badge.color,
                                                                border: `1px solid ${badge.border}`,
                                                                fontWeight: 800,
                                                                fontSize: "0.65rem"
                                                            }}
                                                        />
                                                    </Stack>

                                                    <Typography variant="h4" fontWeight={900} sx={{ color: badge.color, lineHeight: 1 }}>
                                                        {score.toFixed(0)} <span style={{ fontSize: "1rem", color: "#94A3B8", fontWeight: 700 }}>/ 100</span>
                                                    </Typography>

                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={Math.min(100, Math.max(0, score))}
                                                        sx={{
                                                            mt: 1.5,
                                                            height: 6,
                                                            borderRadius: 3,
                                                            bgcolor: "#E2E8F0",
                                                            "& .MuiLinearProgress-bar": {
                                                                bgcolor: badge.color
                                                            }
                                                        }}
                                                    />

                                                    <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mt: 1.2 }}>
                                                        <SpeedRoundedIcon sx={{ fontSize: 16, color: "#0284C7" }} />
                                                        <Typography variant="caption" fontWeight={750} color="#0284C7">
                                                            ETA: {item.estimated_response_time || "10 minutes"}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            </Grid>

                                            {/* Column 3: Recommended Resource & Dispatch */}
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: "16px",
                                                        bgcolor: "#F8FAFC",
                                                        border: "1px solid #E2E8F0",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "space-between",
                                                        height: "100%",
                                                        boxSizing: "border-box"
                                                    }}
                                                >
                                                    <Box>
                                                        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.6 }}>
                                                            <Inventory2RoundedIcon sx={{ fontSize: 16, color: "#2563EB" }} />
                                                            <Typography variant="caption" fontWeight={800} color="#64748B">
                                                                RECOMMENDED ASSET
                                                            </Typography>
                                                        </Stack>
                                                        <Typography variant="body1" fontWeight={850} color="#0F172A">
                                                            {item.recommended_resource || "Emergency Relief Supplies"}
                                                        </Typography>
                                                    </Box>

                                                    <Stack direction="row" spacing={1} sx={{ mt: 1.8 }}>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            component="a"
                                                            href="/resources"
                                                            endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: "14px !important" }} />}
                                                            sx={{
                                                                bgcolor: "#0F172A",
                                                                borderRadius: "10px",
                                                                textTransform: "none",
                                                                fontWeight: 750,
                                                                fontSize: "0.78rem",
                                                                "&:hover": { bgcolor: "#1E293B" }
                                                            }}
                                                        >
                                                            Dispatch Asset
                                                        </Button>

                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            component="a"
                                                            href="/sos"
                                                            sx={{
                                                                borderRadius: "10px",
                                                                borderColor: "#CBD5E1",
                                                                color: "#475569",
                                                                textTransform: "none",
                                                                fontWeight: 700,
                                                                fontSize: "0.78rem"
                                                            }}
                                                        >
                                                            View SOS
                                                        </Button>
                                                    </Stack>
                                                </Box>
                                            </Grid>
                                        </Grid>

                                        {/* Action Plan Recommendation Banner */}
                                        <Box
                                            sx={{
                                                mt: 2.5,
                                                p: 2,
                                                borderRadius: "14px",
                                                bgcolor: "rgba(254, 243, 199, 0.4)",
                                                border: "1px solid rgba(245, 158, 11, 0.25)",
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 1.5
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    p: 0.6,
                                                    borderRadius: "8px",
                                                    bgcolor: "#FEF3C7",
                                                    color: "#D97706",
                                                    display: "flex",
                                                    mt: 0.2
                                                }}
                                            >
                                                <LightbulbRoundedIcon sx={{ fontSize: 18 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" fontWeight={800} color="#B45309" sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                    Automated Tactical Recommendation
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: "#334155", fontWeight: 600, mt: 0.3, lineHeight: 1.5 }}>
                                                    {item.recommendation || "Maintain active monitoring and position response teams in nearby staging areas."}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Card>
                                );
                            })}
                        </Stack>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AIDashboard;