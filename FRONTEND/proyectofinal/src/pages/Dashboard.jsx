
import {
  Users,
  FileText,
  Wallet,
  AlertTriangle,
} from "lucide-react";

const indicadores = [
  {
    titulo: "Clientes de prueba",
    valor: "30",
    icono: Users,
    color: "blue",
  },
  {
    titulo: "Facturas preparadas",
    valor: "60",
    icono: FileText,
    color: "purple",
  },
  {
    titulo: "Pagos preparados",
    valor: "30",
    icono: Wallet,
    color: "green",
  },
  {
    titulo: "Facturas vencidas",
    valor: "Pendiente",
    icono: AlertTriangle,
    color: "orange",
  },
];

function Dashboard() {
  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Resumen general de cuentas por cobrar</p>
        </div>
      </div>

      <div className="demo-notice">
        Vista de desarrollo. Los indicadores todavía
        no están conectados con Oracle.
      </div>

      <div className="stats-grid">
        {indicadores.map((item) => {
          const Icon = item.icono;

          return (
            <div className="stat-card" key={item.titulo}>
              <div className="stat-info">
                <span>{item.titulo}</span>
                <h3>{item.valor}</h3>
              </div>

              <div className={`stat-icon ${item.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-panel">
        <h3>Bienvenido AH Cuentas por Cobrar</h3>

        <p>
          Sistema empresarial para administrar clientes,
          facturas, pagos y cuentas por cobrar.
        </p>

        <p>
          Utiliza el menú lateral para acceder a
          los diferentes módulos del sistema.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
