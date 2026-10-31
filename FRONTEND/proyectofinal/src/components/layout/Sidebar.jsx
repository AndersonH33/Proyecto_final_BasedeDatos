import logoAH from "../../assets/logo-ah.png";
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  FileText,
  Wallet,
  Receipt,
  FileMinus,
  FilePlus,
  ArrowLeftRight,
  ScrollText,
  BarChart3,
  ShieldCheck,
  History,
  Droplets,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Clientes", path: "/clientes", icon: Users },
  { name: "Facturas", path: "/facturas", icon: FileText },
  { name: "Pagos", path: "/pagos", icon: Wallet },
  { name: "Cuentas por cobrar", path: "/cuentas-cobrar", icon: Receipt },
  { name: "Notas de crédito", path: "/notas-credito", icon: FileMinus },
  { name: "Notas de abono", path: "/notas-abono", icon: FilePlus },
  { name: "Movimientos", path: "/movimientos", icon: ArrowLeftRight },
  { name: "Recibos autorizados", path: "/recibos", icon: ScrollText },
  { name: "Reportes", path: "/reportes", icon: BarChart3 },
  { name: "Usuarios", path: "/usuarios", icon: ShieldCheck },
  { name: "Auditoría", path: "/auditoria", icon: History },
];

function Sidebar() {
  return (
    <aside className="sidebar">
  <div className="sidebar-brand">
    <div className="brand-icon">
      <img
        src={logoAH}
        alt="AH Cuentas por Cobrar"
        className="sidebar-logo-img"
      />
    </div>

        <div>
          <h2>AH Cuentas por Cobrar</h2>
          <span>Sistema de gestión</span>
        </div>
      </div>

      <div className="sidebar-section-title">
        MENÚ PRINCIPAL
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span>AH Cuentas por Cobrar</span>
        <small>Versión 1.0.0</small>
      </div>
    </aside>
  );
}

export default Sidebar;
