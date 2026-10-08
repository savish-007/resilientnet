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
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from "@mui/material";

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

            const response = await fetch(
                "http://localhost:5000/api/resources",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load resources"
                );
            }

            setResources(data);

        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to load resources");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/organizations",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load organizations"
                );
            }

            setOrganizations(data);

        } catch (err) {
            console.error(err);
            setFormError(
                err.message || "Failed to load organizations"
            );
        }
    };

    useEffect(() => {
        fetchResources();
        fetchOrganizations();
    }, []);

    const categories = useMemo(() => {
        return [
            "ALL",
            ...new Set(
                resources
                    .map((resource) => resource.category)
                    .filter(Boolean)
            )
        ];
    }, [resources]);

    const filteredResources = useMemo(() => {
        const searchValue = search.toLowerCase().trim();

        return resources.filter((resource) => {
            const matchesSearch =
                !searchValue ||
                resource.name?.toLowerCase().includes(searchValue) ||
                resource.category?.toLowerCase().includes(searchValue) ||
                resource.organization_name
                    ?.toLowerCase()
                    .includes(searchValue);

            const matchesStatus =
                statusFilter === "ALL" ||
                resource.status === statusFilter;

            const matchesCategory =
                categoryFilter === "ALL" ||
                resource.category === categoryFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesCategory
            );
        });
    }, [
        resources,
        search,
        statusFilter,
        categoryFilter
    ]);

    const getStatusColor = (status) => {
        switch (status) {
            case "AVAILABLE":
                return "success";

            case "BUSY":
                return "warning";

            case "MAINTENANCE":
                return "info";

            case "OFFLINE":
                return "error";

            default:
                return "default";
        }
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
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
            organization_id: resource.organization_id || "",
            name: resource.name || "",
            description: resource.description || "",
            category: resource.category || "",
            quantity: resource.quantity ?? "",
            unit: resource.unit || "",
            latitude: resource.latitude ?? "",
            longitude: resource.longitude ?? "",
            status: resource.status || "AVAILABLE"
        });

        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        if (creating) {
            return;
        }

        setOpenDialog(false);
        setEditingResourceId(null);
        setFormError("");
    };

    const handleCreateResource = async () => {
        try {
            setFormError("");

            if (
                !formData.organization_id ||
                !formData.name ||
                !formData.category ||
                formData.quantity === "" ||
                !formData.unit
            ) {
                setFormError(
                    "Organization, name, category, quantity and unit are required."
                );
                return;
            }

            setCreating(true);

            const response = await fetch(
                "http://localhost:5000/api/resources",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        organization_id: formData.organization_id,
                        name: formData.name,
                        description: formData.description || null,
                        category: formData.category,
                        quantity: Number(formData.quantity),
                        unit: formData.unit,
                        latitude:
                            formData.latitude === ""
                                ? null
                                : Number(formData.latitude),
                        longitude:
                            formData.longitude === ""
                                ? null
                                : Number(formData.longitude),
                        status: formData.status
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to create resource"
                );
            }

            setResources((prev) => [
                data.resource,
                ...prev
            ]);

            setOpenDialog(false);
            resetForm();

        } catch (err) {
            console.error(err);

            setFormError(
                err.message || "Failed to create resource"
            );
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateResource = async () => {
        try {
            setFormError("");

            if (
                !formData.organization_id ||
                !formData.name ||
                !formData.category ||
                formData.quantity === "" ||
                !formData.unit
            ) {
                setFormError(
                    "Organization, name, category, quantity and unit are required."
                );
                return;
            }

            setCreating(true);

            const response = await fetch(
                `http://localhost:5000/api/resources/${editingResourceId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        organization_id: formData.organization_id,
                        name: formData.name,
                        description: formData.description || null,
                        category: formData.category,
                        quantity: Number(formData.quantity),
                        unit: formData.unit,
                        latitude:
                            formData.latitude === ""
                                ? null
                                : Number(formData.latitude),
                        longitude:
                            formData.longitude === ""
                                ? null
                                : Number(formData.longitude),
                        status: formData.status
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update resource"
                );
            }

            const updatedResource = data.resource || data;

            setResources((prev) =>
                prev.map((resource) =>
                    resource.id === editingResourceId
                        ? updatedResource
                        : resource
                )
            );

            setOpenDialog(false);
            setEditingResourceId(null);
            resetForm();
        } catch (err) {
            console.error(err);

            setFormError(
                err.message || "Failed to update resource"
            );
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteResource = async () => {
        if (!deletingResource) {
            return;
        }

        try {
            setFormError("");

            const response = await fetch(
                `http://localhost:5000/api/resources/${deletingResource.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to delete resource"
                );
            }

            setResources((prev) =>
                prev.filter(
                    (resource) => resource.id !== deletingResource.id
                )
            );

            setDeletingResource(null);
        } catch (err) {
            console.error(err);
            setFormError(
                err.message || "Failed to delete resource"
            );
        }
    };

    return (
        <Box sx={{ p: 3 }}>

            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                    gap: 2,
                    flexWrap: "wrap"
                }}
            >
                <Box>
                    <Typography
                        variant="h4"
                        fontWeight="700"
                    >
                        Resource Management
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        Monitor emergency resources and their availability.
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    onClick={handleOpenDialog}
                >
                    Add Resource
                </Button>
            </Box>


            {/* Filters */}
            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    mb: 3
                }}
            >

                <TextField
                    label="Search resources"
                    placeholder="Name, category, organization..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{
                        minWidth: 280,
                        flex: 1
                    }}
                />

                <FormControl sx={{ minWidth: 180 }}>
                    <InputLabel>Status</InputLabel>

                    <Select
                        value={statusFilter}
                        label="Status"
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                    >
                        <MenuItem value="ALL">
                            All Statuses
                        </MenuItem>

                        <MenuItem value="AVAILABLE">
                            Available
                        </MenuItem>

                        <MenuItem value="BUSY">
                            Busy
                        </MenuItem>

                        <MenuItem value="MAINTENANCE">
                            Maintenance
                        </MenuItem>

                        <MenuItem value="OFFLINE">
                            Offline
                        </MenuItem>
                    </Select>
                </FormControl>


                <FormControl sx={{ minWidth: 180 }}>
                    <InputLabel>Category</InputLabel>

                    <Select
                        value={categoryFilter}
                        label="Category"
                        onChange={(e) =>
                            setCategoryFilter(e.target.value)
                        }
                    >
                        {categories.map((category) => (
                            <MenuItem
                                key={category}
                                value={category}
                            >
                                {category === "ALL"
                                    ? "All Categories"
                                    : category}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

            </Box>


            {/* Resource count */}
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
            >
                {filteredResources.length} resource
                {filteredResources.length !== 1 ? "s" : ""}
            </Typography>


            {/* Error */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                >
                    {error}
                </Alert>
            )}


            {/* Resource list */}
            {loading ? (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        py: 8
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : filteredResources.length === 0 ? (
                <Alert severity="info">
                    No resources match the selected filters.
                </Alert>
            ) : (
                <Grid
                    container
                    spacing={3}
                >
                    {filteredResources.map((resource) => (
                        <Grid
                            key={resource.id}
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 4
                            }}
                        >
                            <Card
                                sx={{
                                    height: "100%",
                                    borderRadius: 2
                                }}
                            >
                                <CardContent>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            gap: 2,
                                            mb: 2
                                        }}
                                    >
                                        <Typography
                                            variant="h6"
                                            fontWeight="700"
                                        >
                                            {resource.name}
                                        </Typography>

                                        <Chip
                                            label={resource.status}
                                            color={getStatusColor(
                                                resource.status
                                            )}
                                            size="small"
                                        />
                                    </Box>


                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mb: 1 }}
                                    >
                                        Category:{" "}
                                        <strong>
                                            {resource.category}
                                        </strong>
                                    </Typography>


                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mb: 1 }}
                                    >
                                        Quantity:{" "}
                                        <strong>
                                            {resource.quantity}{" "}
                                            {resource.unit}
                                        </strong>
                                    </Typography>


                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mb: 1 }}
                                    >
                                        Organization:{" "}
                                        <strong>
                                            {resource.organization_name ||
                                                "Not assigned"}
                                        </strong>
                                    </Typography>


                                    {resource.description && (
                                        <Typography
                                            variant="body2"
                                            sx={{ mt: 2 }}
                                        >
                                            {resource.description}
                                        </Typography>
                                    )}


                                    {resource.latitude != null &&
                                        resource.longitude != null && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    display: "block",
                                                    mt: 2
                                                }}
                                            >
                                                Location:{" "}
                                                {Number(
                                                    resource.latitude
                                                ).toFixed(4)}
                                                ,{" "}
                                                {Number(
                                                    resource.longitude
                                                ).toFixed(4)}
                                            </Typography>
                                        )}

                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "flex-end",
                                            gap: 1,
                                            mt: 2
                                        }}
                                    >
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() =>
                                                handleEditResource(resource)
                                            }
                                        >
                                            Edit
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            onClick={() =>
                                                setDeletingResource(resource)
                                            }
                                        >
                                            Delete
                                        </Button>
                                    </Box>

                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}


            {/* Add Resource Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    {editingResourceId
                        ? "Edit Emergency Resource"
                        : "Add Emergency Resource"}
                </DialogTitle>

                <DialogContent>

                    {formError && (
                        <Alert
                            severity="error"
                            sx={{ mt: 1, mb: 2 }}
                        >
                            {formError}
                        </Alert>
                    )}

                    <FormControl
                        fullWidth
                        sx={{ mt: 1 }}
                    >
                        <InputLabel>
                            Organization
                        </InputLabel>

                        <Select
                            name="organization_id"
                            value={formData.organization_id}
                            label="Organization"
                            onChange={handleFormChange}
                        >
                            {organizations.map((organization) => (
                                <MenuItem
                                    key={organization.id}
                                    value={organization.id}
                                >
                                    {organization.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>


                    <TextField
                        fullWidth
                        label="Resource Name"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        margin="normal"
                    />


                    <TextField
                        fullWidth
                        label="Category"
                        name="category"
                        value={formData.category}
                        onChange={handleFormChange}
                        placeholder="Medical, Rescue, Fire..."
                        margin="normal"
                    />


                    <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleFormChange}
                        multiline
                        rows={3}
                        margin="normal"
                    />


                    <Box
                        sx={{
                            display: "flex",
                            gap: 2
                        }}
                    >
                        <TextField
                            fullWidth
                            label="Quantity"
                            name="quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={handleFormChange}
                            margin="normal"
                            inputProps={{
                                min: 0
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Unit"
                            name="unit"
                            value={formData.unit}
                            onChange={handleFormChange}
                            placeholder="kits, vehicles, packets..."
                            margin="normal"
                        />
                    </Box>


                    <Box
                        sx={{
                            display: "flex",
                            gap: 2
                        }}
                    >
                        <TextField
                            fullWidth
                            label="Latitude"
                            name="latitude"
                            type="number"
                            value={formData.latitude}
                            onChange={handleFormChange}
                            margin="normal"
                        />

                        <TextField
                            fullWidth
                            label="Longitude"
                            name="longitude"
                            type="number"
                            value={formData.longitude}
                            onChange={handleFormChange}
                            margin="normal"
                        />
                    </Box>


                    <FormControl
                        fullWidth
                        sx={{ mt: 1 }}
                    >
                        <InputLabel>
                            Status
                        </InputLabel>

                        <Select
                            name="status"
                            value={formData.status}
                            label="Status"
                            onChange={handleFormChange}
                        >
                            <MenuItem value="AVAILABLE">
                                Available
                            </MenuItem>

                            <MenuItem value="BUSY">
                                Busy
                            </MenuItem>

                            <MenuItem value="MAINTENANCE">
                                Maintenance
                            </MenuItem>

                            <MenuItem value="OFFLINE">
                                Offline
                            </MenuItem>
                        </Select>
                    </FormControl>

                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={handleCloseDialog}
                        disabled={creating}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={
                            editingResourceId
                                ? handleUpdateResource
                                : handleCreateResource
                        }
                        disabled={creating}
                    >
                        {creating
                            ? editingResourceId
                                ? "Updating..."
                                : "Creating..."
                            : editingResourceId
                                ? "Update Resource"
                                : "Create Resource"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={Boolean(deletingResource)}
                onClose={() => setDeletingResource(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Delete Resource?</DialogTitle>

                <DialogContent>
                    <Typography>
                        Are you sure you want to delete{" "}
                        <strong>{deletingResource?.name}</strong>?
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                    >
                        This action cannot be undone.
                    </Typography>

                    {formError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {formError}
                        </Alert>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => {
                            setDeletingResource(null);
                            setFormError("");
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteResource}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default ResourceDashboard;