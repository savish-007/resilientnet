import React from "react";
import { Box, Card, CardContent, Typography, Button, Stack } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ResilientNet ErrorBoundary caught error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleResetStorage = () => {
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch {}
        window.location.href = "/";
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        minHeight: "100vh",
                        bgcolor: "#0A1120",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 3
                    }}
                >
                    <Card
                        sx={{
                            maxWidth: 480,
                            width: "100%",
                            borderRadius: "24px",
                            bgcolor: "rgba(30, 41, 59, 0.8)",
                            backdropFilter: "blur(20px)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                            p: 2,
                            textAlign: "center"
                        }}
                    >
                        <CardContent>
                            <Box
                                component="img"
                                src="/logo.png"
                                alt="ResilientNet Logo"
                                sx={{ width: 64, height: 64, mx: "auto", mb: 2 }}
                            />

                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 1.5 }}>
                                <WarningAmberRoundedIcon sx={{ color: "#EF4444", fontSize: 28 }} />
                                <Typography variant="h6" fontWeight={800} color="#FFFFFF">
                                    ResilientNet Safe Recovery
                                </Typography>
                            </Stack>

                            <Typography variant="body2" color="#94A3B8" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                                The emergency portal encountered an unexpected runtime state. Tap below to reload the app or reset the offline cache.
                            </Typography>

                            {this.state.error?.message && (
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: "12px",
                                        bgcolor: "rgba(0,0,0,0.4)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        mb: 3,
                                        textAlign: "left"
                                    }}
                                >
                                    <Typography variant="caption" color="#EF4444" fontFamily="monospace" sx={{ display: "block" }}>
                                        {this.state.error.message}
                                    </Typography>
                                </Box>
                            )}

                            <Stack spacing={1.5}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={this.handleReload}
                                    startIcon={<RefreshRoundedIcon />}
                                    sx={{
                                        borderRadius: "12px",
                                        py: 1.2,
                                        fontWeight: 800,
                                        textTransform: "none",
                                        bgcolor: "#0284C7",
                                        color: "#FFFFFF",
                                        "&:hover": { bgcolor: "#0369A1" }
                                    }}
                                >
                                    Reload Emergency App
                                </Button>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={this.handleResetStorage}
                                    sx={{
                                        borderRadius: "12px",
                                        py: 1,
                                        color: "#94A3B8",
                                        borderColor: "rgba(255,255,255,0.2)",
                                        textTransform: "none",
                                        fontWeight: 700,
                                        "&:hover": { borderColor: "rgba(255,255,255,0.4)", color: "#FFFFFF" }
                                    }}
                                >
                                    Clear Offline Cache & Restart
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
