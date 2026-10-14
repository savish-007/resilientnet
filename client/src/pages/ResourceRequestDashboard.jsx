import { useEffect, useMemo, useState } from "react";
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
    LinearProgress,
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

import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import { API_BASE_URL } from "../config/apiConfig";

const ResourceRequestDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [incidents, setIncidents] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [openDialog, setOpenDialog] = useState(false);
    const [creating, setCreating] = useState(false);
    const [editingRequestId, setEditingRequestId] = useState(null);
    const [formError, setFormError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [priorityFilter, setPriorityFilter] = useState("ALL");

    const [formData, setFormData] = useState({
        incident_id: "",
        resource_category: "",
        resource_name: "",
        quantity_requested: "",
        quantity_allocated: 0,
        unit: "Packs",
        priority: "MEDIUM",
        status: "REQUESTED",
        notes: ""
    });

    const token = localStorage.getItem("token");

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_BASE_URL}/resource-requests`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to load requests");

            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const fetchIncidents = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/incidents`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setIncidents(data);
            }
        } catch (err) {
            console.error("Failed to load incidents:", err);
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchIncidents();
    }, []);

    const stats = useMemo(() => {
        const total = requests.length;
        const critical = requests.filter((r) => r.priority === "CRITICAL" || r.priority === "HIGH").length;
        const pending = requests.filter((r) => r.status === "REQUESTED").length;
        const fulfilled = requests.filter((r) => r.status === "FULFILLED").length;

        return { total, critical, pending, fulfilled };
    }, [requests]);

    const filteredRequests = useMemo(() => {
        const query = search.trim().toLowerCase();

        return requests.filter((item) => {
            const matchesSearch = [
                item.resource_name,
                item.resource_category,
                item.requested_by_name,
                item.incident_number,
                item.notes
            ].some((val) => String(val || "").toLowerCase().includes(query));

            const matchesStatus =
                statusFilter === "ALL" || item.status === statusFilter;

            const matchesPriority =
                priorityFilter === "ALL" || item.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [requests, search, statusFilter, priorityFilter]);

    const resetForm = () => {
        setFormData({
            incident_id: incidents[0]?.id || "",
            resource_category: "Drinking Water",
            resource_name: "",
            quantity_requested: "",
            quantity_allocated: 0,
            unit: "Packs",
            priority: "MEDIUM",
            status: "REQUESTED",
            notes: ""
        });
        setFormError("");
    };

    const handleOpenDialog = () => {
        resetForm();
        setEditingRequestId(null);
        setOpenDialog(true);
    };

    const handleEditRequest = (req) => {
        setFormError("");
        setEditingRequestId(req.id);
        setFormData({
            incident_id: req.incident_id || incidents[0]?.id || "",
            resource_category: req.resource_category || "Drinking Water",
            resource_name: req.resource_name || "",
            quantity_requested: req.quantity_requested ?? "",
            quantity_allocated: req.quantity_allocated ?? 0,
            unit: req.unit || "Packs",
            priority: req.priority || "MEDIUM",
            status: req.status || "REQUESTED",
            notes: req.notes || ""
        });
        setOpenDialog(true);
    };

    const handleSaveRequest = async () => {
        if (!formData.resource_name.trim() || formData.quantity_requested === "" || !formData.unit) {
            setFormError("Resource name, quantity, and unit are required.");
            return;
        }

        setCreating(true);
        setFormError("");

        try {
            const isEditing = Boolean(editingRequestId);
            const url = isEditing
                ? `${API_BASE_URL}/resource-requests/${editingRequestId}`
                : `${API_BASE_URL}/resource-requests`;

            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    incident_id: formData.incident_id || null,
                    resource_category: formData.resource_category.trim(),
                    resource_name: formData.resource_name.trim(),
                    quantity_requested: Number(formData.quantity_requested),
                    quantity_allocated: Number(formData.quantity_allocated) || 0,
                    unit: formData.unit.trim(),
                    priority: formData.priority,
                    status: formData.status,
                    notes: formData.notes?.trim() || null
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to save request");

            setOpenDialog(false);
            resetForm();
            fetchRequests();
        } catch (err) {
            setFormError(err.message || "Failed to save request");
        } finally {
            setCreating(false);
        }
    };

    const getPriorityBadge = (priority) => {
        if (priority === "CRITICAL") return { bg: "#FEE2E2", text: "#DC2626", label: "Critical" };
        if (priority === "HIGH") return { bg: "#FEF3C7", text: "#D97706", label: "High" };
        return { bg: "#E0F2FE", text: "#0284C7", label: "Medium" };
    };

    const getStatusBadge = (status) => {
        if (status === "FULFILLED") return { bg: "#DCFCE7", text: "#15803D", label: "Fulfilled" };
        if (status === "ALLOCATED") return { bg: "#E0F2FE", text: "#0284C7", label: "Allocated" };
        return { bg: "#FEF3C7", text: "#D97706", label: "Requested" };
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
                    {/* Header */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 3.5,
                            flexWrap: "wrap",
                            gap: 2
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                                component="img"
                                src="/logo.png"
                                alt="ResilientNet Logo"
                                sx={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: "16px",
                                    boxShadow: "0 4px 14px rgba(2, 132, 199, 0.2)",
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
                                    Emergency Resource Requests
                                </Typography>
                                <Typography variant="body2" sx={{ color: "#64748B", mt: 0.3 }}>
                                    Review and fulfill supply requests from disaster zones, shelters, and citizens.
                                </Typography>
                            </Box>
                        </Stack>

                        <Button
                            variant="contained"
                            onClick={handleOpenDialog}
                            startIcon={<AddRoundedIcon />}
                            sx={{
                                minHeight: 46,
                                px: 3,
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)",
                                fontWeight: 750,
                                textTransform: "none",
                                boxShadow: "0 6px 20px rgba(2, 132, 199, 0.28)",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #0369A1 0%, #0284C7 100%)"
                                }
                            }}
                        >
                            Create Supply Request
                        </Button>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
                            {error}
                        </Alert>
                    )}

                    {/* Summary Cards */}
                    <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                        {[
                            {
                                label: "Total Requests",
                                value: stats.total,
                                sub: "All time requests",
                                icon: <AssignmentRoundedIcon />,
                                color: "#2563EB",
                                bg: "#EFF6FF"
                            },
                            {
                                label: "High / Critical",
                                value: stats.critical,
                                sub: "Life safety urgency",
                                icon: <WarningAmberRoundedIcon />,
                                color: "#DC2626",
                                bg: "#FEE2E2"
                            },
                            {
                                label: "Pending Allocation",
                                value: stats.pending,
                                sub: "Awaiting dispatch",
                                icon: <HourglassTopRoundedIcon />,
                                color: "#D97706",
                                bg: "#FEF3C7"
                            },
                            {
                                label: "Fulfilled / Delivered",
                                value: stats.fulfilled,
                                sub: "Completed deliveries",
                                icon: <CheckCircleRoundedIcon />,
                                color: "#16A34A",
                                bg: "#DCFCE7"
                            }
                        ].map((stat) => (
                            <Grid item xs={12} sm={6} md={3} key={stat.label}>
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

                    {/* Filters & Search */}
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
                            placeholder="Search requests by item, requester, or incident..."
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
                                        <SearchRoundedIcon sx={{ color: "#94A3B8" }} />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <FormControl sx={{ minWidth: 150 }}>
                            <InputLabel id="status-filter">Status</InputLabel>
                            <Select
                                labelId="status-filter"
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={{ borderRadius: "12px", bgcolor: "#F8FAFC" }}
                            >
                                <MenuItem value="ALL">All Statuses</MenuItem>
                                <MenuItem value="REQUESTED">Requested</MenuItem>
                                <MenuItem value="ALLOCATED">Allocated</MenuItem>
                                <MenuItem value="FULFILLED">Fulfilled</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 150 }}>
                            <InputLabel id="priority-filter">Priority</InputLabel>
                            <Select
                                labelId="priority-filter"
                                value={priorityFilter}
                                label="Priority"
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                sx={{ borderRadius: "12px", bgcolor: "#F8FAFC" }}
                            >
                                <MenuItem value="ALL">All Priorities</MenuItem>
                                <MenuItem value="CRITICAL">Critical</MenuItem>
                                <MenuItem value="HIGH">High</MenuItem>
                                <MenuItem value="MEDIUM">Medium</MenuItem>
                            </Select>
                        </FormControl>
                    </Paper>

                    {/* Requests Grid */}
                    {loading ? (
                        <Box sx={{ py: 8, textAlign: "center" }}>
                            <CircularProgress size={36} />
                            <Typography sx={{ mt: 2, color: "#64748B", fontWeight: 600 }}>
                                Loading resource requests...
                            </Typography>
                        </Box>
                    ) : filteredRequests.length === 0 ? (
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
                            <AssignmentRoundedIcon sx={{ fontSize: 48, color: "#94A3B8", mb: 1.5 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: "#334155" }}>
                                No resource requests found
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
                                No requests currently match the selected filters.
                            </Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={2.5}>
                            {filteredRequests.map((req) => {
                                const priority = getPriorityBadge(req.priority);
                                const status = getStatusBadge(req.status);
                                const progress = Math.min(
                                    100,
                                    Math.round(((req.quantity_allocated || 0) / (req.quantity_requested || 1)) * 100)
                                );

                                return (
                                    <Grid item xs={12} sm={6} md={4} key={req.id}>
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
                                                    <Chip
                                                        label={priority.label}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 800,
                                                            bgcolor: priority.bg,
                                                            color: priority.text,
                                                            borderRadius: "8px"
                                                        }}
                                                    />

                                                    <Chip
                                                        label={status.label}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 800,
                                                            bgcolor: status.bg,
                                                            color: status.text,
                                                            borderRadius: "8px"
                                                        }}
                                                    />
                                                </Stack>

                                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5, lineHeight: 1.3 }}>
                                                    {req.resource_name}
                                                </Typography>

                                                <Typography variant="body2" sx={{ color: "#64748B", mb: 2 }}>
                                                    Category: <strong>{req.resource_category}</strong>
                                                </Typography>

                                                {/* Fulfillment Progress Bar */}
                                                <Paper elevation={0} sx={{ p: 1.5, borderRadius: "12px", bgcolor: "#F8FAFC", border: "1px solid #F1F5F9", mb: 2 }}>
                                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.8 }}>
                                                        <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700 }}>
                                                            ALLOCATED / NEEDED
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: "#0F172A", fontWeight: 800 }}>
                                                            {req.quantity_allocated || 0} / {req.quantity_requested} {req.unit} ({progress}%)
                                                        </Typography>
                                                    </Stack>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={progress}
                                                        sx={{
                                                            height: 8,
                                                            borderRadius: 4,
                                                            bgcolor: "#E2E8F0",
                                                            "& .MuiLinearProgress-bar": {
                                                                borderRadius: 4,
                                                                bgcolor: progress === 100 ? "#10B981" : "#0284C7"
                                                            }
                                                        }}
                                                    />
                                                </Paper>

                                                <Typography variant="caption" sx={{ color: "#94A3B8", display: "block" }}>
                                                    Requested by: <strong style={{ color: "#475569" }}>{req.requested_by_name || "Citizen / Field Worker"}</strong>
                                                </Typography>
                                                {req.notes && (
                                                    <Typography variant="caption" sx={{ color: "#64748B", fontStyle: "italic", mt: 0.5, display: "block" }}>
                                                        "{req.notes}"
                                                    </Typography>
                                                )}
                                            </Box>

                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                startIcon={<LocalShippingRoundedIcon />}
                                                onClick={() => handleEditRequest(req)}
                                                sx={{
                                                    mt: 2,
                                                    borderRadius: "10px",
                                                    textTransform: "none",
                                                    fontWeight: 750,
                                                    borderColor: "#CBD5E1",
                                                    color: "#0F172A",
                                                    "&:hover": { borderColor: "#0284C7", bgcolor: "#EFF6FF" }
                                                }}
                                            >
                                                Allocate & Manage
                                            </Button>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}

                    {/* Allocate / Edit Dialog */}
                    <Dialog
                        open={openDialog}
                        onClose={() => !creating && setOpenDialog(false)}
                        maxWidth="sm"
                        fullWidth
                        PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}
                    >
                        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
                            {editingRequestId ? "Manage Resource Allocation" : "Create Resource Request"}
                        </DialogTitle>

                        <DialogContent>
                            {formError && (
                                <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
                                    {formError}
                                </Alert>
                            )}

                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Item Name"
                                    value={formData.resource_name}
                                    onChange={(e) => setFormData({ ...formData, resource_name: e.target.value })}
                                    required
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                                />

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Category"
                                            value={formData.resource_category}
                                            onChange={(e) => setFormData({ ...formData, resource_category: e.target.value })}
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                                        >
                                            {["Drinking Water", "Food & Rations", "First Aid & Medicine", "Blankets & Shelter", "Hygiene Supplies"].map((c) => (
                                                <MenuItem key={c} value={c}>{c}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Priority</InputLabel>
                                            <Select
                                                value={formData.priority}
                                                label="Priority"
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                sx={{ borderRadius: "12px" }}
                                            >
                                                <MenuItem value="CRITICAL">🔴 Critical</MenuItem>
                                                <MenuItem value="HIGH">🟡 High</MenuItem>
                                                <MenuItem value="MEDIUM">🟢 Medium</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Quantity Requested"
                                            value={formData.quantity_requested}
                                            onChange={(e) => setFormData({ ...formData, quantity_requested: e.target.value })}
                                            required
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                                        />
                                    </Grid>

                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Unit"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            required
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                                        />
                                    </Grid>
                                </Grid>

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Quantity Allocated"
                                            value={formData.quantity_allocated}
                                            onChange={(e) => setFormData({ ...formData, quantity_allocated: e.target.value })}
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                                        />
                                    </Grid>

                                    <Grid item xs={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Status</InputLabel>
                                            <Select
                                                value={formData.status}
                                                label="Status"
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                sx={{ borderRadius: "12px" }}
                                            >
                                                <MenuItem value="REQUESTED">Requested</MenuItem>
                                                <MenuItem value="ALLOCATED">Allocated</MenuItem>
                                                <MenuItem value="FULFILLED">Fulfilled</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Notes & Logistics Details"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                                />
                            </Stack>
                        </DialogContent>

                        <DialogActions sx={{ px: 3, pb: 2 }}>
                            <Button onClick={() => setOpenDialog(false)} disabled={creating} sx={{ borderRadius: "10px", color: "#64748B", fontWeight: 700 }}>
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSaveRequest}
                                disabled={creating}
                                sx={{ borderRadius: "10px", px: 3, fontWeight: 750, bgcolor: "#0284C7", textTransform: "none" }}
                            >
                                {creating ? <CircularProgress size={20} color="inherit" /> : "Save Allocation"}
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ResourceRequestDashboard;