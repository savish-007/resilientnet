// Dynamic API Configuration for ResilientNet
// Works both in desktop browser and native Android mobile APK

export const HOST_LAN_IP = "192.168.31.72";
export const BACKEND_PORT = "5000";
export const DEFAULT_SERVER_URL = `http://${HOST_LAN_IP}:${BACKEND_PORT}`;

export const getSavedServerUrl = () => {
    try {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("custom_server_url");
            if (saved && saved.trim()) {
                return saved.trim().replace(/\/+$/, "");
            }
        }
    } catch {
        // ignore
    }
    return null;
};

export const setCustomServerUrl = (url) => {
    try {
        if (typeof window !== "undefined") {
            if (!url || !url.trim()) {
                localStorage.removeItem("custom_server_url");
            } else {
                localStorage.setItem("custom_server_url", url.trim().replace(/\/+$/, ""));
            }
        }
    } catch {
        // ignore
    }
};

export const detectServerUrl = () => {
    // 1. User overridden custom URL from localStorage
    const custom = getSavedServerUrl();
    if (custom) return custom;

    // 2. Vite environment variable (if explicitly configured)
    if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) {
        return import.meta.env.VITE_API_URL.trim().replace(/\/+$/, "");
    }

    // 3. Desktop browser running on Vite dev server (port 5173 / 5174 / 4175)
    if (typeof window !== "undefined" && window.location) {
        const port = window.location.port;
        const host = window.location.hostname;

        if ((host === "localhost" || host === "127.0.0.1") && (port === "5173" || port === "5174" || port === "4175")) {
            return `http://localhost:${BACKEND_PORT}`;
        }

        // Browser on LAN device with a port (e.g. tablet opening http://192.168.31.72:5173)
        if (host && host !== "localhost" && host !== "127.0.0.1") {
            return `http://${host}:${BACKEND_PORT}`;
        }
    }

    // 4. Default for Android APK & Mobile -> Always connect to Host Computer on Wi-Fi
    return DEFAULT_SERVER_URL;
};

export const API_SERVER_URL = detectServerUrl();
export const API_BASE_URL = `${API_SERVER_URL}/api`;

export default API_BASE_URL;
