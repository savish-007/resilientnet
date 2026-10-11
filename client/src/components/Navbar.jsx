
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Avatar,
    Box,
    Button
} from "@mui/material";
import NotificationMenu from "./NotificationMenu";
import NotificationsIcon from "@mui/icons-material/Notifications";

const Navbar = () => {
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    return (
        <AppBar
            position="static"
            elevation={1}
            sx={{
                backgroundColor: "#ffffff",
                color: "#000"
            }}
        >
            <Toolbar>
                <Typography
                    variant="h5"
                    sx={{
                        flexGrow: 1,
                        fontWeight: "bold"
                    }}
                >
                    Emergency Dashboard
                </Typography>

                <NotificationMenu />

                <Box sx={{ ml: 2 }}>
                    <Avatar sx={{ bgcolor: "#1976d2" }}>
                        A
                    </Avatar>
                </Box>

                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleLogout}
                    sx={{ ml: 2 }}
                >
                    Logout
                </Button>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
