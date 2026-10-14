
import { useState, useEffect } from "react";
import { useEmergency } from "../context/EmergencyContext";
import socket from "../services/socket";

import {
    Badge,
    IconButton,
    Menu,
    MenuItem,
    Typography
} from "@mui/material";

import NotificationsIcon from "@mui/icons-material/Notifications";

const NotificationMenu = () => {
    const [anchorEl, setAnchorEl] = useState(null);

    const { notifications, setNotifications } = useEmergency();

    useEffect(() => {
        
const handleNewSOS = (data) => {
    if (!data?.id) return;

    setNotifications((previous) => {
        const exists = previous.some(
            (notification) =>
                String(notification.id) === String(data.id)
        );

        if (exists) return previous;

        return [
            {
                id: data.id,
                title: data.category || "Emergency Alert",
                message: data.message || "A new SOS has been reported."
            },
            ...previous
        ];
    });
};


        socket.on("newSOS", handleNewSOS);

        return () => {
            socket.off("newSOS", handleNewSOS);
        };
    }, [setNotifications]);

    return (
        <>
            <IconButton
                color="inherit"
                onClick={(e) => setAnchorEl(e.currentTarget)}
            >
                <Badge
                    badgeContent={notifications.length}
                    color="error"
                >
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                {notifications.map((notification, index) => (
                    <MenuItem
                        key={notification.id ?? index}
                        onClick={() => {
                            setAnchorEl(null);

                            const card = document.getElementById(
                                `sos-${notification.id}`
                            );

                            if (card) {
                                card.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center"
                                });
                            }
                        }}
                    >
                        <div>
                            <Typography fontWeight="bold">
                                {notification.title}
                            </Typography>

                            <Typography variant="body2">
                                {notification.message}
                            </Typography>
                        </div>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default NotificationMenu;
