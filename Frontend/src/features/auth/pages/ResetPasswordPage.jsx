import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import imgLogo from "../../../assets/logo.png";
import { AnimatedLogo } from "../components/LogoAnimation";
import { ParticleWave } from "../components/ParticleWave";
import { getUserRole, supabase, updatePassword } from "../../../shared/lib/supabase";
import "../components/LogoAnimation.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapAuthError(message) {
  const lower = (message || "").toLowerCase();
  if (lower.includes("same password"))
    return "New password must be different from the current one.";
  if (lower.includes("weak") || lower.includes("short"))
    return "Password is too weak. Use at least 6 characters.";
  if (lower.includes("session") || lower.includes("expired") || lower.includes("token"))
    return "Reset link has expired. Please request a new one.";
  return message || "Failed to update password. Please try again.";
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M10.29 5.96H2.71C2.11 5.96 1.63 6.44 1.63 7.04V10.83C1.63 11.43 2.11 11.92 2.71 11.92H10.29C10.89 11.92 11.38 11.43 11.38 10.83V7.04C11.38 6.44 10.89 5.96 10.29 5.96Z"
        stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
      <path d="M3.79 5.96V3.79C3.79 3.07 4.08 2.38 4.58 1.88C5.09 1.37 5.78 1.08 6.5 1.08C7.22 1.08 7.91 1.37 8.42 1.88C8.92 2.38 9.21 3.07 9.21 3.79V5.96"
        stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M0.58 4.52C0.53 4.4 0.53 4.27 0.58 4.14C1.02 3.08 1.76 2.17 2.72 1.53C3.68 0.88 4.81 0.54 5.96 0.54C7.11 0.54 8.24 0.88 9.2 1.53C10.16 2.17 10.9 3.08 11.34 4.14C11.39 4.27 11.39 4.4 11.34 4.52C10.9 5.59 10.16 6.5 9.2 7.14C8.24 7.78 7.11 8.12 5.96 8.12C4.81 8.12 3.68 7.78 2.72 7.14C1.76 6.5 1.02 5.59 0.58 4.52Z"
        stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
      <path d="M7.79 4.33C7.79 5.22 7.06 5.96 6.17 5.96C5.27 5.96 4.54 5.22 4.54 4.33C4.54 3.44 5.27 2.71 6.17 2.71C7.06 2.71 7.79 3.44 7.79 4.33Z"
        stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M6.5 1.08L1.63 3.25V6.5C1.63 9.4 3.79 12.13 6.5 12.63C9.21 12.13 11.38 9.4 11.38 6.5V3.25L6.5 1.08Z"
        stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
    </svg>
  );
}

// ─── Dark Input Field ──────────────────────────────────────────────────────────
function FormInput({ label, icon, placeholder, type = "text", value, onChange, rightElement, autoComplete }) {
  return (
    <div className="flex flex-col gap-[6px] w-full group">
      <p className="font-mono text-[9px] text-[#6a7282] tracking-[1.5px] group-focus-within:text-white group-focus-within:font-bold transition-all">
        {label}
      </p>
      <div className="relative border border-white/10 h-[46px] flex items-center px-3 gap-2 transition-all duration-200
        group-hover:border-white/25
        group-focus-within:border-white/35
        group-focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
        <span className="shrink-0 transition-transform duration-200 group-focus-within:scale-110">{icon}</span>
        <input
          type={type}
          value={value}
          autoComplete={autoComplete ?? "off"}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-bare flex-1 bg-transparent outline-none focus:outline-none font-mono text-[11px] text-white tracking-[0.55px] placeholder:text-white/20"
        />
        {rightElement}
      </div>
    </div>
  );
}

