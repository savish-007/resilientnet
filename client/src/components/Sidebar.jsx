
import {
    Box,
    Drawer,
    Toolbar,
    Typography,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider
} from "@mui/material";

import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";

const drawerWidth = 250;

const menuItems = [
    { label: "Dashboard", path: "/", icon: <DashboardRoundedIcon /> },
    { label: "SOS Alerts", path: "/sos", icon: <WarningAmberRoundedIcon /> },
    { label: "Resources", path: "/resources", icon: <Inventory2RoundedIcon /> },
    { label: "Volunteers", path: "/volunteers", icon: <GroupsRoundedIcon /> },
    { label: "AI Analysis", path: "/ai", icon: <PsychologyRoundedIcon /> },
    { label: "Reports", path: "/reports", icon: <AssessmentRoundedIcon /> },
    { label: "Resource Requests", path: "/resource-requests", icon: <AssignmentRoundedIcon /> }
];

const Sidebar = () => {
    const currentPath = window.location.pathname;

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                display: { xs: "none", md: "block" },
                "& .MuiDrawer-paper": {
                    width: drawerWidth,
                    boxSizing: "border-box",
                    background: "#111C2E",
                    color: "#E2E8F0",
                    borderRight: "1px solid #243247",
                    px: 1.5
                }
            }}
        >
            <Toolbar sx={{ minHeight: "82px !important", px: "8px !important" }}>
                <Box
                    component="img"
                    src="/logo.png"
                    alt="ResilientNet Logo"
                    sx={{
                        width: 42,
                        height: 42,
                        borderRadius: "12px",
                        mr: 1.5,
                        objectFit: "cover",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
                    }}
                />

                <Box>
                    <Typography
                        sx={{
                            color: "#FFFFFF",
                            fontSize: 19,
                            fontWeight: 800,
                            letterSpacing: "-0.5px"
                        }}
                    >
                        ResilientNet
                    </Typography>
                    <Typography
                        sx={{
                            color: "#94A3B8",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "1.2px"
                        }}
                    >
                        RESPONSE CENTER
                    </Typography>
                </Box>
            </Toolbar>

            <Divider sx={{ borderColor: "#29364A", mb: 2 }} />

            <Typography
                sx={{
                    px: 1.5,
                    mb: 1,
                    color: "#718096",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "1.4px"
                }}
            >
                WORKSPACE
            </Typography>

            <List sx={{ px: 0, py: 0 }}>
                {menuItems.map((item) => {
                    const active =
                        item.path === "/"
                            ? currentPath === "/"
                            : currentPath === item.path;

                                       return (
                        <ListItemButton
                            key={item.label}
                            component="a"
                            href={item.path}
                            selected={active}
                            sx={{
                                minHeight: 47,
                                mb: 0.6,
                                px: 1.5,
                                borderRadius: 2.5,
                                color: active ? "#FFFFFF" : "#AAB8CC",
                                bgcolor: active ? "#263A55" : "transparent",
                                border: active
                                    ? "1px solid #354D6B"
                                    : "1px solid transparent",
                                transition: "all 0.2s",
                                "&.Mui-selected": {
                                    bgcolor: "#263A55",
                                    color: "#FFFFFF"
                                },
                                "&:hover": {
                                    bgcolor: active ? "#263A55" : "#1B2A40",
                                    color: "#FFFFFF"
                                },
                                "& .MuiListItemIcon-root": {
                                    minWidth: 40,
                                    color: active ? "#F87171" : "inherit"
                                }
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{
                                    fontSize: 13,
                                    fontWeight: active ? 700 : 500
                                }}
                            />
                            {active && (
                                <Box
                                    sx={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: "50%",
                                        bgcolor: "#F87171"
                                    }}
                                />
                            )}
                        </ListItemButton>
                    );
                })}
            </List>

            <Box sx={{ flex: 1 }} />

            <Box
                sx={{
                    mb: 2,
                    mx: 0.5,
                    p: 1.8,
                    borderRadius: 3,
                    bgcolor: "#1B2A40",
                    border: "1px solid #2B3C54"
                }}
            >
                <Typography sx={{ color: "#E2E8F0", fontSize: 12, fontWeight: 700 }}>
                    Emergency Response
                </Typography>
                <Typography sx={{ color: "#94A3B8", fontSize: 11, mt: 0.5 }}>
                    Monitor alerts and coordinate resources.
                </Typography>
            </Box>
        </Drawer>
    );
};

export default Sidebar;
