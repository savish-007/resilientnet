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

const ResourceRequestDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [incidents, setIncidents] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [openDialog, setOpenDialog] = useState(false);
    const [creating, setCreating] = useState(false);
    const [editingRequestId, setEditingRequestId] = useState(null);
    const [formError, setFormError] = useState("");

    const [statusFilter, setStatusFilter] = useState("ALL");
    const [priorityFilter, setPriorityFilter] = useState("ALL");

    const [formData, setFormData] = useState({
        incident_id: "",
        resource_category: "",
        resource_name: "",
        quantity_requested: "",
        quantity_allocated: 0,
        unit: "",
        priority: "MEDIUM",
        status: "REQUESTED",
        notes: ""
    });

    const token = localStorage.getItem("token");

    // --------------------------------------------------
    // FETCH RESOURCE REQUESTS
    // --------------------------------------------------

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                "http://localhost:5000/api/resource-requests",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to load resource requests"
                );
            }

            setRequests(data);
        } catch (err) {
            console.error(err);

            setError(
                err.message ||
                    "Failed to load resource requests"
            );
        } finally {
            setLoading(false);
        }
    };

    // --------------------------------------------------
    // FETCH INCIDENTS
    // --------------------------------------------------

    const fetchIncidents = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/incidents",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to load incidents"
                );
            }

            setIncidents(data);
        } catch (err) {
            console.error(err);

            setFormError(
                err.message ||
                    "Failed to load incidents"
            );
        }
    };

    // --------------------------------------------------
    // INITIAL LOAD
    // --------------------------------------------------

    useEffect(() => {
        fetchRequests();
        fetchIncidents();
    }, []);

    // --------------------------------------------------
    // FILTER REQUESTS
    // --------------------------------------------------

    const filteredRequests = useMemo(() => {
        return requests.filter((request) => {
            const statusMatch =
                statusFilter === "ALL" ||
                request.status === statusFilter;

            const priorityMatch =
                priorityFilter === "ALL" ||
                request.priority === priorityFilter;

            return statusMatch && priorityMatch;
        });
    }, [
        requests,
        statusFilter,
        priorityFilter
    ]);

    // --------------------------------------------------
    // STATUS COLOR
    // --------------------------------------------------

    const getStatusColor = (status) => {
        switch (status) {
            case "FULFILLED":
                return "success";

            case "REQUESTED":
                return "warning";

            case "ALLOCATED":
                return "info";

            case "CANCELLED":
                return "error";

            default:
                return "default";
        }
    };

    // --------------------------------------------------
    // PRIORITY COLOR
    // --------------------------------------------------

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "HIGH":
                return "error";

            case "MEDIUM":
                return "warning";

            case "LOW":
                return "success";

            default:
                return "default";
        }
    };

    // --------------------------------------------------
    // FORM CHANGE
    // --------------------------------------------------

    const handleFormChange = (event) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // --------------------------------------------------
    // RESET FORM
    // --------------------------------------------------

    const resetForm = () => {
        setFormData({
            incident_id: "",
            resource_category: "",
            resource_name: "",
            quantity_requested: "",
            quantity_allocated: 0,
            unit: "",
            priority: "MEDIUM",
            status: "REQUESTED",
            notes: ""
        });

        setEditingRequestId(null);
        setFormError("");
    };

    // --------------------------------------------------
    // OPEN CREATE DIALOG
    // --------------------------------------------------

    const handleOpenDialog = () => {
        resetForm();
        setOpenDialog(true);
    };

    // --------------------------------------------------
    // CLOSE DIALOG
    // --------------------------------------------------

    const handleCloseDialog = () => {
        if (creating) {
            return;
        }

        setOpenDialog(false);
        resetForm();
    };

    // --------------------------------------------------
    // CREATE REQUEST
    // --------------------------------------------------

    const handleCreateRequest = async () => {
        try {
            setFormError("");

            if (
                !formData.incident_id ||
                !formData.resource_category ||
                !formData.resource_name ||
                formData.quantity_requested === "" ||
                !formData.unit
            ) {
                setFormError(
                    "Incident, category, resource name, quantity and unit are required."
                );

                return;
            }

            if (
                Number(formData.quantity_requested) <= 0
            ) {
                setFormError(
                    "Requested quantity must be greater than 0."
                );

                return;
            }

            setCreating(true);

            const response = await fetch(
                "http://localhost:5000/api/resource-requests",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        incident_id:
                            formData.incident_id,

                        resource_category:
                            formData.resource_category,

                        resource_name:
                            formData.resource_name,

                        quantity_requested:
                            Number(
                                formData.quantity_requested
                            ),

                        unit:
                            formData.unit,

                        priority:
                            formData.priority,

                        notes:
                            formData.notes || null
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to create resource request"
                );
            }

            setRequests((prev) => [
                data.request,
                ...prev
            ]);

            setOpenDialog(false);
            resetForm();
        } catch (err) {
            console.error(err);

            setFormError(
                err.message ||
                    "Failed to create resource request"
            );
        } finally {
            setCreating(false);
        }
    };

    // --------------------------------------------------
    // OPEN EDIT / ALLOCATE DIALOG
    // --------------------------------------------------

    const handleEditRequest = (request) => {
        setEditingRequestId(request.id);

        setFormData({
            incident_id:
                request.incident_id || "",

            resource_category:
                request.resource_category || "",

            resource_name:
                request.resource_name || "",

            quantity_requested:
                request.quantity_requested || "",

            quantity_allocated:
                request.quantity_allocated || 0,

            unit:
                request.unit || "",

            priority:
                request.priority || "MEDIUM",

            status:
                request.status || "REQUESTED",

            notes:
                request.notes || ""
        });

        setFormError("");
        setOpenDialog(true);
    };

    // --------------------------------------------------
    // UPDATE REQUEST
    // --------------------------------------------------

    const handleUpdateRequest = async () => {
        try {
            setFormError("");

            const requestedQuantity =
                Number(
                    formData.quantity_requested
                );

            const allocatedQuantity =
                Number(
                    formData.quantity_allocated
                );

            if (allocatedQuantity < 0) {
                setFormError(
                    "Allocated quantity cannot be negative."
                );

                return;
            }

            if (
                allocatedQuantity >
                requestedQuantity
            ) {
                setFormError(
                    "Allocated quantity cannot exceed the requested quantity."
                );

                return;
            }

            setCreating(true);

            const response = await fetch(
                `http://localhost:5000/api/resource-requests/${editingRequestId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        quantity_allocated:
                            allocatedQuantity,

                        priority:
                            formData.priority,

                        status:
                            formData.status,

                        notes:
                            formData.notes || null
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to update resource request"
                );
            }

            setRequests((prev) =>
                prev.map((request) =>
                    request.id ===
                    editingRequestId
                        ? {
                              ...request,
                              ...data.request
                          }
                        : request
                )
            );

            setOpenDialog(false);
            resetForm();
        } catch (err) {
            console.error(err);

            setFormError(
                err.message ||
                    "Failed to update resource request"
            );
        } finally {
            setCreating(false);
        }
    };

    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <Box sx={{ p: 3 }}>

            {/* HEADER */}

            <Box
                sx={{
                    display: "flex",
                    justifyContent:
                        "space-between",
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
                        Resource Requests
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        Manage emergency resource
                        requests linked to incidents.
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    onClick={handleOpenDialog}
                >
                    New Resource Request
                </Button>
            </Box>

            {/* FILTERS */}

            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    mb: 3,
                    flexWrap: "wrap"
                }}
            >
                <FormControl
                    sx={{ minWidth: 180 }}
                >
                    <InputLabel>
                        Status
                    </InputLabel>

                    <Select
                        value={statusFilter}
                        label="Status"
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value
                            )
                        }
                    >
                        <MenuItem value="ALL">
                            All Statuses
                        </MenuItem>

                        <MenuItem value="REQUESTED">
                            Requested
                        </MenuItem>

                        <MenuItem value="ALLOCATED">
                            Allocated
                        </MenuItem>

                        <MenuItem value="FULFILLED">
                            Fulfilled
                        </MenuItem>

                        <MenuItem value="CANCELLED">
                            Cancelled
                        </MenuItem>
                    </Select>
                </FormControl>

                <FormControl
                    sx={{ minWidth: 180 }}
                >
                    <InputLabel>
                        Priority
                    </InputLabel>

                    <Select
                        value={priorityFilter}
                        label="Priority"
                        onChange={(e) =>
                            setPriorityFilter(
                                e.target.value
                            )
                        }
                    >
                        <MenuItem value="ALL">
                            All Priorities
                        </MenuItem>

                        <MenuItem value="HIGH">
                            High
                        </MenuItem>

                        <MenuItem value="MEDIUM">
                            Medium
                        </MenuItem>

                        <MenuItem value="LOW">
                            Low
                        </MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* ERROR */}

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                >
                    {error}
                </Alert>
            )}

            {/* LOADING / REQUESTS */}

            {loading ? (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent:
                            "center",
                        py: 8
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : filteredRequests.length === 0 ? (
                <Alert severity="info">
                    No resource requests found.
                </Alert>
            ) : (
                <Grid
                    container
                    spacing={3}
                >
                    {filteredRequests.map(
                        (request) => (
                            <Grid
                                key={request.id}
                                size={{
                                    xs: 12,
                                    md: 6,
                                    lg: 4
                                }}
                            >
                                <Card
                                    sx={{
                                        height: "100%",
                                        borderRadius: 2
                                    }}
                                >
                                    <CardContent>

                                        {/* CARD HEADER */}

                                        <Box
                                            sx={{
                                                display:
                                                    "flex",
                                                justifyContent:
                                                    "space-between",
                                                alignItems:
                                                    "flex-start",
                                                gap: 1,
                                                mb: 2
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                fontWeight="700"
                                            >
                                                {
                                                    request.resource_name
                                                }
                                            </Typography>

                                            <Chip
                                                label={
                                                    request.status
                                                }
                                                color={getStatusColor(
                                                    request.status
                                                )}
                                                size="small"
                                            />
                                        </Box>

                                        {/* INCIDENT */}

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                mb: 1
                                            }}
                                        >
                                            Incident:{" "}
                                            <strong>
                                                {
                                                    request.incident_number
                                                }
                                            </strong>
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                mb: 1
                                            }}
                                        >
                                            {
                                                request.incident_title
                                            }
                                        </Typography>

                                        {/* CATEGORY */}

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                mb: 1
                                            }}
                                        >
                                            Category:{" "}
                                            <strong>
                                                {
                                                    request.resource_category
                                                }
                                            </strong>
                                        </Typography>

                                        {/* REQUESTED */}

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                mb: 1
                                            }}
                                        >
                                            Requested:{" "}
                                            <strong>
                                                {
                                                    request.quantity_requested
                                                }{" "}
                                                {
                                                    request.unit
                                                }
                                            </strong>
                                        </Typography>

                                        {/* ALLOCATED */}

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                mb: 1
                                            }}
                                        >
                                            Allocated:{" "}
                                            <strong>
                                                {
                                                    request.quantity_allocated
                                                }{" "}
                                                {
                                                    request.unit
                                                }
                                            </strong>
                                        </Typography>

                                        {/* PRIORITY + USER */}

                                        <Box
                                            sx={{
                                                display:
                                                    "flex",
                                                gap: 1,
                                                mt: 2,
                                                flexWrap:
                                                    "wrap"
                                            }}
                                        >
                                            <Chip
                                                label={`Priority: ${request.priority}`}
                                                color={getPriorityColor(
                                                    request.priority
                                                )}
                                                size="small"
                                            />

                                            <Chip
                                                label={`By: ${
                                                    request.requested_by_name ||
                                                    "Unknown"
                                                }`}
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Box>

                                        {/* NOTES */}

                                        {request.notes && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mt: 2
                                                }}
                                            >
                                                {
                                                    request.notes
                                                }
                                            </Typography>
                                        )}

                                        {/* EDIT BUTTON */}

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                mt: 2
                                            }}
                                            onClick={() =>
                                                handleEditRequest(
                                                    request
                                                )
                                            }
                                        >
                                            Edit / Allocate
                                        </Button>

                                    </CardContent>
                                </Card>
                            </Grid>
                        )
                    )}
                </Grid>
            )}

            {/* CREATE / UPDATE DIALOG */}

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    {editingRequestId
                        ? "Update Resource Request"
                        : "New Resource Request"}
                </DialogTitle>

                <DialogContent>

                    {/* FORM ERROR */}

                    {formError && (
                        <Alert
                            severity="error"
                            sx={{
                                mt: 1,
                                mb: 2
                            }}
                        >
                            {formError}
                        </Alert>
                    )}

                    {/* INCIDENT */}

                    <FormControl
                        fullWidth
                        sx={{ mt: 1 }}
                    >
                        <InputLabel>
                            Incident
                        </InputLabel>

                        <Select
                            name="incident_id"
                            value={
                                formData.incident_id
                            }
                            label="Incident"
                            onChange={
                                handleFormChange
                            }
                            disabled={
                                Boolean(
                                    editingRequestId
                                )
                            }
                        >
                            {incidents.map(
                                (incident) => (
                                    <MenuItem
                                        key={
                                            incident.id
                                        }
                                        value={
                                            incident.id
                                        }
                                    >
                                        {
                                            incident.incident_number
                                        }{" "}
                                        —{" "}
                                        {
                                            incident.title
                                        }
                                    </MenuItem>
                                )
                            )}
                        </Select>
                    </FormControl>

                    {/* RESOURCE CATEGORY */}

                    <TextField
                        fullWidth
                        label="Resource Category"
                        name="resource_category"
                        value={
                            formData.resource_category
                        }
                        onChange={
                            handleFormChange
                        }
                        placeholder="RESCUE, MEDICAL, FOOD..."
                        margin="normal"
                        disabled={
                            Boolean(
                                editingRequestId
                            )
                        }
                    />

                    {/* RESOURCE NAME */}

                    <TextField
                        fullWidth
                        label="Resource Name"
                        name="resource_name"
                        value={
                            formData.resource_name
                        }
                        onChange={
                            handleFormChange
                        }
                        placeholder="Rescue Boat, Medical Kit..."
                        margin="normal"
                        disabled={
                            Boolean(
                                editingRequestId
                            )
                        }
                    />

                    {/* QUANTITY + UNIT */}

                    <Box
                        sx={{
                            display: "flex",
                            gap: 2
                        }}
                    >
                        <TextField
                            fullWidth
                            label="Quantity Requested"
                            name="quantity_requested"
                            type="number"
                            value={
                                formData.quantity_requested
                            }
                            onChange={
                                handleFormChange
                            }
                            margin="normal"
                            inputProps={{
                                min: 1
                            }}
                            disabled={
                                Boolean(
                                    editingRequestId
                                )
                            }
                        />

                        <TextField
                            fullWidth
                            label="Unit"
                            name="unit"
                            value={
                                formData.unit
                            }
                            onChange={
                                handleFormChange
                            }
                            placeholder="unit, kits, vehicles..."
                            margin="normal"
                            disabled={
                                Boolean(
                                    editingRequestId
                                )
                            }
                        />
                    </Box>

                    {/* EDIT-ONLY FIELDS */}

                    {editingRequestId && (
                        <>
                            {/* QUANTITY ALLOCATED */}

                            <TextField
                                fullWidth
                                label="Quantity Allocated"
                                name="quantity_allocated"
                                type="number"
                                value={
                                    formData.quantity_allocated
                                }
                                onChange={
                                    handleFormChange
                                }
                                margin="normal"
                                inputProps={{
                                    min: 0
                                }}
                            />

                            {/* STATUS */}

                            <FormControl
                                fullWidth
                                sx={{ mt: 1 }}
                            >
                                <InputLabel>
                                    Status
                                </InputLabel>

                                <Select
                                    name="status"
                                    value={
                                        formData.status
                                    }
                                    label="Status"
                                    onChange={
                                        handleFormChange
                                    }
                                >
                                    <MenuItem value="REQUESTED">
                                        Requested
                                    </MenuItem>

                                    <MenuItem value="ALLOCATED">
                                        Allocated
                                    </MenuItem>

                                    <MenuItem value="FULFILLED">
                                        Fulfilled
                                    </MenuItem>

                                    <MenuItem value="CANCELLED">
                                        Cancelled
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </>
                    )}

                    {/* PRIORITY */}

                    <FormControl
                        fullWidth
                        sx={{ mt: 2 }}
                    >
                        <InputLabel>
                            Priority
                        </InputLabel>

                        <Select
                            name="priority"
                            value={
                                formData.priority
                            }
                            label="Priority"
                            onChange={
                                handleFormChange
                            }
                        >
                            <MenuItem value="HIGH">
                                High
                            </MenuItem>

                            <MenuItem value="MEDIUM">
                                Medium
                            </MenuItem>

                            <MenuItem value="LOW">
                                Low
                            </MenuItem>
                        </Select>
                    </FormControl>

                    {/* NOTES */}

                    <TextField
                        fullWidth
                        label="Notes"
                        name="notes"
                        value={
                            formData.notes
                        }
                        onChange={
                            handleFormChange
                        }
                        multiline
                        rows={3}
                        margin="normal"
                    />

                </DialogContent>

                {/* DIALOG BUTTONS */}

                <DialogActions>

                    <Button
                        onClick={
                            handleCloseDialog
                        }
                        disabled={creating}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={
                            editingRequestId
                                ? handleUpdateRequest
                                : handleCreateRequest
                        }
                        disabled={creating}
                    >
                        {creating
                            ? editingRequestId
                                ? "Updating..."
                                : "Creating..."
                            : editingRequestId
                            ? "Update Request"
                            : "Create Request"}
                    </Button>

                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default ResourceRequestDashboard;