// ─── Reset Password Page ──────────────────────────────────────────────────────
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState(false);
  const [sessionReady,    setSessionReady]    = useState(false);
  const [checking,        setChecking]        = useState(true);

  const isComplete = password.trim().length > 0 && confirmPassword.trim().length > 0;

  // Listen for the PASSWORD_RECOVERY event — Supabase fires this
  // when the user lands on this page via the magic-link email.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
        setChecking(false);
      }
    });

    // Also check if there's already a session (user might have refreshed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) { setError("Both fields are required."); return; }
    if (password !== confirmPassword)  { setError("Passwords do not match."); return; }
    if (password.length < 6)           { setError("Password must be at least 6 characters."); return; }

    setLoading(true); setError("");
    const { error: err } = await updatePassword(password);
    setLoading(false);

    if (err) { setError(mapAuthError(err.message)); return; }
    setSuccess(true);

    // Auto-redirect to home after 3 seconds
    setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const role = session?.user?.id ? await getUserRole(session.user.id) : null;
      navigate((role ?? "").toUpperCase() === "ADMIN" ? "/admin" : "/home", { replace: true });
    }, 3000);
  };

  return (
    <div className="bg-black h-screen flex flex-col font-mono overflow-hidden">
      {/* Particle Background */}
      <div className="absolute inset-0 z-0" aria-hidden="true"
        style={{ background: "radial-gradient(ellipse at 50% 60%, transparent 0%, rgba(0,0,0,0.45) 100%)" }}>
        <ParticleWave color="#ffffff" />
      </div>

      {/* Header */}
      <header className="relative z-10 h-[52px] shrink-0 bg-black/80 backdrop-blur-sm border-b border-white/[0.08] flex items-center justify-between px-4">
        <img src={imgLogo} alt="Uni-Lift" className="logo-header-glow h-[30px] w-[134px] object-contain object-left" />
        <span className="font-mono text-[10px] text-[#6a7282] tracking-[0.8px]">KEY RECOVERY PROTOCOL</span>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center py-6 overflow-y-auto">
        <div className="w-[560px] flex flex-col gap-5">

          {/* Card */}
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="w-full bg-black/70 backdrop-blur-md border border-white/10"
            style={{
              overflow: "clip",
              transformOrigin: "center",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 48px rgba(0,0,0,0.6)",
            }}
          >
            {/* Title */}
            <div className="px-10 pt-10 pb-6 flex flex-col items-center text-center">
              <h1 className="font-mono text-[28px] text-white tracking-[1px] font-bold">
                {success ? "KEY UPDATED" : "SET NEW ACCESS KEY"}
              </h1>
              <p className="font-mono text-[10px] text-white/40 tracking-[4px] mt-2 max-w-[80%] leading-relaxed">
                {success ? "Access Restored Successfully" : "Enter Your New Credentials"}
              </p>
            </div>

            <div className="h-px bg-white/8 w-full" />

            {/* Form Content */}
            <div className="flex flex-col gap-4 pt-7 px-10 pb-4">
              {checking ? (
                /* Loading / verifying token */
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span className="font-mono text-[10px] text-white/40 tracking-[0.8px]">VERIFYING RESET TOKEN...</span>
                </div>
              ) : !sessionReady ? (
                /* Invalid / expired token */
                <div className="flex flex-col gap-4">
                  <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 flex flex-col gap-1">
                    <span className="font-mono text-[10px] text-red-400 tracking-[0.5px] font-bold">
                      INVALID OR EXPIRED TOKEN
                    </span>
                    <span className="font-mono text-[9px] text-red-400/70 tracking-[0.4px] leading-relaxed">
                      This reset link is no longer valid. Please request a new password reset from the login page.
                    </span>
                  </div>
                  <button
                    onClick={() => navigate("/")}
                    className="h-[52px] w-full flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M9.38 11.25L5.63 7.5L9.38 3.75" stroke="rgba(255,255,255,0.5)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
                    </svg>
                    <span className="font-mono text-[11px] text-white/50 tracking-[1.1px]">Return to Login</span>
                  </button>
                </div>
              ) : success ? (
                /* Success */
                <div className="flex flex-col gap-4">
                  <div className="border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 flex flex-col gap-1">
                    <span className="font-mono text-[10px] text-emerald-400 tracking-[0.5px] font-bold">
                      ACCESS KEY UPDATED SUCCESSFULLY
                    </span>
                    <span className="font-mono text-[9px] text-emerald-400/70 tracking-[0.4px] leading-relaxed">
                      Your password has been changed. You will be redirected to the dashboard momentarily.
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      const { data: { session } } = await supabase.auth.getSession();
                      const role = session?.user?.id ? await getUserRole(session.user.id) : null;
                      navigate((role ?? "").toUpperCase() === "ADMIN" ? "/admin" : "/home", { replace: true });
                    }}
                    className="h-[52px] w-full flex items-center justify-center gap-2 border border-white bg-white cursor-pointer hover:bg-white/90 active:scale-[0.99] transition-all duration-300"
                    style={{ boxShadow: "0 0 16px rgba(255,255,255,0.38), 0 0 32px rgba(255,255,255,0.12)" }}
                  >
                    <span className="font-mono text-[11px] text-black tracking-[1.1px]">Continue to Dashboard</span>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M5.63 11.25L9.38 7.5L5.63 3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
                    </svg>
                  </button>
                </div>
              ) : (
                /* Password entry form */
                <>
                  <p className="font-mono text-[9px] text-white/40 tracking-[0.5px] leading-relaxed">
                    ENTER YOUR NEW ACCESS KEY BELOW. IT MUST BE AT LEAST 6 CHARACTERS AND MUST NOT MATCH YOUR PREVIOUS KEY.
                  </p>
                  <FormInput label="NEW ACCESS KEY" icon={<LockIcon />} placeholder="••••••••••••"
                    type={showPassword ? "text" : "password"} autoComplete="new-password"
                    value={password} onChange={setPassword}
                    rightElement={
                      <button onClick={() => setShowPassword(!showPassword)} className="shrink-0 text-[#6a7282] hover:text-white transition-colors">
                        <EyeIcon />
                      </button>
                    }
                  />
                  <FormInput label="CONFIRM ACCESS KEY" icon={<LockIcon />} placeholder="••••••••"
                    type={showPassword ? "text" : "password"} autoComplete="new-password"
                    value={confirmPassword} onChange={setConfirmPassword}
                  />

                  {error && (
                    <div className="border border-red-500/40 bg-red-500/10 px-3 py-2">
                      <span className="font-mono text-[9px] text-red-400 tracking-[0.5px]">{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleUpdatePassword}
                    disabled={loading || !isComplete}
                    className={`h-[52px] w-full flex items-center justify-center gap-2 border transition-all duration-300 ${
                      loading
                        ? "bg-white/8 border-white/10 cursor-not-allowed"
                        : isComplete
                          ? "bg-white border-white cursor-pointer hover:bg-white/90 active:scale-[0.99]"
                          : "bg-white/5 border-white/10 cursor-not-allowed"
                    }`}
                    style={
                      isComplete && !loading
                        ? { boxShadow: "0 0 16px rgba(255,255,255,0.38), 0 0 32px rgba(255,255,255,0.12)" }
                        : {}
                    }
                  >
                    <span className={`font-mono text-[11px] tracking-[1.1px] transition-colors ${
                      isComplete && !loading ? "text-black" : "text-white/25"
                    }`}>
                      {loading ? "UPDATING..." : "Update Access Key"}
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Status Bar */}
            <div className="h-[29px] bg-white/[0.03] border-t border-white/8 flex items-center px-6 justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <span className="font-mono text-[8px] text-[#6a7282] tracking-[0.8px]">ENCRYPTION: AES-256</span>
                <span className="font-mono text-[8px] text-[#6a7282] tracking-[0.8px]">SSL: SECURE</span>
              </div>
              <span className="font-mono text-[8px] text-white/20 tracking-[0.8px]">NODE ID: P01 • • •</span>
            </div>
          </motion.div>

          {/* Wordmark */}
          <div className="flex justify-center">
            <AnimatedLogo size="42px" opacity={0.6} textColor="#ffffff" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 h-[40px] shrink-0 bg-black/80 backdrop-blur-sm border-t border-white/[0.08] grid grid-cols-3 items-center px-6">
        <div className="flex items-center gap-2">
          <ShieldIcon />
          <span className="font-mono text-[10px] text-[#6a7282]">Protected by University Authentication Protocol</span>
        </div>
        <div className="flex items-center justify-center gap-5">
          {["TERMS", "PRIVACY", "SUPPORT"].map((item) => (
            <button key={item} className="font-mono text-[10px] text-[#6a7282] tracking-[0.5px] hover:text-white transition-colors">
              {item}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <span className="font-mono text-[10px] text-white/20 tracking-[0.5px]">© 2026 UNI-LIFT TERMINAL V1.0.4</span>
        </div>
      </footer>
    </div>
  );
}
