
import { Construction } from "lucide-react";

function ModulePlaceholder({ title, description }) {
  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="dashboard-panel module-placeholder">
        <Construction size={42} />

        <h3>Módulo en desarrollo</h3>

        <p>
          Próximamente podrás consultar y administrar
          la información de {title.toLowerCase()}.
        </p>
      </div>
    </div>
  );
}

export default ModulePlaceholder;
