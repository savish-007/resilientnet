// Dynamic API Configuration for ResilientNet
// Works both in desktop browser (localhost:5000) and on mobile Android APK (LAN IP: 192.168.31.72:5000)

const detectServerUrl = () => {
    // 1. Check if user configured a custom server in localStorage
    const saved = localStorage.getItem("custom_server_url");
    if (saved && saved.trim()) {
        return saved.trim().replace(/\/+$/, "");
    }

    // 2. Environment variable
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace(/\/+$/, "");
    }

    // 3. Mobile environment (Capacitor native app)
    if (typeof window !== "undefined") {
        const isCapacitor =
            window.Capacitor?.isNativePlatform?.() ||
            window.location.protocol === "capacitor:" ||
            window.location.protocol === "file:";

        if (isCapacitor) {
            // Android mobile connects to the host computer's Wi-Fi IP
            return "http://192.168.31.72:5000";
        }

        // 4. Browser on non-localhost device (e.g. tablet on LAN)
        if (window.location.hostname && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
            return `http://${window.location.hostname}:5000`;
        }
    }

    // 5. Default desktop browser
    return "http://localhost:5000";
};

export const API_SERVER_URL = detectServerUrl();
export const API_BASE_URL = `${API_SERVER_URL}/api`;

export default API_BASE_URL;
