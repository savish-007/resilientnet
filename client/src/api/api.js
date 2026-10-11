
import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api",
});

// Attach the saved JWT to API requests.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Handle expired or invalid sessions centrally.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const hadSession = Boolean(
                localStorage.getItem("token")
            );

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            if (
                hadSession &&
                window.location.pathname !== "/reset-password"
            ) {
                window.location.href = "/";
            }
        }

        return Promise.reject(error);
    }
);

export default api;
