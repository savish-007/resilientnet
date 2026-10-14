
import { useEffect, useState, useCallback } from "react";
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Chip,
    Stack,
    Divider
} from "@mui/material";

import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FiberManualRecordRoundedIcon from "@mui/icons-material/FiberManualRecordRounded";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { useEmergency } from "../context/EmergencyContext";
import socket from "../services/socket";

const redIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

const orangeIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

const greenIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

const getValidAlerts = (alerts) =>
    alerts.filter(
        (alert) =>
            alert.latitude != null &&
            alert.longitude != null &&
            Number.isFinite(Number(alert.latitude)) &&
            Number.isFinite(Number(alert.longitude))
    );

function MapController({ alerts, onReady }) {
    const map = useMap();

    useEffect(() => {
        onReady(map);

        return () => onReady(null);
    }, [map, onReady]);

    useEffect(() => {
        const validAlerts = getValidAlerts(alerts);

        if (validAlerts.length === 0) return;

        const bounds = L.latLngBounds(
            validAlerts.map((alert) => [
                Number(alert.latitude),
                Number(alert.longitude)
            ])
        );

        map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 14
        });
    }, [alerts, map]);

    return null;
}

const EmergencyMap = () => {
    const { alerts = [] } = useEmergency();

    const [map, setMap] = useState(null);
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const handleMapReady = useCallback((mapInstance) => {
        setMap(mapInstance);
    }, []);

    useEffect(() => {
        const handleConnect = () => {
            setIsConnected(true);
            setLastUpdated(new Date());
        };

        const handleDisconnect = () => {
            setIsConnected(false);
        };

        const handleNewSOS = () => {
            setLastUpdated(new Date());
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("newSOS", handleNewSOS);

        setIsConnected(socket.connected);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("newSOS", handleNewSOS);
        };
    }, []);

    const validAlerts = getValidAlerts(alerts);

    const criticalCount = alerts.filter(
        (alert) =>
            String(alert.severity).toUpperCase() === "HIGH" ||
            String(alert.severity).toUpperCase() === "CRITICAL"
    ).length;

    const resetMap = () => {
        if (!map) return;

        if (validAlerts.length > 0) {
            const bounds = L.latLngBounds(
                validAlerts.map((alert) => [
                    Number(alert.latitude),
                    Number(alert.longitude)
                ])
            );

            map.fitBounds(bounds, {
                padding: [40, 40],
                maxZoom: 14
            });
        } else {
            map.setView([12.9716, 77.5946], 12);
        }
    };

    return (
        <Card
            sx={{
                mt: 3,
                width: "100%",
                minWidth: 0,
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
                bgcolor: "#FFFFFF"
            }}
        >
            <CardContent
                sx={{
                    p: { xs: 2, sm: 3 },
                    "&:last-child": {
                        pb: { xs: 2, sm: 3 }
                    },
                    minWidth: 0
                }}
            >
                {/* Map heading */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                        mb: 2.5,
                        minWidth: 0
                    }}
                >
                    <Box
                        sx={{
                            width: 46,
                            height: 46,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "13px",
                            bgcolor: "#EFF6FF",
                            fontSize: 24
                        }}
                    >
                        🌍
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            sx={{
                                fontSize: { xs: 18, sm: 22 },
                                fontWeight: 800,
                                color: "#172B4D",
                                lineHeight: 1.35,
                                overflowWrap: "anywhere"
                            }}
                        >
                            Live Emergency Operations Map
                        </Typography>

                        <Typography
                            sx={{
                                mt: 0.5,
                                fontSize: 12,
                                color: "#64748B"
                            }}
                        >
                            Monitor incidents and their reported locations
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 2.5, borderColor: "#EDF1F7" }} />

                {/* Status chips and map actions */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        gap: 1.5,
                        width: "100%",
                        minWidth: 0,
                        mb: 2.5
                    }}
                >
                    <Stack
                        direction="row"
                        useFlexGap
                        flexWrap="wrap"
                        gap={1}
                        sx={{ minWidth: 0 }}
                    >
                        <Chip
                            icon={
                                <FiberManualRecordRoundedIcon
                                    sx={{ fontSize: "10px !important" }}
                                />
                            }
                            label={isConnected ? "Connected" : "Disconnected"}
                            color={isConnected ? "success" : "error"}
                            size="small"
                            sx={{
                                height: 32,
                                fontWeight: 700,
                                "& .MuiChip-label": { px: 1 }
                            }}
                        />

                        <Chip
                            label={`Incidents: ${alerts.length}`}
                            size="small"
                            sx={{
                                height: 32,
                                bgcolor: "#EFF6FF",
                                color: "#1D4ED8",
                                fontWeight: 700
                            }}
                        />

                        <Chip
                            label={`Critical: ${criticalCount}`}
                            size="small"
                            sx={{
                                height: 32,
                                bgcolor: "#FEF2F2",
                                color: "#DC2626",
                                fontWeight: 700
                            }}
                        />

                        <Chip
                            label={`Updated: ${lastUpdated.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                            })}`}
                            size="small"
                            sx={{
                                height: 32,
                                bgcolor: "#F1F5F9",
                                color: "#475569",
                                fontWeight: 600
                            }}
                        />
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            alignSelf: "flex-end",
                            flexShrink: 0
                        }}
                    >
                        <Button
                            variant="outlined"
                            aria-label="Filter map"
                            title="Filter map"
                            sx={{
                                minWidth: 42,
                                width: 42,
                                height: 42,
                                p: 0,
                                borderRadius: "11px",
                                borderColor: "#D9E2EF",
                                color: "#475569",
                                "&:hover": {
                                    bgcolor: "#F1F5F9",
                                    borderColor: "#94A3B8"
                                }
                            }}
                            onClick={() => {
                                // Map filters can be added here.
                            }}
                        >
                            <FilterListRoundedIcon />
                        </Button>

                        <Button
                            variant="outlined"
                            aria-label="Map legend"
                            title="Map legend"
                            sx={{
                                minWidth: 42,
                                width: 42,
                                height: 42,
                                p: 0,
                                borderRadius: "11px",
                                borderColor: "#D9E2EF",
                                color: "#475569",
                                "&:hover": {
                                    bgcolor: "#F1F5F9",
                                    borderColor: "#94A3B8"
                                }
                            }}
                            onClick={() => {
                                window.alert(
                                    "Map legend:\nRed: High/Critical severity\nOrange: Medium severity\nGreen: Low severity"
                                );
                            }}
                        >
                            <InfoOutlinedIcon />
                        </Button>

                        <Button
                            variant="contained"
                            aria-label="Reset map view"
                            title="Reset map view"
                            onClick={resetMap}
                            sx={{
                                minWidth: 42,
                                width: 42,
                                height: 42,
                                p: 0,
                                borderRadius: "11px",
                                bgcolor: "#2563EB",
                                boxShadow: "none",
                                "&:hover": {
                                    bgcolor: "#1D4ED8",
                                    boxShadow: "none"
                                }
                            }}
                        >
                            <RestartAltRoundedIcon />
                        </Button>
                    </Stack>
                </Box>

                {/* Map and markers */}
                <Box
                    sx={{
                        width: "100%",
                        height: { xs: 340, sm: 420 },
                        borderRadius: "14px",
                        overflow: "hidden",
                        border: "1px solid #E2E8F0",
                        bgcolor: "#F1F5F9",
                        position: "relative",
                        isolation: "isolate",
                        "& .leaflet-container": {
                            width: "100%",
                            height: "100%",
                            fontFamily: "Inter, Segoe UI, sans-serif",
                            zIndex: 0
                        },
                        "& .leaflet-control-zoom": {
                            border: "none !important",
                            borderRadius: "8px",
                            overflow: "hidden",
                            boxShadow: "0 2px 8px rgba(15,23,42,0.15) !important"
                        },
                        "& .leaflet-popup-content-wrapper": {
                            borderRadius: "12px"
                        }
                    }}
                >
                    <MapContainer
                        center={[12.9716, 77.5946]}
                        zoom={12}
                        scrollWheelZoom
                        style={{
                            width: "100%",
                            height: "100%"
                        }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <MapController
                            alerts={alerts}
                            onReady={handleMapReady}
                        />

                        {validAlerts.map((alert) => {
                            const severity = String(
                                alert.severity || ""
                            ).toUpperCase();

                            const markerIcon =
                                severity === "HIGH" ||
                                severity === "CRITICAL"
                                    ? redIcon
                                    : severity === "MEDIUM"
                                      ? orangeIcon
                                      : greenIcon;

                            return (
                                <Marker
                                    key={alert.id}
                                    position={[
                                        Number(alert.latitude),
                                        Number(alert.longitude)
                                    ]}
                                    icon={markerIcon}
                                >
                                    <Popup>
                                        <Box sx={{ minWidth: 180, maxWidth: 260 }}>
                                            <Typography
                                                variant="subtitle1"
                                                fontWeight={800}
                                                color="#172B4D"
                                            >
                                                {alert.category || "Emergency"}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                sx={{ mt: 1, overflowWrap: "anywhere" }}
                                            >
                                                {alert.message || "No description available"}
                                            </Typography>

                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                <strong>Severity:</strong>{" "}
                                                {alert.severity || "Unknown"}
                                            </Typography>

                                            <Typography variant="body2">
                                                <strong>Status:</strong>{" "}
                                                {alert.status || "Unknown"}
                                            </Typography>

                                            <Typography variant="body2">
                                                <strong>Reporter:</strong>{" "}
                                                {alert.sender_name || "Unknown"}
                                            </Typography>

                                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                <strong>Time:</strong>{" "}
                                                {alert.created_at
                                                    ? new Date(
                                                          alert.created_at
                                                      ).toLocaleString()
                                                    : "Unknown"}
                                            </Typography>
                                        </Box>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </Box>

                {/* Map legend */}
                <Stack
                    direction="row"
                    useFlexGap
                    flexWrap="wrap"
                    gap={2}
                    sx={{ mt: 2, alignItems: "center" }}
                >
                    <Typography
                        sx={{
                            color: "#64748B",
                            fontSize: 11,
                            fontWeight: 700
                        }}
                    >
                        MAP LEGEND
                    </Typography>

                    {[
                        { label: "High / Critical", color: "#EF4444" },
                        { label: "Medium", color: "#F59E0B" },
                        { label: "Low", color: "#22C55E" }
                    ].map((item) => (
                        <Stack
                            key={item.label}
                            direction="row"
                            spacing={0.7}
                            alignItems="center"
                        >
                            <Box
                                sx={{
                                    width: 9,
                                    height: 9,
                                    borderRadius: "50%",
                                    bgcolor: item.color
                                }}
                            />
                            <Typography
                                sx={{ fontSize: 11, color: "#64748B" }}
                            >
                                {item.label}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>

                <Typography
                    sx={{
                        mt: 1.5,
                        fontSize: 11,
                        color: "#94A3B8"
                    }}
                >
                    Showing {validAlerts.length} geolocated incident
                    {validAlerts.length === 1 ? "" : "s"} on the map.
                </Typography>
            </CardContent>
        </Card>
    );
};

export default EmergencyMap;
