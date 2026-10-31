
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Facturas from "./pages/Facturas";
import Pagos from "./pages/Pagos";
import CuentasCobrar from "./pages/CuentasCobrar";
import NotasCredito from "./pages/NotasCredito";
import NotasAbono from "./pages/NotasAbono";
import Movimientos from "./pages/Movimientos";
import Recibos from "./pages/Recibos";
import Reportes from "./pages/Reportes";
import Usuarios from "./pages/Usuarios";
import Auditoria from "./pages/Auditoria";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          <Route
            index
            element={<Navigate to="/dashboard" replace />}
          />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="facturas" element={<Facturas />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="cuentas-cobrar" element={<CuentasCobrar />} />
          <Route path="notas-credito" element={<NotasCredito />} />
          <Route path="notas-abono" element={<NotasAbono />} />
          <Route path="movimientos" element={<Movimientos />} />
          <Route path="recibos" element={<Recibos />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="auditoria" element={<Auditoria />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
