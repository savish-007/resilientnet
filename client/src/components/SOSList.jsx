
import { useEffect, useCallback } from "react";
import api from "../api/api";
import socket from "../services/socket";
import { useEmergency } from "../context/EmergencyContext";

import {
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    Typography,
    Avatar
} from "@mui/material";

import {
    PersonOutlineRounded,
    AccessTimeRounded,
    WarningAmberRounded,
    LocationOnRounded,
    NotificationsActiveRounded,
    InboxOutlined,
    ArrowForwardRounded,
    BluetoothRounded
} from "@mui/icons-material";

const getSeverity = (severity) => {
    const value = String(severity || "").toUpperCase();

    if (value === "HIGH" || value === "CRITICAL") {
        return {
            label: value,
            color: "#DC2626",
            background: "#FEF2F2",
            border: "#FECACA"
        };
    }

    if (value === "MEDIUM") {
        return {
            label: value,
            color: "#B45309",
            background: "#FFFBEB",
            border: "#FDE68A"
        };
    }

    return {
        label: value || "LOW",
        color: "#15803D",
        background: "#F0FDF4",
        border: "#BBF7D0"
    };
};

const getStatusStyle = (status) => {
    const value = String(status || "NEW").toUpperCase();

    if (["RESOLVED", "CLOSED", "COMPLETED"].includes(value)) {
        return { color: "#15803D", background: "#F0FDF4" };
    }

    if (["IN_PROGRESS", "ASSIGNED", "RESPONDING"].includes(value)) {
        return { color: "#1D4ED8", background: "#EFF6FF" };
    }

    return { color: "#B45309", background: "#FFFBEB" };
};

