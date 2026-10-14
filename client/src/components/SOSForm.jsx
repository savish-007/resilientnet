
import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    MenuItem,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import GpsFixedRoundedIcon from "@mui/icons-material/GpsFixedRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import api from "../api/api";

const SOSForm = () => {
    const [message, setMessage] = useState("");
    const [category, setCategory] = useState("Medical");
    const [severity, setSeverity] = useState("HIGH");
    const [location, setLocation] = useState(null);
    const [locating, setLocating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const detectLocation = () => {
        if (!navigator.geolocation) {
            setFeedback({
                type: "error",
                text: "Location services are not supported by this browser."
            });
            return;
        }

        setLocating(true);
        setFeedback(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: Math.round(position.coords.accuracy)
                });
                setLocating(false);
            },
            (error) => {
                const text =
                    error.code === 1
                        ? "Location permission denied. Allow location access in your browser."
                        : error.code === 2
                        ? "Location unavailable. Check your device location settings."
                        : "Location timed out. Please try again.";

                setLocation(null);
                setFeedback({ type: "error", text });
                setLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    };

    useEffect(() => {
        detectLocation();
    }, []);

    const submitSOS = async (event) => {
        event.preventDefault();

        if (!location) {
            setFeedback({
                type: "error",
                text: "Detect your location before submitting SOS."
            });
            return;
        }

        setLoading(true);
        setFeedback(null);

        try {
            await api.post("/sos", {
                message,
                category,
                severity,
                latitude: location.latitude,
                longitude: location.longitude
            });

            setFeedback({
                type: "success",
                text: "SOS submitted successfully. Your report has been recorded."
            });
            setMessage("");
        } catch (error) {
            setFeedback({
                type: "error",
                text: error.response?.data?.message || "SOS submission failed."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            component="form"
            onSubmit={submitSOS}
            sx={{
                p: { xs: 1, sm: 2 },
                color: "#172B4D"
            }}
        >
            <Stack spacing={3}>
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                >
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            bgcolor: "#FFF0F0",
                            color: "#D32F2F",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <WarningAmberRoundedIcon fontSize="large" />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" fontWeight={800}>
                            Report an Emergency
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Provide incident details and share your current location.
                        </Typography>
                    </Box>
                </Stack>

                <Box
                    sx={{
                        p: 2,
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: location ? "#B7E4CC" : "#E2E8F0",
                        bgcolor: location ? "#F0FBF5" : "#F8FAFC"
                    }}
                >
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        justifyContent="space-between"
                        spacing={2}
                    >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <GpsFixedRoundedIcon
                                color={location ? "success" : "action"}
                            />
                            <Box>
                                <Typography fontWeight={700}>
                                    {locating
                                        ? "Detecting your location..."
                                        : location
                                        ? "Location detected"
                                        : "Location not detected"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {location
                                        ? `Accuracy: approximately ${location.accuracy} metres`
                                        : "Allow browser location access to continue."}
                                </Typography>
                            </Box>
                        </Stack>

                        <Button
                            type="button"
                            variant="outlined"
                            startIcon={<MyLocationRoundedIcon />}
                            onClick={detectLocation}
                            disabled={locating || loading}
                            sx={{ borderRadius: 2, textTransform: "none" }}
                        >
                            {locating ? "Locating..." : "Refresh location"}
                        </Button>
                    </Stack>

                    {location && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 1.5 }}
                        >
                            {location.latitude.toFixed(6)},{" "}
                            {location.longitude.toFixed(6)}
                        </Typography>
                    )}
                </Box>

                <TextField
                    label="What happened?"
                    placeholder="Describe the emergency and any immediate danger..."
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    required
                    multiline
                    minRows={3}
                    fullWidth
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                        select
                        label="Emergency category"
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        fullWidth
                    >
                        {[
                            "Medical",
                            "Fire",
                            "Flood",
                            "Building Collapse",
                            "Road Block"
                        ].map((item) => (
                            <MenuItem key={item} value={item}>
                                {item}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Severity"
                        value={severity}
                        onChange={(event) => setSeverity(event.target.value)}
                        fullWidth
                    >
                        {["LOW", "MEDIUM", "HIGH"].map((item) => (
                            <MenuItem key={item} value={item}>
                                {item}
                            </MenuItem>
                        ))}
                    </TextField>
                </Stack>

                {feedback && (
                    <Alert
                        severity={feedback.type}
                        onClose={() => setFeedback(null)}
                        sx={{ borderRadius: 2 }}
                    >
                        {feedback.text}
                    </Alert>
                )}

                <Button
                    type="submit"
                    variant="contained"
                    color="error"
                    disabled={loading || locating || !location}
                    startIcon={<WarningAmberRoundedIcon />}
                    sx={{
                        minHeight: 54,
                        borderRadius: 3,
                        fontWeight: 800,
                        fontSize: "1rem",
                        textTransform: "none",
                        boxShadow: "0 5px 14px rgba(211,47,47,0.2)",
                        "&:hover": {
                            bgcolor: "#B71C1C",
                            boxShadow: "0 7px 18px rgba(211,47,47,0.3)"
                        }
                    }}
                >
                    {loading ? "Submitting emergency..." : "Submit Emergency SOS"}
                </Button>

                <Typography
                    variant="caption"
                    color="text.secondary"
                    textAlign="center"
                >
                    Only submit genuine emergencies when using the live system.
                </Typography>
            </Stack>
        </Box>
    );
};

export default SOSForm;
