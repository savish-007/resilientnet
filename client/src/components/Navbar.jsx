
import {
    AppBar,
    Toolbar,
    Typography,
    Avatar,
    Box,
    Button,
    Stack,
    Divider,
    Tooltip
} from "@mui/material";

import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";

import NotificationMenu from "./NotificationMenu";

const Navbar = () => {
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    let user = {};

    try {
        user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
        user = {};
    }

    const displayName =
        user.full_name || user.name || user.username || "Administrator";

    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    return (
        <AppBar
            position="static"
            elevation={0}
            sx={{
                width: "100%",
                bgcolor: "#FFFFFF",
                color: "#172B4D",
                borderBottom: "1px solid #E8EDF4",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.025)"
            }}
        >
            <Toolbar
                sx={{
                    minHeight: { xs: 68, sm: 76 },
                    px: { xs: 2, sm: 3 },
                    gap: { xs: 1, sm: 2 }
                }}
            >
                {/* Page heading & Brand */}
                <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                        component="img"
                        src="/logo.png"
                        alt="ResilientNet Logo"
                        sx={{
                            width: 38,
                            height: 38,
                            borderRadius: "10px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                            objectFit: "cover",
                            display: { xs: "block", md: "none" }
                        }}
                    />
                    <Box>
                        <Typography
                            sx={{
                                fontSize: { xs: 17, sm: 21 },
                                fontWeight: 800,
                                letterSpacing: "-0.5px",
                                color: "#172B4D",
                                lineHeight: 1.4
                            }}
                        >
                            Emergency Dashboard
                        </Typography>

                        <Typography
                            sx={{
                                display: { xs: "none", sm: "block" },
                                fontSize: 12,
                                color: "#64748B",
                                mt: 0.3
                            }}
                        >
                            Monitor incidents and coordinate emergency response
                        </Typography>
                    </Box>
                </Box>

                {/* Notifications */}
                <Tooltip title="Notifications">
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 42,
                            height: 42,
                            border: "1px solid #E2E8F0",
                            borderRadius: "12px",
                            bgcolor: "#FFFFFF",
                            flexShrink: 0,
                            "&:hover": {
                                bgcolor: "#F8FAFC"
                            }
                        }}
                    >
                        <NotificationMenu />
                    </Box>
                </Tooltip>

                <Divider
                    orientation="vertical"
                    flexItem
                    sx={{
                        my: 2,
                        borderColor: "#E2E8F0",
                        display: { xs: "none", sm: "block" }
                    }}
                />

                {/* User profile */}
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.2}
                    sx={{ minWidth: 0 }}
                >
                    <Avatar
                        sx={{
                            width: 39,
                            height: 39,
                            bgcolor: "#DBEAFE",
                            color: "#1D4ED8",
                            fontSize: 14,
                            fontWeight: 800,
                            border: "2px solid #FFFFFF",
                            boxShadow: "0 0 0 1px #BFDBFE"
                        }}
                    >
                        {initials || "A"}
                    </Avatar>

                    <Box
                        sx={{
                            display: { xs: "none", md: "block" },
                            minWidth: 0,
                            maxWidth: 145
                        }}
                    >
                        <Typography
                            noWrap
                            sx={{
                                fontSize: 12,
                                fontWeight: 750,
                                color: "#172B4D"
                            }}
                        >
                            {displayName}
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: 11,
                                color: "#64748B",
                                mt: 0.2
                            }}
                        >
                            Administrator
                        </Typography>
                    </Box>
                </Stack>

                {/* Logout */}
                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleLogout}
                    startIcon={<LogoutRoundedIcon />}
                    sx={{
                        ml: { xs: 0, sm: 0.5 },
                        minWidth: { xs: 40, sm: "auto" },
                        px: { xs: 1, sm: 1.7 },
                        height: 39,
                        borderRadius: "10px",
                        borderColor: "#FECACA",
                        color: "#DC2626",
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "none",
                        "& .MuiButton-startIcon": {
                            mr: { xs: 0, sm: 0.8 },
                            ml: 0
                        },
                        "&:hover": {
                            bgcolor: "#FEF2F2",
                            borderColor: "#F87171"
                        }
                    }}
                >
                    <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                        Logout
                    </Box>
                </Button>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
