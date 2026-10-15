import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    IconButton,
    InputAdornment,
    Link,
    Paper,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography
} from "@mui/material";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import BluetoothRoundedIcon from "@mui/icons-material/BluetoothRounded";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import MenuItem from "@mui/material/MenuItem";
import { API_BASE_URL, API_SERVER_URL, setCustomServerUrl } from "../config/apiConfig";
import meshService from "../services/meshService";

const API_URL = `${API_BASE_URL}/auth`;

const Login = () => {
    const [tabIndex, setTabIndex] = useState(0); // 0 = Sign In, 1 = Register
    const [forgotPassword, setForgotPassword] = useState(false);
    const [currentServerUrl, setCurrentServerUrl] = useState(API_SERVER_URL);

    // Offline Emergency SOS Dialog State
    const [offlineSOSOpen, setOfflineSOSOpen] = useState(false);
    const [offlineMessage, setOfflineMessage] = useState("");
    const [offlineName, setOfflineName] = useState("");
    const [offlinePhone, setOfflinePhone] = useState("");
    const [offlineCategory, setOfflineCategory] = useState("Medical Emergency");
    const [offlineLocation, setOfflineLocation] = useState(null);
    const [locating, setLocating] = useState(false);
    const [offlineSuccessPkt, setOfflineSuccessPkt] = useState(null);

    const detectLocation = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setOfflineLocation({
                    latitude: Number(pos.coords.latitude.toFixed(6)),
                    longitude: Number(pos.coords.longitude.toFixed(6))
                });
                setLocating(false);
            },
            () => setLocating(false),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSendOfflineSOS = (e) => {
        e.preventDefault();
        if (!offlineMessage.trim()) return;

        const packet = meshService.createOfflineSOS({
            sender_name: offlineName.trim() || "Distress Citizen",
            sender_phone: offlinePhone.trim(),
            message: offlineMessage.trim(),
            category: offlineCategory,
            severity: "HIGH",
            latitude: offlineLocation?.latitude || 12.9716,
            longitude: offlineLocation?.longitude || 77.5946
        });

        setOfflineSuccessPkt(packet);
        setOfflineMessage("");
    };

    // Login State
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    // Registration State
        // Registration State
    const [accountType, setAccountType] = useState("CITIZEN"); // "CITIZEN" or "VOLUNTEER"
    const [volunteerSkills, setVolunteerSkills] = useState("");
    const [fullName, setFullName] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPhone, setRegPhone] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regOrganization, setRegOrganization] = useState("");
    const [showRegPassword, setShowRegPassword] = useState(false);

    // Feedback
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const resetFeedback = () => {
        setError("");
        setMessage("");
    };

    const handleTabChange = (event, newIndex) => {
        setTabIndex(newIndex);
        setForgotPassword(false);
        resetFeedback();
    };

    // -------------------------------------------------------------
    // SIGN IN
    // -------------------------------------------------------------
    const handleLogin = async (e) => {
        e.preventDefault();
        resetFeedback();
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Invalid email or password.");
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            window.location.href = "/";
        } catch (err) {
            if (err.name === "TypeError" || err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
                setError(`Unable to reach backend server at ${currentServerUrl}. Please check that your phone is connected to the same Wi-Fi network (192.168.31.x).`);
            } else {
                setError(err.message || "Login failed. Please check your credentials.");
            }
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------
    // REGISTER
    // -------------------------------------------------------------
        const handleRegister = async (e) => {
        e.preventDefault();
        resetFeedback();

        if (regPassword.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: fullName,
                    email: regEmail,
                    phone: regPhone,
                    password: regPassword,
                    organization: regOrganization,
                    account_type: accountType,
                    skills: volunteerSkills
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed.");
            }

            setMessage(
                accountType === "VOLUNTEER"
                    ? "Volunteer application submitted! An administrator will review and assign your role. You can sign in to view status."
                    : "Citizen account created successfully! You can now sign in to access emergency assistance."
            );

            // Clear inputs
            setFullName("");
            setRegEmail("");
            setRegPhone("");
            setRegPassword("");
            setRegOrganization("");
            setVolunteerSkills("");
            setTabIndex(0); // Switch to Sign In tab
        } catch (err) {
            if (err.name === "TypeError" || err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
                setError(`Unable to reach backend server at ${currentServerUrl}. Please check that your phone is connected to the same Wi-Fi network (192.168.31.x).`);
            } else {
                setError(err.message || "Registration failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------
    // FORGOT PASSWORD
    // -------------------------------------------------------------
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        resetFeedback();
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginEmail })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to process password reset.");
            }

            setMessage(
                data.message ||
                    "If an account is associated with this email, a reset link has been dispatched."
            );
        } catch (err) {
            if (err.name === "TypeError" || err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
                setError(`Unable to reach backend server at ${currentServerUrl}. Please check Wi-Fi connection.`);
            } else {
                setError(err.message || "Unable to reach the server.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                background: "linear-gradient(135deg, #070D1E 0%, #0F172A 45%, #0B1E36 100%)",
                py: { xs: 3, md: 5 },
                px: 2,
                // Continuous CSS Animations
                "@keyframes floatBlob1": {
                    "0%": { transform: "translate(0px, 0px) scale(1)" },
                    "50%": { transform: "translate(110px, 80px) scale(1.18)" },
                    "100%": { transform: "translate(-50px, 130px) scale(0.92)" }
                },
                "@keyframes floatBlob2": {
                    "0%": { transform: "translate(0px, 0px) scale(1)" },
                    "50%": { transform: "translate(-90px, -80px) scale(1.15)" },
                    "100%": { transform: "translate(70px, -50px) scale(0.88)" }
                },
                "@keyframes floatBlob3": {
                    "0%": { transform: "translate(0px, 0px) scale(1)" },
                    "50%": { transform: "translate(60px, -100px) scale(1.22)" },
                    "100%": { transform: "translate(-70px, 40px) scale(0.85)" }
                }
            }}
        >
            {/* 1. Continuous Floating Ambient Glowing Orbs */}
            <Box
                sx={{
                    position: "absolute",
                    width: "550px",
                    height: "550px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(14, 165, 233, 0.45) 0%, rgba(37, 99, 235, 0.2) 50%, transparent 75%)",
                    filter: "blur(70px)",
                    top: "-10%",
                    left: "-8%",
                    animation: "floatBlob1 18s ease-in-out infinite alternate",
                    pointerEvents: "none"
                }}
            />

            <Box
                sx={{
                    position: "absolute",
                    width: "580px",
                    height: "580px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(16, 185, 129, 0.38) 0%, rgba(5, 150, 105, 0.15) 50%, transparent 75%)",
                    filter: "blur(75px)",
                    bottom: "-15%",
                    right: "-10%",
                    animation: "floatBlob2 22s ease-in-out infinite alternate",
                    pointerEvents: "none"
                }}
            />

            <Box
                sx={{
                    position: "absolute",
                    width: "480px",
                    height: "480px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(239, 68, 68, 0.32) 0%, rgba(220, 38, 38, 0.12) 50%, transparent 75%)",
                    filter: "blur(65px)",
                    top: "35%",
                    right: "15%",
                    animation: "floatBlob3 15s ease-in-out infinite alternate",
                    pointerEvents: "none"
                }}
            />

            {/* Subtle Grid Overlay */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                    pointerEvents: "none"
                }}
            />

            {/* 2. Centered iOS Glassmorphic Card */}
            <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: "28px",
                        bgcolor: "rgba(255, 255, 255, 0.82)",
                        backdropFilter: "blur(30px) saturate(190%)",
                        WebkitBackdropFilter: "blur(30px) saturate(190%)",
                        border: "1px solid rgba(255, 255, 255, 0.65)",
                        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.4) inset",
                        overflow: "hidden"
                    }}
                >
                    {/* Brand Header with Uploaded Logo */}
                    <Box sx={{ pt: 4, pb: 2, px: 3, textAlign: "center" }}>
                        <Box
                            component="img"
                            src="/logo.png"
                            alt="ResilientNet Logo"
                            sx={{
                                width: 92,
                                height: 92,
                                objectFit: "contain",
                                mb: 1.5,
                                filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.12))",
                                transition: "0.3s transform",
                                "&:hover": { transform: "scale(1.05)" }
                            }}
                        />

                        <Typography
                            variant="h5"
                            fontWeight={900}
                            sx={{
                                color: "#0B1E36",
                                letterSpacing: "-0.5px",
                                lineHeight: 1.1
                            }}
                        >
                            ResilientNet
                        </Typography>

                        <Typography
                            variant="caption"
                            sx={{
                                color: "#059669",
                                fontWeight: 800,
                                letterSpacing: "1px",
                                display: "block",
                                mt: 0.5
                            }}
                        >
                            PEOPLE • RESOURCES • SAFER COMMUNITIES
                        </Typography>

                        <Chip
                            label="Emergency Response Network"
                            size="small"
                            sx={{
                                mt: 1.5,
                                bgcolor: "rgba(11, 30, 54, 0.06)",
                                color: "#0B1E36",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                border: "1px solid rgba(11, 30, 54, 0.12)"
                            }}
                        />
                    </Box>

                    {/* Emergency Offline Bluetooth Mesh SOS Button */}
                    <Box sx={{ px: { xs: 3, sm: 4 }, mt: 2 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<BluetoothRoundedIcon />}
                            onClick={() => {
                                setOfflineSOSOpen(true);
                                detectLocation();
                            }}
                            sx={{
                                py: 1.2,
                                borderRadius: "14px",
                                background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
                                color: "#FFFFFF",
                                fontWeight: 800,
                                fontSize: "0.88rem",
                                textTransform: "none",
                                boxShadow: "0 4px 14px rgba(220, 38, 38, 0.35)",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)"
                                }
                            }}
                        >
                            🚨 Offline Distress SOS (Bluetooth Mesh)
                        </Button>
                    </Box>

                    {/* iOS-Style Segmented Control Tabs */}
                    {!forgotPassword && (
                        <Box sx={{ px: { xs: 3, sm: 4 }, mt: 2 }}>
                            <Tabs
                                value={tabIndex}
                                onChange={handleTabChange}
                                variant="fullWidth"
                                sx={{
                                    bgcolor: "rgba(0, 0, 0, 0.05)",
                                    borderRadius: "14px",
                                    p: "4px",
                                    minHeight: 44,
                                    "& .MuiTabs-indicator": {
                                        display: "none"
                                    },
                                    "& .MuiTab-root": {
                                        borderRadius: "11px",
                                        fontWeight: 700,
                                        fontSize: "0.9rem",
                                        textTransform: "none",
                                        minHeight: 36,
                                        color: "#64748B",
                                        transition: "all 0.2s ease",
                                        "&.Mui-selected": {
                                            bgcolor: "#FFFFFF",
                                            color: "#0B1E36 !important",
                                            boxShadow: "0 3px 8px rgba(0, 0, 0, 0.08)"
                                        }
                                    }
                                }}
                            >
                                <Tab label="Sign In" />
                                <Tab label="Create Account" />
                            </Tabs>
                        </Box>
                    )}

                    <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                        {error && (
                            <Alert
                                severity="error"
                                sx={{
                                    mb: 2.5,
                                    borderRadius: "14px",
                                    bgcolor: "rgba(254, 242, 242, 0.9)"
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        {message && (
                            <Alert
                                severity="success"
                                sx={{
                                    mb: 2.5,
                                    borderRadius: "14px",
                                    bgcolor: "rgba(240, 253, 244, 0.9)"
                                }}
                            >
                                {message}
                            </Alert>
                        )}

                        {/* 1. FORGOT PASSWORD */}
                        {forgotPassword ? (
                            <Box component="form" onSubmit={handleForgotPassword}>
                                <Typography variant="h6" fontWeight={800} color="#0B1E36" gutterBottom>
                                    Reset Password
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                                    Enter your registered email address and we will dispatch a secure 15-minute reset link.
                                </Typography>

                                <TextField
                                    fullWidth
                                    label="Registered Email"
                                    type="email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    sx={{
                                        mb: 2.5,
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "14px",
                                            bgcolor: "rgba(255, 255, 255, 0.9)"
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailOutlinedIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                />

                                <Button
                                    fullWidth
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                    sx={{
                                        minHeight: 48,
                                        borderRadius: "14px",
                                        background: "linear-gradient(135deg, #0A58CA 0%, #0D6EFD 100%)",
                                        fontWeight: 800,
                                        fontSize: "0.95rem",
                                        textTransform: "none",
                                        boxShadow: "0 6px 18px rgba(13, 110, 253, 0.25)",
                                        "&:hover": {
                                            background: "linear-gradient(135deg, #084298 0%, #0A58CA 100%)"
                                        }
                                    }}
                                >
                                    {loading ? <CircularProgress size={22} color="inherit" /> : "Send Reset Link"}
                                </Button>

                                <Box sx={{ textAlign: "center", mt: 2.5 }}>
                                    <Link
                                        component="button"
                                        type="button"
                                        onClick={() => {
                                            setForgotPassword(false);
                                            resetFeedback();
                                        }}
                                        underline="hover"
                                        sx={{ fontWeight: 700, color: "#475569" }}
                                    >
                                        Back to Sign In
                                    </Link>
                                </Box>
                            </Box>
                        ) : tabIndex === 0 ? (
                            /* 2. SIGN IN */
                            <Box component="form" onSubmit={handleLogin}>
                                <Stack spacing={2.2}>
                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        type="email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: "14px",
                                                bgcolor: "rgba(255, 255, 255, 0.9)"
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailOutlinedIcon color="action" />
                                                </InputAdornment>
                                            )
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Password"
                                        type={showLoginPassword ? "text" : "password"}
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: "14px",
                                                bgcolor: "rgba(255, 255, 255, 0.9)"
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockOutlinedIcon color="action" />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                        edge="end"
                                                    >
                                                        {showLoginPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />

                                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                        <Link
                                            component="button"
                                            type="button"
                                            onClick={() => {
                                                setForgotPassword(true);
                                                resetFeedback();
                                            }}
                                            underline="hover"
                                            sx={{
                                                fontSize: "0.85rem",
                                                fontWeight: 700,
                                                color: "#0284C7"
                                            }}
                                        >
                                            Forgot password?
                                        </Link>
                                    </Box>

                                    <Button
                                        fullWidth
                                        type="submit"
                                        variant="contained"
                                        disabled={loading}
                                        sx={{
                                            minHeight: 50,
                                            borderRadius: "14px",
                                            background: "linear-gradient(135deg, #0A58CA 0%, #0D6EFD 100%)",
                                            fontWeight: 800,
                                            fontSize: "1rem",
                                            textTransform: "none",
                                            boxShadow: "0 6px 20px rgba(13, 110, 253, 0.28)",
                                            "&:hover": {
                                                background: "linear-gradient(135deg, #084298 0%, #0A58CA 100%)"
                                            }
                                        }}
                                    >
                                        {loading ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            "Sign In to ResilientNet"
                                        )}
                                    </Button>
                                </Stack>
                            </Box>
                                                ) : (
                            /* 3. CREATE ACCOUNT / REGISTER */
                            <Box component="form" onSubmit={handleRegister}>
                                <Stack spacing={2}>
                                    {/* Account Type Selector */}
                                    <Box
                                        sx={{
                                            p: 0.6,
                                            borderRadius: "14px",
                                            bgcolor: "rgba(226, 232, 240, 0.7)",
                                            display: "flex",
                                            gap: 0.8
                                        }}
                                    >
                                        <Button
                                            fullWidth
                                            type="button"
                                            onClick={() => setAccountType("CITIZEN")}
                                            sx={{
                                                borderRadius: "11px",
                                                py: 1,
                                                fontWeight: 800,
                                                fontSize: "0.86rem",
                                                textTransform: "none",
                                                bgcolor: accountType === "CITIZEN" ? "#FFFFFF" : "transparent",
                                                color: accountType === "CITIZEN" ? "#0F172A" : "#64748B",
                                                boxShadow: accountType === "CITIZEN" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                                                "&:hover": {
                                                    bgcolor: accountType === "CITIZEN" ? "#FFFFFF" : "rgba(255,255,255,0.4)"
                                                }
                                            }}
                                        >
                                            🆘 Citizen / Need Help
                                        </Button>

                                        <Button
                                            fullWidth
                                            type="button"
                                            onClick={() => setAccountType("VOLUNTEER")}
                                            sx={{
                                                borderRadius: "11px",
                                                py: 1,
                                                fontWeight: 800,
                                                fontSize: "0.86rem",
                                                textTransform: "none",
                                                bgcolor: accountType === "VOLUNTEER" ? "#FFFFFF" : "transparent",
                                                color: accountType === "VOLUNTEER" ? "#0F172A" : "#64748B",
                                                boxShadow: accountType === "VOLUNTEER" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                                                "&:hover": {
                                                    bgcolor: accountType === "VOLUNTEER" ? "#FFFFFF" : "rgba(255,255,255,0.4)"
                                                }
                                            }}
                                        >
                                            🤝 Apply as Volunteer
                                        </Button>
                                    </Box>

                                    <Typography variant="caption" sx={{ color: "#64748B", px: 0.5, mt: -0.5 }}>
                                        {accountType === "CITIZEN"
                                            ? "Citizen accounts can submit emergency SOS alerts with GPS and request supplies."
                                            : "Volunteer applications require review and assignment by an Administrator."}
                                    </Typography>

                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        placeholder="Jane Doe"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: "14px",
                                                bgcolor: "rgba(255, 255, 255, 0.9)"
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonOutlineRoundedIcon color="action" />
                                                </InputAdornment>
                                            )
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        type="email"
                                        placeholder="jane@example.com"
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: "14px",
                                                bgcolor: "rgba(255, 255, 255, 0.9)"
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailOutlinedIcon color="action" />
                                                </InputAdornment>
                                            )
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Phone Number"
                                        placeholder="+1 555-0199"
                                        value={regPhone}
                                        onChange={(e) => setRegPhone(e.target.value)}
                                        required
                                        helperText="Used for emergency contact"
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: "14px",
                                                bgcolor: "rgba(255, 255, 255, 0.9)"
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PhoneOutlinedIcon color="action" />
                                                </InputAdornment>
                                            )
                                        }}
                                    />

                                    {accountType === "VOLUNTEER" && (
                                        <TextField
                                            fullWidth
                                            label="Skills / Qualifications"
                                            placeholder="e.g. First Aid, CPR, Search & Rescue, 4x4 Driver, Logistics"
                                            value={volunteerSkills}
                                            onChange={(e) => setVolunteerSkills(e.target.value)}
                                            helperText="List any emergency skills to help admin assign tasks"
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "14px",
                                                    bgcolor: "rgba(255, 255, 255, 0.9)"
                                                }
                                            }}
                                        />
                                    )}

                                    <TextField
                                        fullWidth
                                        label="Organization / Affiliation (Optional)"
                                        placeholder="e.g. Red Cross, Civil Defense, Community Member"
                                        value={regOrganization}
                                        onChange={(e) => setRegOrganization(e.target.value)}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: "14px",
                                                bgcolor: "rgba(255, 255, 255, 0.9)"
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <BusinessOutlinedIcon color="action" />
                                                </InputAdornment>
                                            )
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Password"
                                        type={showRegPassword ? "text" : "password"}
                                        value={regPassword}
                                        onChange={(e) => setRegPassword(e.target.value)}
                                        required
                                        helperText="Minimum 8 characters"
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: "14px",
                                                bgcolor: "rgba(255, 255, 255, 0.9)"
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockOutlinedIcon color="action" />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowRegPassword(!showRegPassword)}
                                                        edge="end"
                                                    >
                                                        {showRegPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />

                                    <Button
                                        fullWidth
                                        type="submit"
                                        variant="contained"
                                        disabled={loading}
                                        sx={{
                                            minHeight: 50,
                                            borderRadius: "14px",
                                            background:
                                                accountType === "VOLUNTEER"
                                                    ? "linear-gradient(135deg, #059669 0%, #10B981 100%)"
                                                    : "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
                                            fontWeight: 800,
                                            fontSize: "1rem",
                                            textTransform: "none",
                                            boxShadow:
                                                accountType === "VOLUNTEER"
                                                    ? "0 6px 20px rgba(16, 185, 129, 0.28)"
                                                    : "0 6px 20px rgba(239, 68, 68, 0.28)",
                                            "&:hover": {
                                                background:
                                                    accountType === "VOLUNTEER"
                                                        ? "linear-gradient(135deg, #047857 0%, #059669 100%)"
                                                        : "linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)"
                                            }
                                        }}
                                    >
                                        {loading ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : accountType === "VOLUNTEER" ? (
                                            "Submit Volunteer Application"
                                        ) : (
                                            "Register Emergency Citizen Account"
                                        )}
                                    </Button>
                                </Stack>
                            </Box>
                        )}

                        {/* Server Address & Connectivity Indicator */}
                        <Box
                            sx={{
                                mt: 3,
                                pt: 2,
                                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                                textAlign: "center"
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{ color: "rgba(255, 255, 255, 0.4)", display: "block", fontSize: "0.75rem" }}
                            >
                                Backend Server:{" "}
                                <strong style={{ color: "#38bdf8", fontWeight: 600 }}>
                                    {currentServerUrl}
                                </strong>
                            </Typography>
                            <Button
                                size="small"
                                sx={{
                                    fontSize: "0.72rem",
                                    textTransform: "none",
                                    color: "rgba(255, 255, 255, 0.6)",
                                    mt: 0.5,
                                    "&:hover": { color: "#fff" }
                                }}
                                onClick={() => {
                                    const input = window.prompt(
                                        "Configure Backend Server URL (e.g. http://192.168.31.72:5000):",
                                        currentServerUrl
                                    );
                                    if (input !== null && input.trim()) {
                                        setCustomServerUrl(input.trim());
                                        setCurrentServerUrl(input.trim());
                                        window.location.reload();
                                    }
                                }}
                            >
                                Tap to change server address
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Container>

            {/* Offline Emergency SOS Dialog */}
            <Dialog
                open={offlineSOSOpen}
                onClose={() => {
                    setOfflineSOSOpen(false);
                    setOfflineSuccessPkt(null);
                }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: "24px",
                        p: 1,
                        bgcolor: "#0F172A",
                        color: "#FFFFFF",
                        border: "1px solid rgba(239, 68, 68, 0.4)",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <BluetoothRoundedIcon sx={{ color: "#FFFFFF", fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={850} color="#FFFFFF">
                                Offline Distress SOS (Bluetooth Mesh)
                            </Typography>
                            <Typography variant="caption" color="#F87171" fontWeight={700}>
                                ZERO INTERNET REQUIRED • MULTI-HOP STORE-AND-FORWARD
                            </Typography>
                        </Box>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    {offlineSuccessPkt ? (
                        <Box sx={{ py: 3, textAlign: "center" }}>
                            <Box sx={{ width: 68, height: 68, borderRadius: "50%", bgcolor: "rgba(16, 185, 129, 0.2)", border: "2px solid #10B981", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                                <BluetoothRoundedIcon sx={{ color: "#34D399", fontSize: 40 }} />
                            </Box>
                            <Typography variant="h6" fontWeight={850} color="#34D399" sx={{ mb: 1 }}>
                                SOS Broadcasting via Bluetooth Mesh!
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#E2E8F0 !important", maxWidth: 440, mx: "auto", mb: 2.5, lineHeight: 1.6, fontWeight: 500 }}>
                                Your distress alert has been safely stored in your phone's persistent buffer. It is actively transmitting over Bluetooth Low Energy to any mobile phone passing nearby.
                            </Typography>
                            <Paper sx={{ p: 2, borderRadius: "14px", bgcolor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(56, 189, 248, 0.3)", mb: 2, textAlign: "left" }}>
                                <Typography variant="caption" sx={{ color: "#94A3B8 !important", fontWeight: 750, display: "block" }}>MESH PACKET ID:</Typography>
                                <Typography variant="body2" fontFamily="monospace" sx={{ color: "#38BDF8 !important", fontWeight: 700, mt: 0.2 }}>{offlineSuccessPkt.mesh_message_id}</Typography>
                                <Typography variant="caption" sx={{ color: "#94A3B8 !important", fontWeight: 750, display: "block", mt: 1.2 }}>HOP ROUTE:</Typography>
                                <Typography variant="caption" sx={{ color: "#34D399 !important", fontWeight: 700, display: "block" }}>Origin: {offlineSuccessPkt.origin_node} ──BLE Broadcast──&gt; (Passing Phones)</Typography>
                            </Paper>
                        </Box>
                    ) : (
                        <Box component="form" onSubmit={handleSendOfflineSOS} sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ color: "#E2E8F0 !important", mb: 2.5, fontWeight: 500, lineHeight: 1.6 }}>
                                If cellular networks and Wi-Fi are down, this device will store your message and transmit it to passing phones via Bluetooth until it reaches emergency rescue teams.
                            </Typography>

                            <Stack spacing={2.5}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Emergency Type"
                                    value={offlineCategory}
                                    onChange={(e) => setOfflineCategory(e.target.value)}
                                    size="small"
                                    slotProps={{
                                        select: {
                                            MenuProps: {
                                                PaperProps: {
                                                    sx: {
                                                        bgcolor: "#1E293B",
                                                        border: "1px solid rgba(255,255,255,0.15)",
                                                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                                                        "& .MuiMenuItem-root": {
                                                            color: "#FFFFFF !important",
                                                            py: 1.2,
                                                            fontSize: "0.9rem",
                                                            fontWeight: 600,
                                                            "&:hover": { bgcolor: "rgba(56, 189, 248, 0.2)" },
                                                            "&.Mui-selected": { bgcolor: "rgba(56, 189, 248, 0.35) !important", color: "#38BDF8 !important" }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            color: "#FFFFFF",
                                            bgcolor: "rgba(255,255,255,0.08)",
                                            borderRadius: "12px",
                                            "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                            "&:hover fieldset": { borderColor: "#38BDF8" },
                                            "&.Mui-focused fieldset": { borderColor: "#38BDF8" }
                                        },
                                        "& .MuiSelect-select": {
                                            color: "#FFFFFF !important",
                                            WebkitTextFillColor: "#FFFFFF !important",
                                            fontWeight: 700
                                        },
                                        "& .MuiSelect-icon": { color: "#38BDF8 !important" },
                                        "& .MuiInputLabel-root": { color: "#CBD5E1 !important", fontWeight: 700 },
                                        "& .MuiInputLabel-root.Mui-focused": { color: "#38BDF8 !important" }
                                    }}
                                >
                                    <MenuItem value="Medical Emergency">Medical Emergency</MenuItem>
                                    <MenuItem value="Flood Evacuation">Flood / Water Rescue</MenuItem>
                                    <MenuItem value="Trapped in Debris">Trapped in Debris / Building Collapse</MenuItem>
                                    <MenuItem value="Food & Water Needed">Food & Water Shortage</MenuItem>
                                    <MenuItem value="Fire Threat">Fire Threat</MenuItem>
                                </TextField>

                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    required
                                    label="Emergency Details / Specific Assistance"
                                    placeholder="e.g. 3 people trapped on rooftop, elderly person diabetic needing insulin..."
                                    value={offlineMessage}
                                    onChange={(e) => setOfflineMessage(e.target.value)}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            color: "#FFFFFF",
                                            bgcolor: "rgba(255,255,255,0.08)",
                                            borderRadius: "12px",
                                            "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                            "&:hover fieldset": { borderColor: "#38BDF8" },
                                            "&.Mui-focused fieldset": { borderColor: "#38BDF8" }
                                        },
                                        "& .MuiInputBase-input": {
                                            color: "#FFFFFF !important",
                                            WebkitTextFillColor: "#FFFFFF !important",
                                            fontWeight: 600,
                                            lineHeight: 1.5
                                        },
                                        "& .MuiInputBase-input::placeholder": {
                                            color: "#94A3B8 !important",
                                            opacity: 1
                                        },
                                        "& .MuiInputLabel-root": { color: "#CBD5E1 !important", fontWeight: 700 },
                                        "& .MuiInputLabel-root.Mui-focused": { color: "#38BDF8 !important" }
                                    }}
                                />

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Your Name (Optional)"
                                        value={offlineName}
                                        onChange={(e) => setOfflineName(e.target.value)}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                color: "#FFFFFF",
                                                bgcolor: "rgba(255,255,255,0.08)",
                                                borderRadius: "12px",
                                                "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                                "&:hover fieldset": { borderColor: "#38BDF8" },
                                                "&.Mui-focused fieldset": { borderColor: "#38BDF8" }
                                            },
                                            "& .MuiInputBase-input": {
                                                color: "#FFFFFF !important",
                                                WebkitTextFillColor: "#FFFFFF !important",
                                                fontWeight: 600
                                            },
                                            "& .MuiInputLabel-root": { color: "#CBD5E1 !important", fontWeight: 700 },
                                            "& .MuiInputLabel-root.Mui-focused": { color: "#38BDF8 !important" }
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Phone Number (Optional)"
                                        value={offlinePhone}
                                        onChange={(e) => setOfflinePhone(e.target.value)}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                color: "#FFFFFF",
                                                bgcolor: "rgba(255,255,255,0.08)",
                                                borderRadius: "12px",
                                                "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                                                "&:hover fieldset": { borderColor: "#38BDF8" },
                                                "&.Mui-focused fieldset": { borderColor: "#38BDF8" }
                                            },
                                            "& .MuiInputBase-input": {
                                                color: "#FFFFFF !important",
                                                WebkitTextFillColor: "#FFFFFF !important",
                                                fontWeight: 600
                                            },
                                            "& .MuiInputLabel-root": { color: "#CBD5E1 !important", fontWeight: 700 },
                                            "& .MuiInputLabel-root.Mui-focused": { color: "#38BDF8 !important" }
                                        }}
                                    />
                                </Stack>

                                {/* GPS Status */}
                                <Paper sx={{ p: 2, borderRadius: "14px", bgcolor: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: "#CBD5E1 !important", fontWeight: 800, display: "block", letterSpacing: "0.5px" }}>OFFLINE GPS COORDINATES</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 850, color: offlineLocation ? "#34D399 !important" : "#FBBF24 !important", mt: 0.2 }}>
                                            {offlineLocation ? `${offlineLocation.latitude}, ${offlineLocation.longitude}` : "Acquiring satellite GPS fix..."}
                                        </Typography>
                                    </Box>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={detectLocation}
                                        startIcon={<MyLocationRoundedIcon />}
                                        sx={{ textTransform: "none", color: "#38BDF8", borderColor: "rgba(56, 189, 248, 0.4)", borderRadius: "10px", fontWeight: 800, "&:hover": { borderColor: "#38BDF8", bgcolor: "rgba(56, 189, 248, 0.1)" } }}
                                    >
                                        {locating ? "Locating..." : "Refresh GPS"}
                                    </Button>
                                </Paper>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    startIcon={<BluetoothRoundedIcon />}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: "14px",
                                        background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
                                        color: "#FFFFFF",
                                        fontWeight: 850,
                                        fontSize: "0.95rem",
                                        textTransform: "none",
                                        boxShadow: "0 6px 20px rgba(220, 38, 38, 0.4)",
                                        "&:hover": {
                                            background: "linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)"
                                        }
                                    }}
                                >
                                    Broadcast Offline SOS via Bluetooth Mesh
                                </Button>
                            </Stack>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, borderColor: "rgba(255,255,255,0.08)" }}>
                    <Button
                        onClick={() => {
                            setOfflineSOSOpen(false);
                            setOfflineSuccessPkt(null);
                        }}
                        sx={{ color: "#94A3B8", textTransform: "none" }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Login;