import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ResourceDashboard from "./pages/ResourceDashboard";
import ResourceRequestDashboard from "./pages/ResourceRequestDashboard";

function App() {
    const token = localStorage.getItem("token");

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

    return <Dashboard />;
}

export default App;