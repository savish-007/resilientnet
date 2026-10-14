
import React from "react";

const DashboardLayout = ({ children }) => {
    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                width: "100%",
                background: "#F4F7FB",
                color: "#172B4D",
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                overflowX: "hidden"
            }}
        >
            {children}
        </div>
    );
};

export default DashboardLayout;
