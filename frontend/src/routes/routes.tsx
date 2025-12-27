import React from "react";
import { Routes, Route, } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import OTPVerification from "../pages/auth/OTPVerification";
import Currency from "../pages/auth/Currency";
import UserPortal from "../pages/protected/UserPortal";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store/store";
import { refreshAccessToken } from "../config/api.config";
import SpaceInvitation from "../pages/protected/SpaceInvitation";

function AppContainer() {

    function ProtectedRoute({ children }: { children: React.ReactNode }) {
        const { isAuthenticated } = useSelector((state: RootState) => state.auth);
        console.log(isAuthenticated);
        if (!isAuthenticated) { // not logged in and token is required
            refreshAccessToken()
            .then((res) => {
                console.log(">>>> refreshed")
            });
        }
        return <>{children}</>;
    }

    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<OTPVerification />} />
            <Route path="/register/currency" element={<Currency />} />
            <Route path="/invite" element={<SpaceInvitation />} />
            <Route
                path="/user-portal/:spacetype/:spaceid/:view"
                element={
                    <ProtectedRoute >
                        <UserPortal />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

export default AppContainer;
