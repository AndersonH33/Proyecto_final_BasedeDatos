
import { useState } from "react";
import { Droplets, User, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import logoAH from "../assets/logo-ah.png";
import "./Login.css";

function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!usuario.trim()) {
      setError("Debes ingresar tu usuario.");
      return;
    }

    if (!contrasena.trim()) {
      setError("Debes ingresar tu contraseña.");
      return;
    }

    setError(
      "El inicio de sesión estará disponible cuando conectemos el backend."
    );
  };

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="login-brand-panel">
            <div className="login-logo">
             <img
            src={logoAH}
            alt="AH Cuentas por Cobrar"
            className="login-logo-img"
            />
        </div>

          <h1>AH Cuentas por Cobrar</h1>
          <p>
            Sistema de administración y control
            de cuentas por cobrar
          </p>

          <div className="login-brand-footer">
            <span>Gestión financiera</span>
            <span>Seguridad y control</span>
            <span>Administración empresarial</span>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-form-header">
            <h2>Bienvenido</h2>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            <div className="login-field">
              <label htmlFor="usuario">Usuario</label>

              <div className="login-input-wrapper">
                <User size={19} />

                <input
                  id="usuario"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="contrasena">Contraseña</label>

              <div className="login-input-wrapper">
                <Lock size={19} />

                <input
                  id="contrasena"
                  type={mostrarContrasena ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setMostrarContrasena(!mostrarContrasena)
                  }
                  aria-label={
                    mostrarContrasena
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {mostrarContrasena ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="login-submit">
              <LogIn size={19} />
              Iniciar sesión
            </button>

          </form>

          <div className="login-help">
            <p>
              ¿Tienes problemas para acceder?
            </p>
            <span>
              Consulta con el administrador del sistema.
            </span>
          </div>
        </div>

      </div>

      <div className="login-copyright">
        © {new Date().getFullYear()} AH Cuentas por Cobrar
      </div>
    </div>
  );
}

export default Login;
