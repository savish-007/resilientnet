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
import { API_BASE_URL } from "../config/apiConfig";

const API_URL = `${API_BASE_URL}/auth`;

const Login = () => {
    const [tabIndex, setTabIndex] = useState(0); // 0 = Sign In, 1 = Register
    const [forgotPassword, setForgotPassword] = useState(false);

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
            setError(err.message || "Login failed. Please check your credentials.");
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
            setError(err.message || "Registration failed. Please try again.");
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
            setError(err.message || "Unable to reach the server.");
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

                    {/* iOS-Style Segmented Control Tabs */}
                    {!forgotPassword && (
                        <Box sx={{ px: { xs: 3, sm: 4 }, mt: 1 }}>
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
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default Login;