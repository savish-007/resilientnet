
import { useEffect, useCallback } from "react";
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Stack
} from "@mui/material";

import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import PriorityHighRoundedIcon from "@mui/icons-material/PriorityHighRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

import api from "../api/api";
import socket from "../services/socket";
import { useEmergency } from "../context/EmergencyContext";

const StatsCards = () => {
    const { stats = {}, setStats } = useEmergency();

    const fetchStats = useCallback(async () => {
        try {
            const response = await api.get("/sos/stats");
            setStats(response.data || {});
        } catch (error) {
            console.error("Failed to fetch dashboard statistics:", error);
        }
    }, [setStats]);

    useEffect(() => {
        fetchStats();

        const handleStatsUpdate = (updatedStats) => {
            if (updatedStats && typeof updatedStats === "object") {
                setStats(updatedStats);
            }
        };

        socket.on("dashboardStats", handleStatsUpdate);

        return () => {
            socket.off("dashboardStats", handleStatsUpdate);
        };
    }, [fetchStats, setStats]);

    const cards = [
        {
            title: "Active SOS",
            value: stats.activeSOS ?? 0,
            subtitle: "Awaiting resolution",
            color: "#DC2626",
            background: "#FEF2F2",
            border: "#FECACA",
            icon: <WarningAmberRoundedIcon />
        },
        {
            title: "Available Volunteers",
            value: stats.volunteers ?? 0,
            subtitle: "Registered volunteers",
            color: "#2563EB",
            background: "#EFF6FF",
            border: "#BFDBFE",
            icon: <GroupsRoundedIcon />
        },
        {
            title: "Resources",
            value: stats.resources ?? 0,
            subtitle: "Registered resources",
            color: "#059669",
            background: "#ECFDF5",
            border: "#A7F3D0",
            icon: <Inventory2RoundedIcon />
        },
        {
            title: "High Priority",
            value: stats.highPriority ?? 0,
            subtitle: "Requires attention",
            color: "#D97706",
            background: "#FFFBEB",
            border: "#FDE68A",
            icon: <PriorityHighRoundedIcon />
        }
    ];

    return (
        <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ width: "100%" }}>
            {cards.map((card) => (
                <Grid
                    key={card.title}
                    size={{ xs: 12, sm: 6, xl: 3 }}
                    sx={{ minWidth: 0 }}
                >
                    <Card
                        elevation={0}
                        sx={{
                            height: "100%",
                            minWidth: 0,
                            overflow: "hidden",
                            border: "1px solid #E2E8F0",
                            borderRadius: "16px",
                            bgcolor: "#FFFFFF",
                            transition:
                                "transform 0.2s ease, box-shadow 0.2s ease",
                            "&:hover": {
                                transform: "translateY(-3px)",
                                boxShadow:
                                    "0 10px 28px rgba(23, 43, 77, 0.08)"
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
                            <Stack
                                direction="row"
                                alignItems="flex-start"
                                justifyContent="space-between"
                                spacing={1.5}
                            >
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography
                                        sx={{
                                            color: "#64748B",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            mb: 1.5,
                                            lineHeight: 1.5
                                        }}
                                    >
                                        {card.title}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            fontSize: {
                                                xs: "2rem",
                                                md: "2.25rem"
                                            },
                                            fontWeight: 800,
                                            letterSpacing: "-1.2px",
                                            lineHeight: 1.15,
                                            color: "#172B4D",
                                            overflowWrap: "anywhere"
                                        }}
                                    >
                                        {card.value}
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        flexShrink: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "13px",
                                        bgcolor: card.background,
                                        border: `1px solid ${card.border}`,
                                        color: card.color,
                                        "& svg": {
                                            fontSize: 25
                                        }
                                    }}
                                >
                                    {card.icon}
                                </Box>
                            </Stack>

                            <Box
                                sx={{
                                    mt: 2.5,
                                    pt: 1.5,
                                    borderTop: "1px solid #F1F5F9"
                                }}
                            >
                                <Stack
                                    direction="row"
                                    spacing={0.75}
                                    alignItems="center"
                                >
                                    <TrendingUpRoundedIcon
                                        sx={{
                                            fontSize: 17,
                                            color: card.color
                                        }}
                                    />

                                    <Typography
                                        sx={{
                                            fontSize: 11,
                                            color: "#64748B",
                                            fontWeight: 600
                                        }}
                                    >
                                        {card.subtitle}
                                    </Typography>
                                </Stack>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default StatsCards;
