
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ResourceDashboard from "./pages/ResourceDashboard";
import ResourceRequestDashboard from "./pages/ResourceRequestDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import ResetPassword from "./pages/ResetPassword";

function App() {
    const token = localStorage.getItem("token");
    if (window.location.pathname === "/reset-password") {
    return <ResetPassword />;
    }

    if (!token) {
        return <Login />;
    }

    const path = window.location.pathname;


    if (path === "/resources") {
        return <ResourceDashboard />;
    }

    if (path === "/resource-requests") {
        return <ResourceRequestDashboard />;
    }

    if (path === "/volunteers") {
        return <VolunteerDashboard />;
    }

    return <Dashboard />;
}

export default App;
