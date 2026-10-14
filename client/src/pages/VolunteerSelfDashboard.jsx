import { useCallback, useEffect, useState } from "react";
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
    Grid,
    Paper,
    Stack,
    Typography
} from "@mui/material";

import DashboardLayout from "../layouts/DashboardLayout";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonCheckedRoundedIcon from "@mui/icons-material/RadioButtonCheckedRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import { API_BASE_URL } from "../config/apiConfig";

const API_BASE = API_BASE_URL;

const VolunteerSelfDashboard = () => {
    const token = localStorage.getItem("token");

    const [profile, setProfile] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [profileResponse, assignmentResponse] = await Promise.all([
                fetch(`${API_BASE}/volunteers/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }),
                fetch(`${API_BASE}/volunteers/my-assignments`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            ]);

            const profileData = await profileResponse.json();
            const assignmentData = await assignmentResponse.json();

            if (!profileResponse.ok) {
                throw new Error(profileData.message || "Unable to load your profile.");
            }

            if (!assignmentResponse.ok) {
                throw new Error(assignmentData.message || "Unable to load your assignments.");
            }

            setProfile(profileData.volunteer);
            setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to load dashboard.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const updateAvailability = async () => {
        if (!profile) return;

        const availability =
            profile.availability === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(`${API_BASE}/volunteers/me/availability`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ availability })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to update availability.");
            }

            setProfile(data.volunteer);
            setSuccess(`Your duty status was updated to ${availability}.`);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to update availability.");
        } finally {
            setSaving(false);
        }
    };

    const getSeverityStyles = (sev) => {
        const val = String(sev || "").toUpperCase();
        if (val === "HIGH" || val === "CRITICAL") {
            return { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" };
        }
        if (val === "MEDIUM") {
            return { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" };
        }
        return { bg: "#F0FDF4", color: "#059669", border: "#BBF7D0" };
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
                                <Typography variant="h5" fontWeight={850} color="#0F172A" letterSpacing="-0.5px">
                                    Volunteer Responder Portal
                                </Typography>
                                <Typography variant="body2" color="#64748B" fontWeight={500}>
                                    Manage your real-time availability and field deployment assignments
                                </Typography>
                            </Box>
                        </Stack>

                        <Button
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshRoundedIcon />}
                            onClick={loadData}
                            disabled={loading || saving}
                            sx={{
                                bgcolor: "#0F172A",
                                borderRadius: "12px",
                                textTransform: "none",
                                fontWeight: 700,
                                px: 2.2,
                                "&:hover": { bgcolor: "#1E293B" }
                            }}
                        >
                            Refresh
                        </Button>
                    </Box>

                    {/* Alerts */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: "14px" }} onClose={() => setError("")}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mb: 3, borderRadius: "14px" }} onClose={() => setSuccess("")}>
                            {success}
                        </Alert>
                    )}

                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                            <CircularProgress size={44} sx={{ color: "#2563EB" }} />
                        </Box>
                    ) : (
                        <Grid container spacing={3.5}>
                            {/* Profile & Duty Status Card */}
                            <Grid size={{ xs: 12, md: 4 }}>
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
                                    <Stack alignItems="center" sx={{ textAlign: "center", mb: 2.5 }}>
                                        <Avatar
                                            sx={{
                                                width: 64,
                                                height: 64,
                                                mb: 1.5,
                                                bgcolor: "#2563EB",
                                                color: "#FFFFFF",
                                                fontWeight: 800,
                                                fontSize: "1.5rem"
                                            }}
                                        >
                                            {(profile?.full_name || "V")[0].toUpperCase()}
                                        </Avatar>

                                        <Typography variant="h6" fontWeight={800} color="#0F172A">
                                            {profile?.full_name || "Responder"}
                                        </Typography>
                                        <Typography variant="body2" color="#64748B">
                                            {profile?.email || ""}
                                        </Typography>

                                        <Box sx={{ mt: 1.5 }}>
                                            <Chip
                                                label={profile?.availability === "AVAILABLE" ? "READY ON DUTY" : "OFF DUTY"}
                                                icon={<RadioButtonCheckedRoundedIcon sx={{ fontSize: "16px !important" }} />}
                                                sx={{
                                                    bgcolor: profile?.availability === "AVAILABLE" ? "#DCFCE7" : "#FEE2E2",
                                                    color: profile?.availability === "AVAILABLE" ? "#15803D" : "#DC2626",
                                                    fontWeight: 800,
                                                    fontSize: "0.75rem",
                                                    px: 1
                                                }}
                                            />
                                        </Box>
                                    </Stack>

                                    <Divider sx={{ my: 2, borderColor: "#F1F5F9" }} />

                                    <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography variant="caption" color="#64748B" fontWeight={700}>
                                                SKILLS / SPECIALIZATION
                                            </Typography>
                                            <Typography variant="caption" color="#0F172A" fontWeight={750}>
                                                {profile?.skills || "General Relief"}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography variant="caption" color="#64748B" fontWeight={700}>
                                                ACTIVE ASSIGNMENTS
                                            </Typography>
                                            <Typography variant="caption" color="#2563EB" fontWeight={800}>
                                                {assignments.length} Total
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        disabled={saving || !["AVAILABLE", "UNAVAILABLE"].includes(profile?.availability)}
                                        onClick={updateAvailability}
                                        sx={{
                                            borderRadius: "12px",
                                            py: 1.2,
                                            fontWeight: 800,
                                            textTransform: "none",
                                            bgcolor: profile?.availability === "AVAILABLE" ? "#DC2626" : "#059669",
                                            "&:hover": {
                                                bgcolor: profile?.availability === "AVAILABLE" ? "#B91C1C" : "#047857"
                                            }
                                        }}
                                    >
                                        {saving ? (
                                            <CircularProgress size={20} color="inherit" />
                                        ) : profile?.availability === "AVAILABLE" ? (
                                            "Switch to Off Duty"
                                        ) : (
                                            "Check In as Available"
                                        )}
                                    </Button>
                                </Card>
                            </Grid>

                            {/* Assignments List */}
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Box sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Typography variant="h6" fontWeight={800} color="#0F172A">
                                        Assigned Operations & Incidents ({assignments.length})
                                    </Typography>
                                </Box>

                                {assignments.length === 0 ? (
                                    <Card
                                        elevation={0}
                                        sx={{
                                            p: 5,
                                            textAlign: "center",
                                            borderRadius: "20px",
                                            border: "1px dashed #CBD5E1",
                                            bgcolor: "#F8FAFC"
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 56,
                                                height: 56,
                                                mx: "auto",
                                                mb: 2,
                                                borderRadius: "50%",
                                                bgcolor: "#EFF6FF",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#2563EB"
                                            }}
                                        >
                                            <AssignmentTurnedInRoundedIcon sx={{ fontSize: 32 }} />
                                        </Box>
                                        <Typography variant="h6" fontWeight={750} color="#0F172A">
                                            No Active Deployments
                                        </Typography>
                                        <Typography variant="body2" color="#64748B" sx={{ mt: 0.5, maxWidth: 380, mx: "auto" }}>
                                            You are currently on standby. As emergencies arise, incident coordinators will assign operations to you here.
                                        </Typography>
                                    </Card>
                                ) : (
                                    <Stack spacing={2}>
                                        {assignments.map((assignment) => {
                                            const sev = getSeverityStyles(assignment.severity);
                                            return (
                                                <Card
                                                    key={assignment.assignment_id}
                                                    elevation={0}
                                                    sx={{
                                                        p: 3,
                                                        borderRadius: "18px",
                                                        border: "1px solid #E2E8F0",
                                                        bgcolor: "#FFFFFF",
                                                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                                                    }}
                                                >
                                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                                                        <Box>
                                                            <Typography variant="h6" fontWeight={800} color="#0F172A">
                                                                {assignment.incident_title || "Emergency Response Incident"}
                                                            </Typography>
                                                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                                                <Chip
                                                                    label={`Severity: ${assignment.severity || "HIGH"}`}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: sev.bg,
                                                                        color: sev.color,
                                                                        border: `1px solid ${sev.border}`,
                                                                        fontWeight: 800,
                                                                        fontSize: "0.7rem"
                                                                    }}
                                                                />
                                                                <Chip
                                                                    label={assignment.assignment_status || "ASSIGNED"}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: "#EFF6FF",
                                                                        color: "#2563EB",
                                                                        fontWeight: 750,
                                                                        fontSize: "0.7rem"
                                                                    }}
                                                                />
                                                            </Stack>
                                                        </Box>
                                                    </Stack>

                                                    {assignment.notes && (
                                                        <Box
                                                            sx={{
                                                                p: 1.5,
                                                                borderRadius: "12px",
                                                                bgcolor: "#F8FAFC",
                                                                border: "1px solid #E2E8F0",
                                                                mb: 2
                                                            }}
                                                        >
                                                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                <NotesRoundedIcon sx={{ fontSize: 18, color: "#64748B", mt: 0.3 }} />
                                                                <Typography variant="body2" color="#334155" fontWeight={600}>
                                                                    {assignment.notes}
                                                                </Typography>
                                                            </Stack>
                                                        </Box>
                                                    )}

                                                    {assignment.assigned_at && (
                                                        <Stack direction="row" spacing={0.8} alignItems="center">
                                                            <AccessTimeRoundedIcon sx={{ fontSize: 15, color: "#94A3B8" }} />
                                                            <Typography variant="caption" color="#64748B" fontWeight={600}>
                                                                Assigned: {new Date(assignment.assigned_at).toLocaleString()}
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                </Card>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </Grid>
                        </Grid>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default VolunteerSelfDashboard;
