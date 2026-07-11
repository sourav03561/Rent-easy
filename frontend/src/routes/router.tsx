import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { AuthPage } from "../pages/AuthPage";
import { BrowsePage } from "../pages/BrowsePage";
import { DashboardPage } from "../pages/DashboardPage";
import { ListingDetailPage } from "../pages/ListingDetailPage";
import { OwnerDashboardPage } from "../pages/OwnerDashboardPage";
import { SettingsPage } from "../pages/SettingsPage";
import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <BrowsePage /> },
      { path: "auth", element: <AuthPage /> },
      { path: "listings/:id", element: <ListingDetailPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <DashboardPage /> },
          { path: "settings", element: <SettingsPage /> }
        ]
      },
      {
        element: <ProtectedRoute roles={["OWNER", "ADMIN"]} />,
        children: [{ path: "owner", element: <OwnerDashboardPage /> }]
      },
      {
        element: <ProtectedRoute roles={["ADMIN"]} />,
        children: [{ path: "admin", element: <AdminDashboardPage /> }]
      }
    ]
  }
]);
