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

import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import { API_BASE_URL } from "../config/apiConfig";

const ResourceDashboard = () => {
    const [resources, setResources] = useState([]);
    const [organizations, setOrganizations] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [openDialog, setOpenDialog] = useState(false);
    const [editingResourceId, setEditingResourceId] = useState(null);
    const [deletingResource, setDeletingResource] = useState(null);
    const [creating, setCreating] = useState(false);
    const [formError, setFormError] = useState("");

    const [formData, setFormData] = useState({
        organization_id: "",
        name: "",
        description: "",
        category: "",
        quantity: "",
        unit: "",
        latitude: "",
        longitude: "",
        status: "AVAILABLE"
    });

    const token = localStorage.getItem("token");

    const fetchResources = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_BASE_URL}/resources`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to load resources");

            setResources(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to load resources");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/organizations`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setOrganizations(data);
            }
        } catch (err) {
            console.error("Failed to load organizations:", err);
        }
    };

    useEffect(() => {
        fetchResources();
        fetchOrganizations();
    }, []);

    const categories = useMemo(() => {
        return [
            "ALL",
            ...new Set(resources.map((r) => r.category).filter(Boolean))
        ];
    }, [resources]);

    const stats = useMemo(() => {
        const total = resources.length;
        const available = resources.filter((r) => r.status === "AVAILABLE").length;
        const allocated = resources.filter((r) => r.status === "ALLOCATED" || r.status === "BUSY").length;
        const depleted = resources.filter((r) => r.status === "DEPLETED" || r.status === "UNAVAILABLE").length;

        return { total, available, allocated, depleted };
    }, [resources]);

    const filteredResources = useMemo(() => {
        const query = search.trim().toLowerCase();

        return resources.filter((resource) => {
            const matchesSearch = [
                resource.name,
                resource.description,
                resource.category,
                resource.organization_name
            ].some((val) => String(val || "").toLowerCase().includes(query));

            const matchesStatus =
                statusFilter === "ALL" || resource.status === statusFilter;

            const matchesCategory =
                categoryFilter === "ALL" || resource.category === categoryFilter;

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [resources, search, statusFilter, categoryFilter]);

    const resetForm = () => {
        setFormData({
            organization_id: organizations[0]?.id || "",
            name: "",
            description: "",
            category: "",
            quantity: "",
            unit: "Packs",
            latitude: "",
            longitude: "",
            status: "AVAILABLE"
        });
        setFormError("");
    };

    const handleOpenDialog = () => {
        resetForm();
        setEditingResourceId(null);
        setOpenDialog(true);
    };

    const handleEditResource = (resource) => {
        setFormError("");
        setEditingResourceId(resource.id);
        setFormData({
            organization_id: resource.organization_id || organizations[0]?.id || "",
            name: resource.name || "",
            description: resource.description || "",
            category: resource.category || "",
            quantity: resource.quantity ?? "",
            unit: resource.unit || "Packs",
            latitude: resource.latitude ?? "",
            longitude: resource.longitude ?? "",
            status: resource.status || "AVAILABLE"
        });
        setOpenDialog(true);
    };

    const handleSaveResource = async () => {
        if (!formData.name.trim() || !formData.category.trim() || formData.quantity === "" || !formData.unit) {
            setFormError("Name, category, quantity, and unit are required.");
            return;
        }

        setCreating(true);
        setFormError("");

        try {
            const isEditing = Boolean(editingResourceId);
            const url = isEditing
                ? `${API_BASE_URL}/resources/${editingResourceId}`
                : `${API_BASE_URL}/resources`;

            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    organization_id: formData.organization_id || null,
                    name: formData.name.trim(),
                    description: formData.description?.trim() || null,
                    category: formData.category.trim(),
                    quantity: Number(formData.quantity),
                    unit: formData.unit.trim(),
                    latitude: formData.latitude === "" ? null : Number(formData.latitude),
                    longitude: formData.longitude === "" ? null : Number(formData.longitude),
                    status: formData.status
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to save resource");

            setOpenDialog(false);
            resetForm();
            fetchResources();
        } catch (err) {
            setFormError(err.message || "Failed to save resource");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteResource = async () => {
        if (!deletingResource) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/resources/${deletingResource.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to delete resource");

            setResources((prev) => prev.filter((r) => r.id !== deletingResource.id));
            setDeletingResource(null);
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusBadge = (status) => {
        if (status === "AVAILABLE") {
            return { label: "Available", bg: "#DCFCE7", text: "#15803D" };
        }
        if (status === "ALLOCATED" || status === "BUSY") {
            return { label: "Allocated", bg: "#E0F2FE", text: "#0284C7" };
        }
        return { label: "Depleted", bg: "#FEE2E2", text: "#DC2626" };
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
                                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.2)",
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
                                    Emergency Resources
                                </Typography>
                                <Typography variant="body2" sx={{ color: "#64748B", mt: 0.3 }}>
                                    Track disaster relief inventory, medical equipment, and distribution assets.
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
                                background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
                                fontWeight: 750,
                                textTransform: "none",
                                boxShadow: "0 6px 20px rgba(16, 185, 129, 0.28)",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #047857 0%, #059669 100%)"
                                }
                            }}
                        >
                            Add New Resource
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
                                label: "Total Assets",
                                value: stats.total,
                                sub: "Cataloged supplies",
                                icon: <Inventory2RoundedIcon />,
                                color: "#2563EB",
                                bg: "#EFF6FF"
                            },
                            {
                                label: "Available Stock",
                                value: stats.available,
                                sub: "Ready for dispatch",
                                icon: <CheckCircleRoundedIcon />,
                                color: "#16A34A",
                                bg: "#DCFCE7"
                            },
                            {
                                label: "Allocated",
                                value: stats.allocated,
                                sub: "Currently deployed",
                                icon: <HourglassTopRoundedIcon />,
                                color: "#0284C7",
                                bg: "#E0F2FE"
                            },
                            {
                                label: "Depleted / Critical",
                                value: stats.depleted,
                                sub: "Needs replenishment",
                                icon: <RemoveCircleOutlineRoundedIcon />,
                                color: "#DC2626",
                                bg: "#FEE2E2"
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

                    {/* Filter & Search Controls */}
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
                            placeholder="Search resources by name, category, or organization..."
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

                        <FormControl sx={{ minWidth: 160 }}>
                            <InputLabel id="category-label">Category</InputLabel>
                            <Select
                                labelId="category-label"
                                value={categoryFilter}
                                label="Category"
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                sx={{ borderRadius: "12px", bgcolor: "#F8FAFC" }}
                            >
                                {categories.map((cat) => (
                                    <MenuItem key={cat} value={cat}>
                                        {cat === "ALL" ? "All Categories" : cat}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 150 }}>
                            <InputLabel id="status-label">Status</InputLabel>
                            <Select
                                labelId="status-label"
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={{ borderRadius: "12px", bgcolor: "#F8FAFC" }}
                            >
                                <MenuItem value="ALL">All Statuses</MenuItem>
                                <MenuItem value="AVAILABLE">Available</MenuItem>
                                <MenuItem value="ALLOCATED">Allocated</MenuItem>
                                <MenuItem value="DEPLETED">Depleted</MenuItem>
                            </Select>
                        </FormControl>
                    </Paper>

                    {/* Resource Grid */}
                    {loading ? (
                        <Box sx={{ py: 8, textAlign: "center" }}>
                            <CircularProgress size={36} />
                            <Typography sx={{ mt: 2, color: "#64748B", fontWeight: 600 }}>
                                Loading inventory records...
                            </Typography>
                        </Box>
                    ) : filteredResources.length === 0 ? (
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
                            <Inventory2RoundedIcon sx={{ fontSize: 48, color: "#94A3B8", mb: 1.5 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: "#334155" }}>
                                No resources found
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
                                Try adjusting your search query or add a new resource to the inventory.
                            </Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={2.5}>
                            {filteredResources.map((resource) => {
                                const badge = getStatusBadge(resource.status);
                                return (
                                    <Grid item xs={12} sm={6} md={4} key={resource.id}>
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
                                                        label={resource.category}
                                                        size="small"
                                                        icon={<CategoryRoundedIcon style={{ fontSize: 14 }} />}
                                                        sx={{
                                                            fontWeight: 700,
                                                            bgcolor: "#F1F5F9",
                                                            color: "#334155",
                                                            borderRadius: "8px"
                                                        }}
                                                    />

                                                    <Chip
                                                        label={badge.label}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 800,
                                                            bgcolor: badge.bg,
                                                            color: badge.text,
                                                            borderRadius: "8px"
                                                        }}
                                                    />
                                                </Stack>

                                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5, lineHeight: 1.3 }}>
                                                    {resource.name}
                                                </Typography>

                                                <Typography variant="body2" sx={{ color: "#64748B", mb: 2, minHeight: 40, lineHeight: 1.5 }}>
                                                    {resource.description || "No additional description provided."}
                                                </Typography>

                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: "12px",
                                                        bgcolor: "#F8FAFC",
                                                        border: "1px solid #F1F5F9",
                                                        mb: 2
                                                    }}
                                                >
                                                    <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                                                        In-Stock Quantity
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A" }}>
                                                        {resource.quantity} <span style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}>{resource.unit}</span>
                                                    </Typography>
                                                </Paper>
                                            </Box>

                                            <Stack direction="row" spacing={1} sx={{ pt: 1, borderTop: "1px solid #F1F5F9" }}>
                                                <Button
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<EditRoundedIcon />}
                                                    onClick={() => handleEditResource(resource)}
                                                    sx={{
                                                        borderRadius: "10px",
                                                        textTransform: "none",
                                                        fontWeight: 700,
                                                        borderColor: "#CBD5E1",
                                                        color: "#334155"
                                                    }}
                                                >
                                                    Edit
                                                </Button>

                                                <Button
                                                    size="small"
                                                    color="error"
                                                    variant="outlined"
                                                    onClick={() => setDeletingResource(resource)}
                                                    sx={{
                                                        minWidth: 42,
                                                        px: 1,
                                                        borderRadius: "10px",
                                                        borderColor: "#FEE2E2",
                                                        color: "#DC2626"
                                                    }}
                                                >
                                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                                </Button>
                                            </Stack>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}

                    {/* Create / Edit Resource Dialog */}
                    <Dialog
                        open={openDialog}
                        onClose={() => !creating && setOpenDialog(false)}
                        maxWidth="sm"
                        fullWidth
                        PaperProps={{
                            sx: {
                                borderRadius: "20px",
                                p: 1
                            }
                        }}
                    >
                        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A", pb: 1 }}>
                            {editingResourceId ? "Edit Emergency Resource" : "Register New Resource"}
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
                                    label="Resource Name"
                                    placeholder="e.g. Clean Water Bottles (500ml)"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                                />

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Category"
                                            placeholder="e.g. Water, Medical, Food, Shelter"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            required
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Status</InputLabel>
                                            <Select
                                                value={formData.status}
                                                label="Status"
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                sx={{ borderRadius: "12px" }}
                                            >
                                                <MenuItem value="AVAILABLE">Available</MenuItem>
                                                <MenuItem value="ALLOCATED">Allocated</MenuItem>
                                                <MenuItem value="DEPLETED">Depleted</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Quantity"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                            inputProps={{ min: 0 }}
                                            required
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                                        />
                                    </Grid>

                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Unit"
                                            placeholder="e.g. Packs, Boxes, Liters"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            required
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                                        />
                                    </Grid>
                                </Grid>

                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Description / Storage Notes"
                                    placeholder="Storage location, handling notes, expiration..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                                />
                            </Stack>
                        </DialogContent>

                        <DialogActions sx={{ px: 3, pb: 2 }}>
                            <Button
                                onClick={() => setOpenDialog(false)}
                                disabled={creating}
                                sx={{ borderRadius: "10px", color: "#64748B", textTransform: "none", fontWeight: 700 }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSaveResource}
                                disabled={creating}
                                sx={{
                                    borderRadius: "10px",
                                    px: 3,
                                    bgcolor: "#10B981",
                                    "&:hover": { bgcolor: "#059669" },
                                    textTransform: "none",
                                    fontWeight: 750
                                }}
                            >
                                {creating ? <CircularProgress size={20} color="inherit" /> : editingResourceId ? "Save Changes" : "Register Resource"}
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <Dialog
                        open={Boolean(deletingResource)}
                        onClose={() => setDeletingResource(null)}
                        PaperProps={{ sx: { borderRadius: "18px", p: 1 } }}
                    >
                        <DialogTitle sx={{ fontWeight: 800, color: "#DC2626" }}>
                            Delete Resource?
                        </DialogTitle>
                        <DialogContent>
                            <Typography sx={{ color: "#475569" }}>
                                Are you sure you want to remove <strong>{deletingResource?.name}</strong> from the emergency inventory? This action cannot be undone.
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2 }}>
                            <Button
                                onClick={() => setDeletingResource(null)}
                                sx={{ borderRadius: "10px", textTransform: "none", color: "#64748B", fontWeight: 700 }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleDeleteResource}
                                sx={{ borderRadius: "10px", px: 2.5, textTransform: "none", fontWeight: 700 }}
                            >
                                Delete
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ResourceDashboard;