import { Routes, Route, Navigate } from "react-router-dom";
import { PanelLayout } from "../layouts/PanelLayout";
import { PanelNoNavLayout } from "../layouts/PanelNoNavLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import Dashboard from "../pages/panel/Dashboard";
import Settings from "../pages/panel/Settings";
import CameraList from "../pages/cameras/CameraList";
import CameraView from "../pages/cameras/CameraView";
import CameraNew from "../pages/cameras/CameraNew";
import CameraEdit from "../pages/cameras/CameraEdit";
import PeopleList from "../pages/people/PeopleList";
import PersonDetails from "../pages/people/PersonDetails";
import PersonNew from "../pages/people/PersonNew";
import PersonEdit from "../pages/people/PersonEdit";
import NewVisit from "../pages/people/NewVisit";
import NotificationList from "../pages/notifications/NotificationList";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        element={
          <ProtectedRoute>
            <PanelNoNavLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/panel" element={<Dashboard />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <PanelLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/cameras" element={<CameraList />} />
        <Route path="/cameras/new" element={<CameraNew />} />
        <Route path="/cameras/:id" element={<CameraView />} />
        <Route path="/cameras/:id/edit" element={<CameraEdit />} />
        <Route path="/people" element={<PeopleList />} />
        <Route path="/people/new" element={<PersonNew />} />
        <Route path="/people/:id" element={<PersonDetails />} />
        <Route path="/people/:id/edit" element={<PersonEdit />} />
        <Route path="/people/:visitorId/new-visit" element={<NewVisit />} />
        <Route path="/notifications" element={<NotificationList />} />
        <Route path="/panel/settings" element={<Settings />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
