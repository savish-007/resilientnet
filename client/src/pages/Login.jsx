
import { useState } from "react";
import {
    Box,
    Button,
    Container,
    Paper,
    TextField,
    Typography,
    Alert,
    Link
} from "@mui/material";

const API_URL = "http://localhost:5000/api/auth";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [forgotPassword, setForgotPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            window.location.href = "/";
        } catch (error) {
            setError(error.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/forgot-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to process your request."
                );
            }

            setMessage(data.message);
        } catch (error) {
            setError(
                error.message || "Unable to contact the server."
            );
        } finally {
            setLoading(false);
        }
    };

    const openForgotPassword = () => {
        setError("");
        setMessage("");
        setForgotPassword(true);
    };

    const openLogin = () => {
        setError("");
        setMessage("");
        setForgotPassword(false);
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >
                <Paper
                    elevation={4}
                    sx={{
                        width: "100%",
                        padding: 4
                    }}
                >
                    <Typography
                        variant="h4"
                        component="h1"
                        align="center"
                        gutterBottom
                    >
                        ResilientNet
                    </Typography>

                    <Typography
                        variant="h6"
                        align="center"
                        gutterBottom
                    >
                        {forgotPassword
                            ? "Forgot Password"
                            : "Emergency Response Login"}
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {message && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {message}
                        </Alert>
                    )}

                    {forgotPassword ? (
                        <Box
                            component="form"
                            onSubmit={handleForgotPassword}
                        >
                            <Typography sx={{ mb: 2 }}>
                                Enter your registered email address.
                                If an account exists, we will send you
                                a password-reset link.
                            </Typography>

                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                margin="normal"
                                autoComplete="email"
                                required
                            />

                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{ mt: 2 }}
                            >
                                {loading
                                    ? "Sending..."
                                    : "Send Reset Link"}
                            </Button>

                            <Box sx={{ textAlign: "center", mt: 2 }}>
                                <Link
                                    component="button"
                                    type="button"
                                    onClick={openLogin}
                                    underline="hover"
                                >
                                    Back to Login
                                </Link>
                            </Box>
                        </Box>
                    ) : (
                        <Box component="form" onSubmit={handleLogin}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                margin="normal"
                                autoComplete="email"
                                required
                            />

                            <TextField
                                fullWidth
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                margin="normal"
                                autoComplete="current-password"
                                required
                            />

                            <Box sx={{ textAlign: "right", mt: 1 }}>
                                <Link
                                    component="button"
                                    type="button"
                                    onClick={openForgotPassword}
                                    underline="hover"
                                >
                                    Forgot Password?
                                </Link>
                            </Box>

                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{ mt: 2 }}
                            >
                                {loading ? "Logging in..." : "Login"}
                            </Button>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;
