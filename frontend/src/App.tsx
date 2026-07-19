import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ChangePassword from './pages/ChangePassword';
import Inspection from './pages/Inspection';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/inspection/:inspectionId" element={<Inspection />} />
      </Routes>
    </BrowserRouter>
  );
}
