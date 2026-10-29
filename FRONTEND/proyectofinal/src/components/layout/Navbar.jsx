
import { Bell, Search, UserCircle } from "lucide-react";

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-title">
        <h1>Sistema de Cuentas por Cobrar</h1>
        <p>Panel de administración empresarial</p>
      </div>

      <div className="navbar-actions">
        <button
          className="icon-button"
          title="Búsqueda disponible próximamente"
          aria-label="Buscar"
          disabled
        >
          <Search size={20} />
        </button>

        <button
          className="icon-button"
          title="Notificaciones disponibles próximamente"
          aria-label="Notificaciones"
          disabled
        >
          <Bell size={20} />
        </button>

        <div className="user-profile">
          <UserCircle size={32} />

          <div>
            <strong>Modo desarrollo</strong>
            <span>Sin sesión iniciada</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
