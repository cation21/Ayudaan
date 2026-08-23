import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Home } from "./pages/Home/Home";
import { IndividualProfile } from "./pages/Profile/IndividualProfile";
import { OrgProfile } from "./pages/Profile/OrgProfile";
import { Admin } from "./pages/Admin/Admin";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile/:userId" element={<IndividualProfile />} />
          <Route path="/organizations/:orgId" element={<OrgProfile />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
