
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Stack,
    Typography
} from "@mui/material";

const API_BASE = "http://localhost:5000/api";

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
            const [profileResponse, assignmentResponse] =
                await Promise.all([
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
                throw new Error(
                    profileData.message || "Unable to load your profile."
                );
            }

            if (!assignmentResponse.ok) {
                throw new Error(
                    assignmentData.message ||
                    "Unable to load your assignments."
                );
            }

            setProfile(profileData.volunteer);
            setAssignments(assignmentData);
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
            profile.availability === "AVAILABLE"
                ? "UNAVAILABLE"
                : "AVAILABLE";

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${API_BASE}/volunteers/me/availability`,
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
                throw new Error(
                    data.message || "Unable to update availability."
                );
            }

            setProfile(data.volunteer);
            setSuccess("Your availability has been updated.");
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to update availability.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 4 } }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
                Volunteer Dashboard
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 3 }}>
                View your availability and emergency response assignments.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            {!profile ? (
                <Alert severity="warning">
                    No volunteer profile is linked to this account.
                    Please contact the system administrator.
                </Alert>
            ) : (
                <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={700}>
                            {profile.full_name || "My Profile"}
                        </Typography>

                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                            {profile.email || ""}
                        </Typography>

                        <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            flexWrap="wrap"
                        >
                            <Chip
                                label={profile.availability || "UNKNOWN"}
                                color={
                                    profile.availability === "AVAILABLE"
                                        ? "success"
                                        : profile.availability === "UNAVAILABLE"
                                            ? "warning"
                                            : "default"
                                }
                            />

                            <Button
                                variant="contained"
                                disabled={
                                    saving ||
                                    !["AVAILABLE", "UNAVAILABLE"].includes(
                                        profile.availability
                                    )
                                }
                                onClick={updateAvailability}
                            >
                                {saving
                                    ? "Updating..."
                                    : profile.availability === "AVAILABLE"
                                        ? "Mark Unavailable"
                                        : "Mark Available"}
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={loadData}
                                disabled={saving}
                            >
                                Refresh
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            )}

            <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
                My Assignments
            </Typography>

            {assignments.length === 0 ? (
                <Alert severity="info">
                    You have no assignments at the moment.
                </Alert>
            ) : (
                <Stack spacing={2}>
                    {assignments.map((assignment) => (
                        <Card
                            key={assignment.assignment_id}
                            variant="outlined"
                            sx={{ borderRadius: 3 }}
                        >
                            <CardContent>
                                <Typography variant="h6" fontWeight={700}>
                                    {assignment.incident_title ||
                                        "Untitled Incident"}
                                </Typography>

                                <Typography color="text.secondary" sx={{ mt: 1 }}>
                                    Severity: {assignment.severity || "Unknown"}
                                </Typography>

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{ mt: 2 }}
                                    flexWrap="wrap"
                                >
                                    <Chip
                                        label={`Assignment: ${assignment.assignment_status}`}
                                        color={
                                            assignment.assignment_status ===
                                            "COMPLETED"
                                                ? "success"
                                                : "primary"
                                        }
                                    />

                                    <Chip
                                        label={`Incident: ${assignment.incident_status}`}
                                        variant="outlined"
                                    />
                                </Stack>

                                {assignment.notes && (
                                    <Typography sx={{ mt: 2 }}>
                                        Notes: {assignment.notes}
                                    </Typography>
                                )}

                                {assignment.assigned_at && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mt: 2 }}
                                    >
                                        Assigned:{" "}
                                        {new Date(
                                            assignment.assigned_at
                                        ).toLocaleString()}
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}
        </Box>
    );
};

export default VolunteerSelfDashboard;
