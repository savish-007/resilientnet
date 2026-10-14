import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
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
    FormControl,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography
} from "@mui/material";

import DashboardLayout from "../layouts/DashboardLayout";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import SearchIcon from "@mui/icons-material/Search";
import GroupsIcon from "@mui/icons-material/Groups";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import { API_BASE_URL } from "../config/apiConfig";

const API_BASE = API_BASE_URL;

const VolunteerDashboard = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [availabilityFilter, setAvailabilityFilter] = useState("ALL");

    const [openAssignDialog, setOpenAssignDialog] = useState(false);
    const [selectedVolunteer, setSelectedVolunteer] = useState("");
    const [selectedIncident, setSelectedIncident] = useState("");
    const [notes, setNotes] = useState("");
    const [assigning, setAssigning] = useState(false);

    const token = localStorage.getItem("token");
    const currentUser = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
            return {};
        }
    }, []);

    const isAdmin = currentUser?.role === "ADMIN";

    const fetchVolunteers = async () => {
        const response = await fetch(`${API_BASE}/volunteers`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Unable to load volunteers.");
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error("Invalid volunteer data received.");
        }

        setVolunteers(data);
    };

    const fetchIncidents = async () => {
        const response = await fetch(`${API_BASE}/incidents`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Unable to load incidents.");
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error("Invalid incident data received.");
        }

        setIncidents(data);
    };

    const fetchPendingRequests = async () => {
        if (!isAdmin) return;
        try {
            const response = await fetch(`${API_BASE}/volunteers/requests`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) return;

            const data = await response.json();
            if (Array.isArray(data)) {
                setPendingRequests(data);
            }
        } catch (err) {
            console.error("Failed to load volunteer requests:", err);
        }
    };

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            await Promise.all([
                fetchVolunteers(),
                fetchIncidents(),
                fetchPendingRequests()
            ]);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const isAvailable = (availability) =>
        availability === true || availability === "AVAILABLE";

    const getAvailabilityLabel = (availability) => {
        if (isAvailable(availability)) return "AVAILABLE";
        if (availability === "UNAVAILABLE") return "UNAVAILABLE";

        return availability == null || availability === false
            ? "UNKNOWN"
            : String(availability);
    };

    const getAvailabilityColor = (availability) => {
        if (isAvailable(availability)) return "success";
        if (availability === "UNAVAILABLE") return "warning";

        return "default";
    };

    const stats = useMemo(() => ({
        total: volunteers.length,
        available: volunteers.filter(
            (volunteer) => isAvailable(volunteer.availability)
        ).length,
        unavailable: volunteers.filter(
            (volunteer) => volunteer.availability === "UNAVAILABLE"
        ).length
    }), [volunteers]);

    const filteredVolunteers = useMemo(() => {
        const query = search.trim().toLowerCase();

        return volunteers.filter((volunteer) => {
            const matchesSearch = [
                volunteer.full_name,
                volunteer.email,
                volunteer.phone,
                volunteer.skills
            ].some((value) =>
                String(value || "").toLowerCase().includes(query)
            );

            const matchesAvailability =
                availabilityFilter === "ALL" ||
                (availabilityFilter === "AVAILABLE" &&
                    isAvailable(volunteer.availability)) ||
                (availabilityFilter === "UNAVAILABLE" &&
                    volunteer.availability === "UNAVAILABLE");

            return matchesSearch && matchesAvailability;
        });
    }, [volunteers, search, availabilityFilter]);

    const openAssignmentDialog = (volunteer) => {
        setSelectedVolunteer(volunteer.id);
        setSelectedIncident("");
        setNotes("");
        setError("");
        setSuccess("");
        setOpenAssignDialog(true);
    };

    const closeAssignmentDialog = () => {
        if (assigning) return;

        setOpenAssignDialog(false);
        setSelectedVolunteer("");
        setSelectedIncident("");
        setNotes("");
    };

    const handleAssign = async () => {
        if (!selectedVolunteer || !selectedIncident) {
            setError("Please select an incident.");
            return;
        }

        setAssigning(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${API_BASE}/volunteers/assign`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        volunteer_id: selectedVolunteer,
                        incident_id: selectedIncident,
                        notes: notes.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to assign volunteer.");
            }

            setVolunteers((current) =>
                current.map((volunteer) =>
                    String(volunteer.id) === String(selectedVolunteer)
                        ? {
                            ...volunteer,
                            availability: "UNAVAILABLE"
                        }
                        : volunteer
                )
            );

            setOpenAssignDialog(false);
            setSelectedVolunteer("");
            setSelectedIncident("");
            setNotes("");

            setSuccess(data.message || "Volunteer assigned successfully.");
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to assign volunteer.");
        } finally {
            setAssigning(false);
        }
    };

    const handleAvailabilityChange = async (volunteer, availability) => {
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${API_BASE}/volunteers/${volunteer.id}/availability`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ availability })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update volunteer availability.");
            }

            setVolunteers((current) =>
                current.map((item) =>
                    String(item.id) === String(volunteer.id)
                        ? {
                              ...item,
                              availability: data.volunteer?.availability || availability
                          }
                        : item
                )
            );

            setSuccess(data.message || "Availability updated successfully.");
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to update volunteer availability.");
        }
    };

    const handleRoleChange = async (volunteer, role) => {
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${API_BASE}/volunteers/${volunteer.id}/role`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ role })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update volunteer role.");
            }

            setVolunteers((current) =>
                current.map((item) =>
                    String(item.id) === String(volunteer.id)
                        ? { ...item, role }
                        : item
                )
            );

            setSuccess(data.message || `Role updated successfully to ${role}.`);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to update volunteer role.");
        }
    };

    const handleApprove = async (volunteerId, role = "VOLUNTEER") => {
        try {
            const response = await fetch(`${API_BASE}/volunteers/${volunteerId}/approve`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ assigned_role: role })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to approve volunteer.");

            setSuccess(`Volunteer approved successfully as ${role}!`);
            loadData();
        } catch (err) {
            setError(err.message || "Approval failed.");
        }
    };

    const handleReject = async (volunteerId) => {
        if (!window.confirm("Are you sure you want to reject this volunteer application?")) return;

        try {
            const response = await fetch(`${API_BASE}/volunteers/${volunteerId}/reject`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to reject application.");

            setSuccess("Application rejected.");
            loadData();
        } catch (err) {
            setError(err.message || "Rejection failed.");
        }
    };

    const selectedVolunteerDetails = volunteers.find(
        (volunteer) => String(volunteer.id) === String(selectedVolunteer)
    );

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
                    {/* Page Header */}
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3.5 }}>
                        <Box
                            component="img"
                            src="/logo.png"
                            alt="ResilientNet Logo"
                            sx={{
                                width: 50,
                                height: 50,
                                borderRadius: "16px",
                                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.18)",
                                objectFit: "cover"
                            }}
                        />
                        <Box>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 800,
                                    color: "#0F172A",
                                    letterSpacing: "-0.5px"
                                }}
                            >
                                Volunteer Coordination & Response
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#64748B", mt: 0.3 }}>
                                Monitor responder availability, review applications, and coordinate emergency field assignments.
                            </Typography>
                        </Box>
                    </Stack>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: "12px" }} onClose={() => setError("")}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2.5, borderRadius: "12px" }} onClose={() => setSuccess("")}>
                            {success}
                        </Alert>
                    )}

                    {/* Summary Cards */}
                    <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                        {[
                            {
                                label: "Total Volunteers",
                                value: stats.total,
                                sub: "Registered personnel",
                                icon: <GroupsIcon />,
                                color: "#2563EB",
                                bg: "#EFF6FF"
                            },
                            {
                                label: "Available Now",
                                value: stats.available,
                                sub: "Ready for dispatch",
                                icon: <CheckCircleIcon />,
                                color: "#16A34A",
                                bg: "#DCFCE7"
                            },
                            {
                                label: "On Assignment",
                                value: stats.unavailable,
                                sub: "Currently engaged",
                                icon: <PersonOffIcon />,
                                color: "#EA580C",
                                bg: "#FFEDD5"
                            },
                            {
                                label: "Open Incidents",
                                value: incidents.filter((i) => i.status !== "RESOLVED").length,
                                sub: "Active emergencies",
                                icon: <VolunteerActivismIcon />,
                                color: "#7C3AED",
                                bg: "#F3E8FF"
                            },
                            ...(isAdmin
                                ? [
                                      {
                                          label: "Pending Requests",
                                          value: pendingRequests.length,
                                          sub: "Awaiting approval",
                                          icon: <PersonAddIcon />,
                                          color: pendingRequests.length > 0 ? "#D97706" : "#64748B",
                                          bg: pendingRequests.length > 0 ? "#FEF3C7" : "#F1F5F9"
                                      }
                                  ]
                                : [])
                        ].map((stat) => (
                            <Grid item xs={12} sm={6} md={isAdmin ? 2.4 : 3} key={stat.label}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        p: 2.2,
                                        borderRadius: "16px",
                                        bgcolor: "#FFFFFF",
                                        border: "1px solid #E2E8F0",
                                        boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                        "&:hover": {
                                            transform: "translateY(-3px)",
                                            boxShadow: "0 8px 24px rgba(0,0,0,0.06)"
                                        }
                                    }}
                                >
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700 }}>
                                                {stat.label}
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 800, color: "#0F172A", my: 0.5 }}>
                                                {stat.value}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                                                {stat.sub}
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: "14px",
                                                bgcolor: stat.bg,
                                                color: stat.color,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        >
                                            {stat.icon}
                                        </Box>
                                    </Stack>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Pending Applications Panel (Admin Only) */}
                    {isAdmin && pendingRequests.length > 0 && (
                        <Card
                            elevation={0}
                            sx={{
                                mb: 3.5,
                                borderRadius: "18px",
                                border: "1px solid #FCD34D",
                                bgcolor: "#FFFBEB",
                                p: 1.5
                            }}
                        >
                            <CardContent>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                                    <PersonAddIcon sx={{ color: "#D97706", fontSize: 30 }} />
                                    <Box>
                                        <Typography variant="h6" fontWeight={800} color="#92400E">
                                            Pending Volunteer Applications ({pendingRequests.length})
                                        </Typography>
                                        <Typography variant="body2" color="#B45309">
                                            Review volunteer credentials and assign them to active duty or responder roles.
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Stack spacing={1.5}>
                                    {pendingRequests.map((req) => (
                                        <Paper
                                            key={req.volunteer_id}
                                            elevation={0}
                                            sx={{
                                                p: 2.2,
                                                borderRadius: "14px",
                                                bgcolor: "#FFFFFF",
                                                border: "1px solid #FDE68A",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                                gap: 2
                                            }}
                                        >
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={800} color="#0F172A">
                                                    {req.full_name}
                                                </Typography>
                                                <Typography variant="body2" color="#475569">
                                                    ✉️ {req.email} &nbsp;|&nbsp; 📞 {req.phone}
                                                </Typography>
                                                <Typography variant="body2" color="#D97706" fontWeight={600} sx={{ mt: 0.5 }}>
                                                    Skills: {req.skills || "General Emergency Support"}
                                                </Typography>
                                            </Box>

                                            <Stack direction="row" spacing={1.2}>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    color="success"
                                                    onClick={() => handleApprove(req.volunteer_id, "VOLUNTEER")}
                                                    sx={{ borderRadius: "10px", fontWeight: 750, textTransform: "none", px: 2 }}
                                                >
                                                    Approve Volunteer
                                                </Button>

                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleApprove(req.volunteer_id, "VOLUNTEER_RESPONDER")}
                                                    sx={{ borderRadius: "10px", fontWeight: 750, textTransform: "none", px: 2 }}
                                                >
                                                    Approve as Responder
                                                </Button>

                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleReject(req.volunteer_id)}
                                                    sx={{ borderRadius: "10px", fontWeight: 700, textTransform: "none" }}
                                                >
                                                    Reject
                                                </Button>
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    )}

                    {/* Filter and Search Bar */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: "16px",
                            bgcolor: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                            mb: 3.5,
                            display: "flex",
                            gap: 2,
                            flexWrap: "wrap",
                            alignItems: "center"
                        }}
                    >
                        <TextField
                            placeholder="Search volunteers by name, email, phone, or skills..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{
                                flex: 1,
                                minWidth: 260,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "12px",
                                    bgcolor: "#F8FAFC"
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: "#94A3B8" }} />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <FormControl sx={{ minWidth: 180 }}>
                            <InputLabel id="avail-filter">Availability</InputLabel>
                            <Select
                                labelId="avail-filter"
                                value={availabilityFilter}
                                label="Availability"
                                onChange={(e) => setAvailabilityFilter(e.target.value)}
                                sx={{ borderRadius: "12px", bgcolor: "#F8FAFC" }}
                            >
                                <MenuItem value="ALL">All Volunteers</MenuItem>
                                <MenuItem value="AVAILABLE">Available</MenuItem>
                                <MenuItem value="UNAVAILABLE">Unavailable</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            variant="outlined"
                            onClick={loadData}
                            disabled={loading}
                            sx={{
                                borderRadius: "12px",
                                textTransform: "none",
                                fontWeight: 700,
                                minHeight: 44,
                                px: 2.5
                            }}
                        >
                            Refresh
                        </Button>
                    </Paper>

                    {/* Volunteer Cards Grid */}
                    {loading ? (
                        <Box sx={{ py: 8, textAlign: "center" }}>
                            <CircularProgress size={36} />
                            <Typography sx={{ mt: 2, color: "#64748B", fontWeight: 600 }}>
                                Loading responders...
                            </Typography>
                        </Box>
                    ) : filteredVolunteers.length === 0 ? (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 6,
                                textAlign: "center",
                                borderRadius: "16px",
                                bgcolor: "#FFFFFF",
                                border: "1px dashed #CBD5E1"
                            }}
                        >
                            <GroupsIcon sx={{ fontSize: 48, color: "#94A3B8", mb: 1.5 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: "#334155" }}>
                                No volunteers found
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
                                No active volunteers match your filter or search criteria.
                            </Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={2.5}>
                            {filteredVolunteers.map((volunteer) => (
                                <Grid item xs={12} sm={6} md={4} key={volunteer.id}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: "18px",
                                            bgcolor: "#FFFFFF",
                                            border: "1px solid #E2E8F0",
                                            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-between",
                                            height: "100%",
                                            transition: "all 0.2s ease",
                                            "&:hover": {
                                                borderColor: "#CBD5E1",
                                                boxShadow: "0 10px 28px rgba(0,0,0,0.07)",
                                                transform: "translateY(-2px)"
                                            }
                                        }}
                                    >
                                        <Box>
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                                                <Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.3 }}>
                                                        {volunteer.full_name}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: "#64748B", mt: 0.2 }}>
                                                        {volunteer.email}
                                                    </Typography>
                                                </Box>

                                                <Chip
                                                    label={getAvailabilityLabel(volunteer.availability)}
                                                    color={getAvailabilityColor(volunteer.availability)}
                                                    size="small"
                                                    sx={{ fontWeight: 700, borderRadius: "8px" }}
                                                />
                                            </Stack>

                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                                <Chip
                                                    label={volunteer.role || "VOLUNTEER"}
                                                    size="small"
                                                    color={volunteer.role === "VOLUNTEER_RESPONDER" ? "primary" : "default"}
                                                    sx={{
                                                        fontWeight: 700,
                                                        borderRadius: "8px",
                                                        bgcolor: volunteer.role === "VOLUNTEER_RESPONDER" ? "#EFF6FF" : "#F1F5F9",
                                                        color: volunteer.role === "VOLUNTEER_RESPONDER" ? "#1D4ED8" : "#475569"
                                                    }}
                                                />
                                            </Stack>

                                            <Paper elevation={0} sx={{ p: 1.5, borderRadius: "12px", bgcolor: "#F8FAFC", mb: 2, border: "1px solid #F1F5F9" }}>
                                                <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700 }}>
                                                    SKILLS & QUALIFICATIONS
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A", mt: 0.2 }}>
                                                    {volunteer.skills || "General Emergency Support"}
                                                </Typography>

                                                <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, display: "block", mt: 1 }}>
                                                    PHONE NUMBER
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: "#0F172A" }}>
                                                    {volunteer.phone || "Not provided"}
                                                </Typography>
                                            </Paper>
                                        </Box>

                                        <Stack spacing={1} sx={{ pt: 1, borderTop: "1px solid #F1F5F9" }}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                startIcon={<AssignmentTurnedInRoundedIcon />}
                                                disabled={!isAvailable(volunteer.availability)}
                                                onClick={() => openAssignmentDialog(volunteer)}
                                                sx={{
                                                    borderRadius: "10px",
                                                    textTransform: "none",
                                                    fontWeight: 750,
                                                    bgcolor: "#2563EB",
                                                    "&:hover": { bgcolor: "#1D4ED8" }
                                                }}
                                            >
                                                Assign to Incident
                                            </Button>

                                            {isAdmin && (
                                                <Button
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    color={volunteer.role === "VOLUNTEER_RESPONDER" ? "secondary" : "primary"}
                                                    onClick={() =>
                                                        handleRoleChange(
                                                            volunteer,
                                                            volunteer.role === "VOLUNTEER_RESPONDER" ? "VOLUNTEER" : "VOLUNTEER_RESPONDER"
                                                        )
                                                    }
                                                    sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}
                                                >
                                                    {volunteer.role === "VOLUNTEER_RESPONDER"
                                                        ? "Revoke Responder Status"
                                                        : "Designate as Responder"}
                                                </Button>
                                            )}

                                            <Button
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                color={isAvailable(volunteer.availability) ? "warning" : "success"}
                                                onClick={() =>
                                                    handleAvailabilityChange(
                                                        volunteer,
                                                        isAvailable(volunteer.availability) ? "UNAVAILABLE" : "AVAILABLE"
                                                    )
                                                }
                                                sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}
                                            >
                                                {isAvailable(volunteer.availability) ? "Mark Unavailable" : "Mark Available"}
                                            </Button>
                                        </Stack>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* Assignment Dialog */}
                    <Dialog
                        open={openAssignDialog}
                        onClose={closeAssignmentDialog}
                        fullWidth
                        maxWidth="sm"
                        PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}
                    >
                        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
                            Assign Volunteer to Emergency Incident
                        </DialogTitle>

                        <DialogContent>
                            {selectedVolunteerDetails && (
                                <Paper elevation={0} sx={{ p: 2, bgcolor: "#EFF6FF", borderRadius: "12px", border: "1px solid #BFDBFE", mb: 2 }}>
                                    <Typography fontWeight={800} color="#1D4ED8">
                                        {selectedVolunteerDetails.full_name}
                                    </Typography>
                                    <Typography variant="body2" color="#475569">
                                        {selectedVolunteerDetails.email} • {selectedVolunteerDetails.phone || "No phone"}
                                    </Typography>
                                </Paper>
                            )}

                            <FormControl fullWidth sx={{ mt: 1 }}>
                                <InputLabel id="inc-label">Select Incident</InputLabel>
                                <Select
                                    labelId="inc-label"
                                    value={selectedIncident}
                                    label="Select Incident"
                                    onChange={(e) => setSelectedIncident(e.target.value)}
                                    sx={{ borderRadius: "12px" }}
                                >
                                    {incidents
                                        .filter((i) => i.status !== "RESOLVED")
                                        .map((i) => (
                                            <MenuItem key={i.id} value={i.id}>
                                                {i.incident_number ? `${i.incident_number} — ` : ""}
                                                {i.title || "Untitled incident"} ({i.severity || "Unknown"})
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                multiline
                                minRows={3}
                                label="Assignment Notes / Instructions"
                                placeholder="Specify destination, tasks, and coordinator contacts..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                            />
                        </DialogContent>

                        <DialogActions sx={{ px: 3, pb: 2 }}>
                            <Button onClick={closeAssignmentDialog} disabled={assigning} sx={{ borderRadius: "10px", color: "#64748B", fontWeight: 700 }}>
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleAssign}
                                disabled={assigning || !selectedIncident || !selectedVolunteer}
                                sx={{ borderRadius: "10px", px: 3, fontWeight: 750, textTransform: "none", bgcolor: "#2563EB" }}
                            >
                                {assigning ? "Assigning..." : "Confirm Assignment"}
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default VolunteerDashboard;