import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import PrivateRoute from "./components/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import EditorPage from "./pages/EditorPage";
import MyArchitecturesPage from "./pages/MyArchitecturesPage";
import SharedArchitecturePage from "./pages/SharedArchitecturePage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/a/:id" element={<SharedArchitecturePage />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<EditorPage />} />
            <Route
              path="/my-architectures"
              element={<MyArchitecturesPage />}
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
