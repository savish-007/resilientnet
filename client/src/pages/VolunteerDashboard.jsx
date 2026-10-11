
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
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import GroupsIcon from "@mui/icons-material/Groups";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";

const API_BASE = "http://localhost:5000/api";

const VolunteerDashboard = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [incidents, setIncidents] = useState([]);

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

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            await Promise.all([
                fetchVolunteers(),
                fetchIncidents()
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
                throw new Error(
                    data.message || "Failed to assign volunteer."
                );
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
            throw new Error(
                data.message || "Failed to update volunteer availability."
            );
        }

        setVolunteers((current) =>
            current.map((item) =>
                String(item.id) === String(volunteer.id)
                    ? {
                          ...item,
                          availability: data.volunteer.availability
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


    const selectedVolunteerDetails = volunteers.find(
        (volunteer) =>
            String(volunteer.id) === String(selectedVolunteer)
    );

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "70vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2
                }}
            >
                <CircularProgress />
                <Typography color="text.secondary">
                    Loading volunteer dashboard...
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                p: { xs: 2, md: 4 },
                maxWidth: 1500,
                mx: "auto"
            }}
        >
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h4"
                    fontWeight={800}
                    gutterBottom
                >
                    Volunteer Management
                </Typography>

                <Typography color="text.secondary">
                    Monitor volunteer availability and coordinate
                    emergency incident assignments.
                </Typography>
            </Box>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            )}

            {success && (
                <Alert
                    severity="success"
                    sx={{ mb: 2 }}
                    onClose={() => setSuccess("")}
                >
                    {success}
                </Alert>
            )}

            {/* Summary cards */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: 2.5,
                    mb: 4
                }}
            >
                {[
                    {
                        label: "Total Volunteers",
                        value: stats.total,
                        icon: <GroupsIcon />,
                        color: "#1976d2"
                    },
                    {
                        label: "Available",
                        value: stats.available,
                        icon: <CheckCircleIcon />,
                        color: "#2e7d32"
                    },
                    {
                        label: "Unavailable",
                        value: stats.unavailable,
                        icon: <PersonOffIcon />,
                        color: "#ed6c02"
                    },
                    {
                        label: "Open Incidents",
                        value: incidents.filter(
                            (incident) => incident.status !== "RESOLVED"
                        ).length,
                        icon: <VolunteerActivismIcon />,
                        color: "#7b1fa2"
                    }
                ].map((stat) => (
                    <Card
                        key={stat.label}
                        elevation={0}
                        sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 3
                        }}
                    >
                        <CardContent>
                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                            >
                                <Box>
                                    <Typography
                                        color="text.secondary"
                                        variant="body2"
                                    >
                                        {stat.label}
                                    </Typography>

                                    <Typography
                                        variant="h4"
                                        fontWeight={800}
                                        sx={{ mt: 1 }}
                                    >
                                        {stat.value}
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 48,
                                        height: 48,
                                        borderRadius: 2,
                                        bgcolor: `${stat.color}15`,
                                        color: stat.color
                                    }}
                                >
                                    {stat.icon}
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* Volunteer list and filters */}
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 3
                }}
            >
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        Volunteers
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        Showing {filteredVolunteers.length} of{" "}
                        {volunteers.length} volunteers
                    </Typography>
                </Box>

                <Button
                    variant="outlined"
                    onClick={loadData}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        md: "2fr 1fr"
                    },
                    gap: 2,
                    mb: 3
                }}
            >
                <TextField
                    fullWidth
                    placeholder="Search by name, email, phone, or skills"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        )
                    }}
                />

                <FormControl fullWidth>
                    <InputLabel id="availability-filter-label">
                        Availability
                    </InputLabel>

                    <Select
                        labelId="availability-filter-label"
                        value={availabilityFilter}
                        label="Availability"
                        onChange={(event) =>
                            setAvailabilityFilter(event.target.value)
                        }
                    >
                        <MenuItem value="ALL">All Volunteers</MenuItem>
                        <MenuItem value="AVAILABLE">Available</MenuItem>
                        <MenuItem value="UNAVAILABLE">Unavailable</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {volunteers.length === 0 ? (
                <Card
                    variant="outlined"
                    sx={{ borderRadius: 3, textAlign: "center", p: 3 }}
                >
                    <CardContent>
                        <GroupsIcon
                            sx={{ fontSize: 48, color: "text.secondary" }}
                        />

                        <Typography variant="h6" sx={{ mt: 1 }}>
                            No volunteers found
                        </Typography>

                        <Typography color="text.secondary">
                            Volunteers will appear here once they are
                            registered in the system.
                        </Typography>
                    </CardContent>
                </Card>
            ) : filteredVolunteers.length === 0 ? (
                <Alert severity="info">
                    No volunteers match your search or availability filter.
                </Alert>
            ) : (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
                        gap: 3
                    }}
                >
                    {filteredVolunteers.map((volunteer) => (
                        <Card
                            key={volunteer.id}
                            elevation={0}
                            sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 3,
                                transition: "0.2s",
                                "&:hover": {
                                    boxShadow: 3,
                                    transform: "translateY(-2px)"
                                }
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="flex-start"
                                    spacing={1}
                                >
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                            variant="h6"
                                            fontWeight={700}
                                            sx={{
                                                overflowWrap: "anywhere"
                                            }}
                                        >
                                            {volunteer.full_name || "Unnamed Volunteer"}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ overflowWrap: "anywhere" }}
                                        >
                                            {volunteer.email || "No email"}
                                        </Typography>
                                    </Box>

                                    <Chip
                                        label={getAvailabilityLabel(
                                            volunteer.availability
                                        )}
                                        color={getAvailabilityColor(
                                            volunteer.availability
                                        )}
                                        size="small"
                                    />
                                </Stack>

                                <Box
                                    sx={{
                                        mt: 2.5,
                                        display: "grid",
                                        gap: 1.5
                                    }}
                                >
                                    <Typography variant="body2">
                                        <strong>Phone:</strong>{" "}
                                        {volunteer.phone || "N/A"}
                                    </Typography>

                                    <Typography variant="body2">
                                        <strong>Skills:</strong>{" "}
                                        {volunteer.skills || "Not specified"}
                                    </Typography>

                                    <Typography variant="body2">
                                        <strong>Location:</strong>{" "}
                                        {volunteer.latitude != null &&
                                        volunteer.longitude != null
                                            ? `${Number(volunteer.latitude).toFixed(4)}, ${Number(volunteer.longitude).toFixed(4)}`
                                            : "Not available"}
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        <strong>Last seen:</strong>{" "}
                                        {volunteer.last_seen
                                            ? new Date(
                                                volunteer.last_seen
                                            ).toLocaleString()
                                            : "N/A"}
                                    </Typography>
                                </Box>

                                
                                <Button
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 3, py: 1.2 }}
                                    disabled={!isAvailable(volunteer.availability)}
                                    onClick={() => openAssignmentDialog(volunteer)}
                                >
                                    Assign to Incident
                                </Button>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color={isAvailable(volunteer.availability) ? "warning" : "success"}
                                    sx={{ mt: 1 }}
                                    onClick={() =>
                                        handleAvailabilityChange(
                                            volunteer,
                                            isAvailable(volunteer.availability)
                                                ? "UNAVAILABLE"
                                                : "AVAILABLE"
                                        )
                                    }
                                >
                                    {isAvailable(volunteer.availability)
                                        ? "Mark Unavailable"
                                        : "Mark Available"}
                                </Button>

                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {/* Assignment dialog */}
            <Dialog
                open={openAssignDialog}
                onClose={closeAssignmentDialog}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Assign Volunteer to Incident</DialogTitle>

                <DialogContent>
                    {selectedVolunteerDetails && (
                        <Box
                            sx={{
                                mt: 1,
                                mb: 2,
                                p: 2,
                                bgcolor: "action.hover",
                                borderRadius: 2
                            }}
                        >
                            <Typography fontWeight={700}>
                                {selectedVolunteerDetails.full_name}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {selectedVolunteerDetails.email}
                            </Typography>
                        </Box>
                    )}

                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel id="incident-select-label">
                            Incident
                        </InputLabel>

                        <Select
                            labelId="incident-select-label"
                            value={selectedIncident}
                            label="Incident"
                            onChange={(event) =>
                                setSelectedIncident(event.target.value)
                            }
                        >
                            {incidents
                                .filter(
                                    (incident) =>
                                        incident.status !== "RESOLVED"
                                )
                                .map((incident) => (
                                    <MenuItem
                                        key={incident.id}
                                        value={incident.id}
                                    >
                                        {incident.incident_number
                                            ? `${incident.incident_number} — `
                                            : ""}
                                        {incident.title || "Untitled incident"}
                                        {" · "}
                                        {incident.severity || "Unknown severity"}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>

                    {incidents.filter(
                        (incident) => incident.status !== "RESOLVED"
                    ).length === 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            There are no unresolved incidents available for
                            assignment.
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Assignment Notes"
                        placeholder="Describe the volunteer's responsibilities..."
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={closeAssignmentDialog}
                        disabled={assigning}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleAssign}
                        disabled={
                            assigning ||
                            !selectedIncident ||
                            !selectedVolunteer
                        }
                    >
                        {assigning ? (
                            <>
                                <CircularProgress
                                    size={18}
                                    color="inherit"
                                    sx={{ mr: 1 }}
                                />
                                Assigning...
                            </>
                        ) : (
                            "Confirm Assignment"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default VolunteerDashboard;