const SOSList = () => {
    const { alerts = [], setAlerts } = useEmergency();

    const fetchSOS = useCallback(async () => {
        try {
            const response = await api.get("/sos");
            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.alerts || [];

            setAlerts(data);
        } catch (error) {
            console.error("Failed to fetch SOS alerts:", error);
        }
    }, [setAlerts]);

    useEffect(() => {
        fetchSOS();

        const handleNewSOS = (newAlert) => {
            if (!newAlert?.id) return;

            setAlerts((previous) => {
                const exists = previous.some(
                    (alert) => String(alert.id) === String(newAlert.id)
                );

                if (exists) return previous;

                return [
                    {
                        ...newAlert,
                        sender_name: newAlert.sender_name || "Live Alert"
                    },
                    ...previous
                ];
            });
        };

        socket.on("newSOS", handleNewSOS);

        return () => {
            socket.off("newSOS", handleNewSOS);
        };
    }, [fetchSOS, setAlerts]);

    return (
        <Box sx={{ mt: 1, width: "100%", minWidth: 0 }}>
            {/* Section heading */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={2}
                sx={{ mb: 2.5 }}
            >
                <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ minWidth: 0 }}
                >
                    <Avatar
                        variant="rounded"
                        sx={{
                            bgcolor: "#FEF2F2",
                            color: "#DC2626",
                            width: 46,
                            height: 46,
                            borderRadius: "14px"
                        }}
                    >
                        <NotificationsActiveRounded />
                    </Avatar>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            sx={{
                                fontSize: { xs: 18, sm: 21 },
                                fontWeight: 800,
                                color: "#172B4D",
                                lineHeight: 1.4
                            }}
                        >
                            Live SOS Alerts
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: 12,
                                color: "#64748B",
                                mt: 0.3
                            }}
                        >
                            Emergency reports and incident updates
                        </Typography>
                    </Box>
                </Stack>

                <Chip
                    label={`${alerts.length} report${alerts.length === 1 ? "" : "s"}`}
                    sx={{
                        height: 32,
                        fontWeight: 750,
                        bgcolor: "#EFF6FF",
                        color: "#1D4ED8",
                        borderRadius: "10px"
                    }}
                />
            </Stack>

            {/* Empty state */}
            {alerts.length === 0 ? (
                <Card
                    elevation={0}
                    sx={{
                        border: "1px dashed #CBD5E1",
                        borderRadius: "16px",
                        bgcolor: "#F8FAFC"
                    }}
                >
                    <CardContent
                        sx={{
                            py: 6,
                            px: 2,
                            textAlign: "center"
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 58,
                                height: 58,
                                mx: "auto",
                                mb: 2,
                                bgcolor: "#E2E8F0",
                                color: "#64748B"
                            }}
                        >
                            <InboxOutlined sx={{ fontSize: 30 }} />
                        </Avatar>

                        <Typography
                            sx={{
                                fontWeight: 750,
                                color: "#334155",
                                fontSize: 15
                            }}
                        >
                            No emergency reports yet
                        </Typography>

                        <Typography
                            sx={{
                                mt: 0.7,
                                fontSize: 13,
                                color: "#64748B"
                            }}
                        >
                            New SOS alerts will appear here automatically.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Stack spacing={2}>
                    {alerts.map((alert) => {
                        const severity = getSeverity(alert.severity);
                        const status = getStatusStyle(alert.status);

                        return (
                            <Card
                                id={`sos-${alert.id}`}
                                key={alert.id}
                                elevation={0}
                                sx={{
                                    minWidth: 0,
                                    overflow: "hidden",
                                    border: "1px solid #E2E8F0",
                                    borderLeft: `4px solid ${severity.color}`,
                                    borderRadius: "14px",
                                    bgcolor: "#FFFFFF",
                                    transition:
                                        "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
                                    "&:hover": {
                                        borderColor: "#CBD5E1",
                                        boxShadow:
                                            "0 8px 24px rgba(23,43,77,0.07)",
                                        transform: "translateY(-2px)"
                                    }
                                }}
                            >
                                <CardContent
                                    sx={{
                                        p: { xs: 2, sm: 2.5 },
                                        "&:last-child": {
                                            pb: { xs: 2, sm: 2.5 }
                                        }
                                    }}
                                >
                                    {/* Incident title and severity */}
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="flex-start"
                                        spacing={1.5}
                                    >
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography
                                                sx={{
                                                    fontSize: 15,
                                                    fontWeight: 800,
                                                    color: "#172B4D",
                                                    overflowWrap: "anywhere"
                                                }}
                                            >
                                                {alert.category || "Emergency"}
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    mt: 0.5,
                                                    fontSize: 11,
                                                    color: "#94A3B8",
                                                    fontWeight: 600
                                                }}
                                            >
                                                Report #{String(alert.id).slice(0, 8)}
                                            </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
                                            {Boolean(alert.is_mesh_relay || alert.mesh_message_id) && (
                                                <Chip
                                                    size="small"
                                                    icon={<BluetoothRounded sx={{ fontSize: "14px !important", color: "#0284C7 !important" }} />}
                                                    label={alert.hops ? `BLE (${alert.hops}h)` : "BLE MESH"}
                                                    sx={{
                                                        height: 27,
                                                        fontSize: 10,
                                                        fontWeight: 800,
                                                        color: "#0284C7",
                                                        bgcolor: "#F0F9FF",
                                                        border: "1px solid #BAE6FD",
                                                        borderRadius: "8px"
                                                    }}
                                                />
                                            )}
                                            <Chip
                                                size="small"
                                                icon={
                                                    <WarningAmberRounded
                                                        sx={{
                                                            fontSize: "16px !important",
                                                            color: `${severity.color} !important`
                                                        }}
                                                    />
                                                }
                                                label={severity.label}
                                                sx={{
                                                    flexShrink: 0,
                                                    height: 27,
                                                    fontSize: 10,
                                                    fontWeight: 800,
                                                    color: severity.color,
                                                    bgcolor: severity.background,
                                                    border: `1px solid ${severity.border}`,
                                                    borderRadius: "8px",
                                                    "& .MuiChip-label": {
                                                        px: 1
                                                    }
                                                }}
                                            />
                                        </Stack>
                                    </Stack>

                                    {/* Incident message */}
                                    <Typography
                                        sx={{
                                            mt: 2,
                                            mb: 2,
                                            fontSize: 13,
                                            color: "#475569",
                                            lineHeight: 1.8,
                                            overflowWrap: "anywhere",
                                            whiteSpace: "pre-wrap"
                                        }}
                                    >
                                        {alert.message || "No description provided."}
                                    </Typography>

                                    <Divider
                                        sx={{
                                            mb: 2,
                                            borderColor: "#EDF1F7"
                                        }}
                                    />

                                    {/* Incident details */}
                                    <Stack spacing={1.4}>
                                        <Stack
                                            direction="row"
                                            spacing={1.2}
                                            alignItems="center"
                                            sx={{ minWidth: 0 }}
                                        >
                                            <PersonOutlineRounded
                                                sx={{
                                                    fontSize: 19,
                                                    color: "#94A3B8",
                                                    flexShrink: 0
                                                }}
                                            />

                                            <Typography
                                                sx={{
                                                    fontSize: 12,
                                                    color: "#475569",
                                                    overflowWrap: "anywhere"
                                                }}
                                            >
                                                {alert.sender_name || "Unknown reporter"}
                                            </Typography>
                                        </Stack>

                                        <Stack
                                            direction="row"
                                            spacing={1.2}
                                            alignItems="center"
                                        >
                                            <WarningAmberRounded
                                                sx={{
                                                    fontSize: 19,
                                                    color: "#94A3B8",
                                                    flexShrink: 0
                                                }}
                                            />

                                            <Typography
                                                sx={{
                                                    fontSize: 12,
                                                    color: "#475569"
                                                }}
                                            >
                                                Status:
                                            </Typography>

                                            <Chip
                                                label={String(alert.status || "NEW").replace(
                                                    /_/g,
                                                    " "
                                                )}
                                                size="small"
                                                sx={{
                                                    height: 23,
                                                    fontSize: 10,
                                                    fontWeight: 750,
                                                    color: status.color,
                                                    bgcolor: status.background,
                                                    borderRadius: "7px"
                                                }}
                                            />
                                        </Stack>

                                        {alert.latitude != null &&
                                            alert.longitude != null && (
                                                <Stack
                                                    direction="row"
                                                    spacing={1.2}
                                                    alignItems="center"
                                                    sx={{ minWidth: 0 }}
                                                >
                                                    <LocationOnRounded
                                                        sx={{
                                                            fontSize: 19,
                                                            color: "#94A3B8",
                                                            flexShrink: 0
                                                        }}
                                                    />

                                                    <Typography
                                                        sx={{
                                                            fontSize: 12,
                                                            color: "#475569",
                                                            overflowWrap: "anywhere"
                                                        }}
                                                    >
                                                        {Number(alert.latitude).toFixed(5)},{" "}
                                                        {Number(alert.longitude).toFixed(5)}
                                                    </Typography>
                                                </Stack>
                                            )}

                                        <Stack
                                            direction="row"
                                            spacing={1.2}
                                            alignItems="center"
                                        >
                                            <AccessTimeRounded
                                                sx={{
                                                    fontSize: 19,
                                                    color: "#94A3B8",
                                                    flexShrink: 0
                                                }}
                                            />

                                            <Typography
                                                sx={{
                                                    fontSize: 11,
                                                    color: "#64748B"
                                                }}
                                            >
                                                {alert.created_at
                                                    ? new Date(
                                                          alert.created_at
                                                      ).toLocaleString()
                                                    : "Time unavailable"}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>
            )}
        </Box>
    );
};

export default SOSList;
