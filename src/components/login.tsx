"use client";
import { useState } from "react";
import Image from "next/image";
import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";
const authClient = createAuthClient();
export function Login({
  configured,
  email,
}: {
  configured: boolean;
  email: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error)
        setMessage(
          result.error.status === 403
            ? "Acceso rechazado. Revisa la dirección de la aplicación y la configuración de acceso."
            : result.error.status === 429
              ? "Demasiados intentos. Espera un minuto antes de volver a ingresar."
              : result.error.status === 401
                ? "Contraseña incorrecta o cuenta aún sin configurar."
                : "No fue posible ingresar. Intenta de nuevo.",
        );
      else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setMessage("No fue posible conectar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-card">
        <Image
          src="/terra-logo.png"
          alt="Terra"
          width={110}
          height={122}
          unoptimized
          className="login-logo"
        />
        <span className="eyebrow">ACCESO PRIVADO</span>
        <h1>Bienvenido, Nelson</h1>
        <p>
          Ingresa con tu contraseña para administrar presupuestos y exportar
          PDF.
        </p>
        {!configured ? (
          <div className="notice">
            El acceso está pendiente de configuración. Aún falta conectar la
            base y el acceso privado de Terra.
          </div>
        ) : (
          <form onSubmit={login}>
            <label>
              Contraseña
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button className="primary" disabled={busy}>
              {busy ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
        )}
        {message && (
          <div className="notice" role="status">
            {message}
          </div>
        )}
        <p className="muted">Terra · Servicios & Proyectos Integrales</p>
      </section>
    </main>
  );
}
