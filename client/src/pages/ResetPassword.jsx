
import { useState } from "react";

const API_URL = "http://localhost:5000/api";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const token = new URLSearchParams(window.location.search).get("token");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!token) {
            setError("This password-reset link is invalid or missing its token.");
            return;
        }

        if (password.length < 8 || password.length > 128) {
            setError("Password must be between 8 and 128 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/auth/reset-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Password reset failed.");
            }

            setMessage(data.message);
            setPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError(err.message || "Unable to reset your password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#f3f4f6",
            padding: "20px",
        }}>
            <form
                onSubmit={handleSubmit}
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    background: "#ffffff",
                    padding: "32px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
            >
                <h2 style={{ marginTop: 0 }}>Reset Password</h2>

                <p>Enter and confirm your new password.</p>

                <label htmlFor="password">New password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    required
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px",
                        margin: "8px 0 16px",
                    }}
                />

                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    required
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px",
                        margin: "8px 0 20px",
                    }}
                />

                {error && (
                    <p style={{ color: "#dc2626" }} role="alert">
                        {error}
                    </p>
                )}

                {message && (
                    <p style={{ color: "#15803d" }} role="status">
                        {message}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "12px",
                        background: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: loading ? "wait" : "pointer",
                    }}
                >
                    {loading ? "Resetting..." : "Reset Password"}
                </button>

                <p style={{ textAlign: "center", marginBottom: 0 }}>
                    <a href="/">Back to Login</a>
                </p>
            </form>
        </div>
    );
}
