/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import imgLogo from "../../../assets/logo.png";
import { AnimatedLogo } from "../components/LogoAnimation";
import { ParticleWave } from "../components/ParticleWave";
import { getUserRole, signIn, signUp, requestPasswordReset } from "../../../shared/lib/supabase";
import "../components/LogoAnimation.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normalizeEmail = (email) => email.trim().toLowerCase();
const isValidEmail   = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function mapAuthError(message) {
  const lower = (message || "").toLowerCase();
  if (lower.includes("invalid") && lower.includes("email"))
    return "Invalid email format. Use a valid address like name@cit.edu.";
  if (lower.includes("rate limit") || lower.includes("too many requests"))
    return "Too many attempts. Please wait a minute, then try again.";
  if (lower.includes("invalid login credentials"))
    return "Invalid email or password.";
  return message || "Authentication failed. Please try again.";
}

function getPasswordStrength(password) {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  if (!password) return { score: 0, label: "WAITING", color: "bg-white/10", text: "text-white/25" };
  if (score <= 2) return { score, label: "WEAK", color: "bg-[#ef4444]", text: "text-[#fca5a5]" };
  if (score <= 4) return { score, label: "GOOD", color: "bg-[#f59e0b]", text: "text-[#fbbf24]" };
  return { score, label: "STRONG", color: "bg-[#10b981]", text: "text-[#6ee7b7]" };
}

function PasswordStrengthMeter({ password }) {
  const strength = getPasswordStrength(password);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] text-[#6a7282] tracking-[0.8px]">KEY STRENGTH</span>
        <span className={`font-mono text-[8px] tracking-[0.8px] ${strength.text}`}>{strength.label}</span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-[3px] ${level <= strength.score ? strength.color : "bg-white/10"}`}
          />
        ))}
      </div>
      <p className="font-mono text-[8px] text-white/30 leading-4">
        Use 8+ characters with upper/lowercase letters, a number, and a symbol.
      </p>
    </div>
  );
}

// ─── Icons (all white/grey strokes for dark mode) ─────────────────────────────
function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M6.5 1.08L1.63 3.25V6.5C1.63 9.4 3.79 12.13 6.5 12.63C9.21 12.13 11.38 9.4 11.38 6.5V3.25L6.5 1.08Z"
        stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M10.83 2.17H2.17C1.57 2.17 1.08 2.65 1.08 3.25V9.75C1.08 10.35 1.57 10.83 2.17 10.83H10.83C11.43 10.83 11.92 10.35 11.92 9.75V3.25C11.92 2.65 11.43 2.17 10.83 2.17Z"
        stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
      <path d="M11.92 3.79L7.06 6.88C6.89 6.98 6.7 7.04 6.5 7.04C6.3 7.04 6.11 6.98 5.94 6.88L1.08 3.79"
        stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
    </svg>
  );
}

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

function UserIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M10.83 11.38V10.29C10.83 9.74 10.61 9.22 10.22 8.83C9.83 8.44 9.31 8.21 8.75 8.21H4.25C3.69 8.21 3.17 8.44 2.78 8.83C2.39 9.22 2.17 9.74 2.17 10.29V11.38"
        stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
      <path d="M6.5 6.04C7.67 6.04 8.63 5.08 8.63 3.92C8.63 2.75 7.67 1.79 6.5 1.79C5.33 1.79 4.38 2.75 4.38 3.92C4.38 5.08 5.33 6.04 6.5 6.04Z"
        stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
    </svg>
  );
}

function IdCardIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M11.38 2.17H1.63C1.03 2.17 0.54 2.65 0.54 3.25V9.75C0.54 10.35 1.03 10.83 1.63 10.83H11.38C11.97 10.83 12.46 10.35 12.46 9.75V3.25C12.46 2.65 11.97 2.17 11.38 2.17Z"
        stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
      <path d="M4.33 7.58V6.5C4.33 6.21 4.44 5.94 4.65 5.73C4.85 5.53 5.12 5.42 5.42 5.42H7.58C7.88 5.42 8.15 5.53 8.35 5.73C8.56 5.94 8.67 6.21 8.67 6.5V7.58"
        stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
      <path d="M6.5 5.42C7.1 5.42 7.58 4.93 7.58 4.33C7.58 3.74 7.1 3.25 6.5 3.25C5.9 3.25 5.42 3.74 5.42 4.33C5.42 4.93 5.9 5.42 6.5 5.42Z"
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
      {/*
        ✅ FIX — "box inside a box" removed:
        The parent div owns the single visible border. No background is set here.
        The <input> itself is bg-transparent + outline-none via .input-bare, so
        the browser paints nothing — the text floats directly on the card surface.
      */}
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

const getAuthCardTitle = (tab) => {
  if (tab === "reset") return "RESET ACCESS KEY";
  if (tab === "login") return "TERMINAL LOGIN";
  return "REGISTER ACCOUNT";
};

const getAuthCardSubtitle = (tab) => {
  if (tab === "reset") return "Key Recovery Protocol";
  if (tab === "login") return "Secure Gateway for Mobility";
  return "Authorized Personnel Entry Only";
};

const getPrimaryButtonClass = (loading, isComplete) => {
  if (loading) return "bg-white/8 border-white/10 cursor-not-allowed";
  if (isComplete) return "bg-white border-white cursor-pointer hover:bg-white/90 active:scale-[0.99]";
  return "bg-white/5 border-white/10 cursor-not-allowed";
};

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ onSwitchToSignup, onSwitchToReset }) {
  const navigate = useNavigate();
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stayActive,   setStayActive]   = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  // Unlock the Sign In button only when both fields have content
  const isComplete = email.trim().length > 0 && password.trim().length > 0;
  const buttonClass = getPrimaryButtonClass(loading, isComplete);

  const handleSignIn = async () => {
    const emailValue = normalizeEmail(email);
    if (!emailValue || !password)      { setError("Email and password are required."); return; }
    if (!isValidEmail(emailValue))     { setError("Invalid email format. Use a valid address like name@cit.edu."); return; }
    setLoading(true); setError("");
    const { data, error: err } = await signIn(emailValue, password, stayActive);
    setLoading(false);
    if (err)         { setError(mapAuthError(err.message)); return; }
    if (data?.user)  {
      const role = await getUserRole(data.user.id);
      if ((role ?? "").toUpperCase() === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/home");
      }
    }
  };

  return (
    <motion.form
      key="login"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "linear" }}
      className="flex flex-col gap-4 pt-7 px-10 pb-4"
      onSubmit={(event) => {
        event.preventDefault();
        handleSignIn();
      }}
    >
      <FormInput label="TERMINAL ID / EMAIL"  icon={<MailIcon />} placeholder="S.JOBS@UNIVERSITY.EDU"
        type="email" autoComplete="off" value={email} onChange={setEmail} />
      <FormInput label="ACCESS KEY / PASSWORD" icon={<LockIcon />} placeholder="••••••••••••"
        type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={setPassword}
        rightElement={
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 text-[#6a7282] hover:text-white transition-colors">
            <EyeIcon />
          </button>
        }
      />

      {/* Remember / Reset */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <button
            type="button"
            aria-pressed={stayActive}
            className={`size-[14px] border flex items-center justify-center cursor-pointer transition-colors ${
              stayActive ? "bg-white border-white" : "bg-transparent border-white/30 hover:border-white/60"
            }`}
            onClick={() => setStayActive(!stayActive)}
          >
            {stayActive && (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="black" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className="font-mono text-[9px] text-[#6a7282] tracking-[0.45px]">STAY ACTIVE</span>
        </label>
        <button type="button" onClick={onSwitchToReset} className="font-mono text-[9px] text-[#6a7282] tracking-[0.45px] hover:text-white transition-colors underline">
          RESET KEY?
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-3 py-2">
          <span className="font-mono text-[9px] text-red-400 tracking-[0.5px]">{error}</span>
        </div>
      )}

      {/* Sign In Button */}
      <button
        type="submit"
        onClick={handleSignIn}
        disabled={loading || !isComplete}
        className={`h-[52px] w-full flex items-center justify-center gap-2 border transition-all duration-300 ${buttonClass}`}
        style={
          isComplete && !loading
            ? { boxShadow: "0 0 16px rgba(255,255,255,0.38), 0 0 32px rgba(255,255,255,0.12)" }
            : {}
        }
      >
        <span className={`font-mono text-[11px] tracking-[1.1px] transition-colors ${
          isComplete && !loading ? "text-black" : "text-white/25"
        }`}>
          {loading ? "AUTHENTICATING..." : "Sign In"}
        </span>
        {!loading && (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path
              d="M5.63 11.25L9.38 7.5L5.63 3.75"
              stroke={isComplete ? "black" : "rgba(255,255,255,0.25)"}
              strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25"
            />
          </svg>
        )}
      </button>

      <div className="flex items-center justify-center gap-1">
        <span className="font-mono text-[9px] text-[#6a7282] tracking-[0.45px]">NEW USER?</span>
        <button type="button" onClick={onSwitchToSignup} className="font-mono text-[9px] text-white tracking-[0.45px] underline hover:text-white/70 transition-colors ml-1">
          CREATE ACCOUNT
        </button>
      </div>
    </motion.form>
  );
}

// ─── Reset Password Form (request email) ──────────────────────────────────────
function ResetPasswordForm({ onSwitchToLogin }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [sent,    setSent]    = useState(false);

  const isComplete = email.trim().length > 0;
  const buttonClass = getPrimaryButtonClass(loading, isComplete);

  const handleReset = async () => {
    const emailValue = normalizeEmail(email);
    if (!emailValue)              { setError("Email is required."); return; }
    if (!isValidEmail(emailValue)){ setError("Invalid email format. Use a valid address like name@cit.edu."); return; }
    setLoading(true); setError("");
    const { error: err } = await requestPasswordReset(emailValue);
    setLoading(false);
    if (err) { setError(mapAuthError(err.message)); return; }
    setSent(true);
  };

  return (
    <motion.div
      key="reset"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "linear" }}
      className="flex flex-col gap-4 pt-7 px-10 pb-4"
    >
      {sent ? (
        /* ── Success state ─────────────────────────────────────────── */
        <>
          <div className="border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 flex flex-col gap-1">
            <span className="font-mono text-[10px] text-emerald-400 tracking-[0.5px] font-bold">
              RESET LINK DISPATCHED
            </span>
            <span className="font-mono text-[9px] text-emerald-400/70 tracking-[0.4px] leading-relaxed">
              A password reset link has been sent to <span className="text-emerald-300">{normalizeEmail(email)}</span>. Check your inbox (and spam folder) and follow the link to set a new access key.
            </span>
          </div>
          <button
            onClick={onSwitchToLogin}
            className="h-[52px] w-full flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M9.38 11.25L5.63 7.5L9.38 3.75" stroke="rgba(255,255,255,0.5)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
            </svg>
            <span className="font-mono text-[11px] text-white/50 tracking-[1.1px]">Return to Login</span>
          </button>
        </>
      ) : (
        /* ── Email entry state ─────────────────────────────────────── */
        <>
          <p className="font-mono text-[9px] text-white/40 tracking-[0.5px] leading-relaxed">
            ENTER THE EMAIL ADDRESS ASSOCIATED WITH YOUR ACCOUNT. A SECURE RESET LINK WILL BE DISPATCHED TO YOUR TERMINAL.
          </p>
          <FormInput label="TERMINAL ID / EMAIL" icon={<MailIcon />} placeholder="S.JOBS@UNIVERSITY.EDU"
            type="email" autoComplete="off" value={email} onChange={setEmail} />

          {error && (
            <div className="border border-red-500/40 bg-red-500/10 px-3 py-2">
              <span className="font-mono text-[9px] text-red-400 tracking-[0.5px]">{error}</span>
            </div>
          )}

          <button
            onClick={handleReset}
            disabled={loading || !isComplete}
            className={`h-[52px] w-full flex items-center justify-center gap-2 border transition-all duration-300 ${buttonClass}`}
            style={
              isComplete && !loading
                ? { boxShadow: "0 0 16px rgba(255,255,255,0.38), 0 0 32px rgba(255,255,255,0.12)" }
                : {}
            }
          >
            <span className={`font-mono text-[11px] tracking-[1.1px] transition-colors ${
              isComplete && !loading ? "text-black" : "text-white/25"
            }`}>
              {loading ? "DISPATCHING..." : "Send Reset Link"}
            </span>
          </button>

          <div className="flex items-center justify-center gap-1">
            <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
              <path d="M9.38 11.25L5.63 7.5L9.38 3.75" stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
            </svg>
            <button onClick={onSwitchToLogin} className="font-mono text-[9px] text-[#6a7282] tracking-[0.45px] underline hover:text-white transition-colors">
              BACK TO LOGIN
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Register Form ────────────────────────────────────────────────────────────
function RegisterForm({ onSwitchToLogin }) {
  const navigate = useNavigate();
  const [fullName,        setFullName]        = useState("");
  const [email,           setEmail]           = useState("");
  const [studentId,       setStudentId]       = useState("");
  const [password,        setPassword]        = useState("");
  const [verifyPassword,  setVerifyPassword]  = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [agreedTerms,     setAgreedTerms]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState("");

  // All text fields must have content AND terms agreed to unlock the button
  const isComplete =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    studentId.trim().length > 0 &&
    password.trim().length > 0 &&
    verifyPassword.trim().length > 0 &&
    agreedTerms;

  const handleRegister = async () => {
    const emailValue = normalizeEmail(email);
    if (!agreedTerms)                          return;
    if (password !== verifyPassword)           { setError("Passwords do not match."); return; }
    if (!fullName || !emailValue || !studentId || !password) { setError("All fields are required."); return; }
    if (!isValidEmail(emailValue))             { setError("Invalid email format. Use a valid address like name@cit.edu."); return; }
    setLoading(true); setError(""); setSuccess("");
    const { data, error: err } = await signUp(emailValue, password, fullName.trim(), studentId.trim());
    if (err)        { setLoading(false); setError(mapAuthError(err.message)); return; }
    if (!data?.user){ setLoading(false); setError("Registration failed. Please try again."); return; }
    const { data: loginData, error: loginErr } = await signIn(emailValue, password);
    setLoading(false);
    if (loginErr) {
      const message = mapAuthError(loginErr.message || "Authentication failed.");
      if (/confirm|verification|verify/i.test(message)) {
        setSuccess("Account created. Check your email to confirm, then sign in.");
        return;
      }
      setError(message);
      return;
    }
    if (loginData?.user) {
      const role = await getUserRole(loginData.user.id);
      if ((role ?? "").toUpperCase() === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/home");
      }
    }
  };

  return (
    <motion.div
      key="signup"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "linear" }}
      className="flex flex-col gap-3.5 pt-7 px-10 pb-4"
    >
      <FormInput label="IDENTITY / FULL NAME"      icon={<UserIcon />}   placeholder="ALAN TURING"              autoComplete="name"         value={fullName}       onChange={setFullName} />
      <FormInput label="COMMUNICATION / EMAIL"     icon={<MailIcon />}   placeholder="A.TURING@UNIVERSITY.EDU" autoComplete="off"          type="email" value={email} onChange={setEmail} />
      <FormInput label="CAMPUS ID"                 icon={<IdCardIcon />} placeholder="002-001-X"                autoComplete="off"          value={studentId}      onChange={setStudentId} />
      <FormInput label="ACCESS KEY / PASSWORD"     icon={<LockIcon />}   placeholder="••••••••••••"             autoComplete="new-password"
        type={showPassword ? "text" : "password"} value={password} onChange={setPassword}
        rightElement={
          <button onClick={() => setShowPassword(!showPassword)} className="shrink-0 text-[#6a7282] hover:text-white transition-colors">
            <EyeIcon />
          </button>
        }
      />
      <PasswordStrengthMeter password={password} />
      <FormInput label="VERIFY KEY" icon={<LockIcon />} placeholder="••••••••" autoComplete="new-password"
        type={showPassword ? "text" : "password"} value={verifyPassword} onChange={setVerifyPassword} />

      {/* Consent */}
      <label className="flex items-start gap-2.5 cursor-pointer">
        <button
          type="button"
          aria-pressed={agreedTerms}
          className={`mt-0.5 size-[14px] border shrink-0 flex items-center justify-center cursor-pointer transition-colors ${
            agreedTerms ? "bg-white border-white" : "bg-transparent border-white/30 hover:border-white/60"
          }`}
          onClick={() => setAgreedTerms(!agreedTerms)}
        >
          {agreedTerms && (
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="black" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <p className="font-mono text-[9px] text-[#6a7282] leading-[14px] tracking-[0.45px]">
          I HEREBY ACKNOWLEDGE THE <span className="underline text-white/60">SECURITY PROTOCOL AGREEMENT</span> AND CONSENT TO CAMPUS-WIDE DATA TRACKING FOR MOBILITY OPTIMIZATION.
        </p>
      </label>

      {/* Error/Success */}
      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-3 py-2">
          <span className="font-mono text-[9px] text-red-400 tracking-[0.5px]">{error}</span>
        </div>
      )}
      {success && (
        <div className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">
          <span className="font-mono text-[9px] text-emerald-400 tracking-[0.5px]">{success}</span>
        </div>
      )}

      {/* Register Button */}
      <button
        onClick={handleRegister}
        disabled={!isComplete || loading}
        className={`h-[52px] w-full flex items-center justify-center gap-2 border transition-all duration-300 ${
          isComplete && !loading
            ? "bg-white border-white cursor-pointer hover:bg-white/90 active:scale-[0.99]"
            : "bg-white/5 border-white/10 cursor-not-allowed"
        }`}
        style={
          isComplete && !loading
            ? { boxShadow: "0 0 16px rgba(255,255,255,0.38), 0 0 32px rgba(255,255,255,0.12)" }
            : {}
        }
      >
        {loading ? (
          <span className="font-mono text-[11px] text-white/30 tracking-[1.1px]">INITIALIZING...</span>
        ) : (
          <>
            <span className={`font-mono text-[11px] tracking-[1.1px] ${
              isComplete ? "text-black" : "text-white/25"
            }`}>Initialize Registration</span>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path
                d="M5.63 11.25L9.38 7.5L5.63 3.75"
                stroke={isComplete ? "black" : "rgba(255,255,255,0.25)"}
                strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25"
              />
            </svg>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1">
        <span className="font-mono text-[9px] text-[#6a7282] tracking-[0.45px]">ALREADY HAVE AN ACCOUNT?</span>
        <button onClick={onSwitchToLogin} className="font-mono text-[9px] text-white tracking-[0.45px] underline hover:text-white/70 transition-colors ml-1">
          SIGN IN
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export function LoginPage() {
  const [activeTab, setActiveTab] = useState("login"); // "login" | "signup" | "reset"
  const navigate = useNavigate();

  return (
    /*
     * ✏️ BAR COLOR: change "bg-black" and "border-white/[0.08]" on
     *    the <header> and <footer> below to customize the bar appearance.
     */
    <div className="bg-black h-screen flex flex-col font-mono overflow-hidden">

      {/* ── Three.js Particle Background (fills the gap between bars) ──────── */}
      {/*
       * The canvas is position:absolute and covers the full viewport.
       * It sits BEHIND the header and footer via z-index layering.
       * ✏️ CANVAS AREA: The wave sits behind everything; the bars overlay it.
       */}
      <div
        className="absolute inset-0 z-0"
        aria-hidden="true"
        style={{
          /* Subtle radial gradient overlay drawn on top of canvas for depth */
          background: "radial-gradient(ellipse at 50% 60%, transparent 0%, rgba(0,0,0,0.45) 100%)",
        }}
      >
        {/*
         * ✏️ DOT COLOR: change color="#ffffff" below to any hex, e.g. "#a0c4ff"
         * The ParticleWave canvas fills 100% of this container.
         * See ParticleWave.jsx for all other tunables (speed, fog, sensitivity).
         */}
        <ParticleWave color="#ffffff" />
      </div>

      {/*
       * ── Header Bar ─────────────────────────────────────────────────────────
       * ✏️ BAR BACKGROUND: change "bg-black/80" for a different bar fill.
       * ✏️ BAR BORDER:     change "border-white/[0.08]" for the separator line.
       */}
      <header className="relative z-10 h-[52px] shrink-0 bg-black/80 backdrop-blur-sm border-b border-white/[0.08] flex items-center justify-between px-4">
        <img src={imgLogo} alt="Uni-Lift" className="logo-header-glow h-[30px] w-[134px] object-contain object-left" />
        <span className="font-mono text-[10px] text-[#6a7282] tracking-[0.8px]">UNI-LIFT ACCESS PORTAL</span>
      </header>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      {/*
       * ── Main Content ──────────────────────────────────────────────────────
       * justify-center: Vertically centers the auth card on screen.
       */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center py-6 overflow-y-auto">
        <div className="w-[560px] flex flex-col gap-5">

          {/*
           * ── Auth Card ──────────────────────────────────────────────────────
           * Dark glassmorphism card sitting above the particle canvas.
           * ✏️ CARD BACKGROUND:  change "bg-black/70" below.
           * ✏️ CARD BORDER:      change "border-white/10" below.
           * ✏️ CARD BLUR:        change "backdrop-blur-md" below.
           */}
          {/*
           * ── Animated Auth Card ────────────────────────────────────────────
           * `layout` tells Framer Motion to measure and spring-animate the
           * card's height whenever the form inside changes size.
           * overflow:hidden clips content cleanly during the resize.
           */}
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="w-full bg-black/70 backdrop-blur-md border border-white/10"
            style={{
              /*
               * overflow:clip — clips visually without creating a scroll context,
               * so Framer Motion can still measure and spring-animate the true
               * target height. overflow:hidden would suppress the animation.
               *
               * transformOrigin:center — anchors the spring animation to the center
               * of the card, so it expands/contracts equally up and down.
               */
              overflow: "clip",
              transformOrigin: "center",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 48px rgba(0,0,0,0.6)",
            }}
          >
            {/* Card Title */}
            <div className="px-10 pt-10 pb-6 flex flex-col items-center text-center">
              <h1 className="font-mono text-[28px] text-white tracking-[1px] font-bold">
                {getAuthCardTitle(activeTab)}
              </h1>
              <p className="font-mono text-[10px] text-white/40 tracking-[4px] mt-2 max-w-[80%] leading-relaxed">
                {getAuthCardSubtitle(activeTab)}
              </p>
            </div>

            <div className="h-px bg-white/8 w-full" />

            {/* Tabs */}
            <div className="flex h-[44px] border-b border-white/8">
              <button
                onClick={() => setActiveTab("login")}
                className={`flex-1 flex items-center justify-center font-mono text-[10px] tracking-[1px] transition-colors ${
                  activeTab === "login"
                    ? "bg-white text-black"
                    : "bg-transparent text-[#6a7282] hover:text-white hover:bg-white/5"
                }`}
              >
                Login
              </button>
              <div className="w-px bg-white/8 h-full" />
              <button
                onClick={() => setActiveTab("signup")}
                className={`flex-1 flex items-center justify-center font-mono text-[10px] tracking-[1px] transition-colors ${
                  activeTab === "signup"
                    ? "bg-white text-black"
                    : "bg-transparent text-[#6a7282] hover:text-white hover:bg-white/5"
                }`}
              >
                Sign up
              </button>
              {activeTab === "reset" && (
                <>
                  <div className="w-px bg-white/8 h-full" />
                  <button
                    className="flex-1 flex items-center justify-center font-mono text-[10px] tracking-[1px] bg-white text-black"
                  >
                    Reset
                  </button>
                </>
              )}
            </div>

            {/*
             * mode="wait": exit animation completes first (form fades out,
             * card collapses to its static shell: title + tabs + status bar),
             * THEN the entering form mounts and the card grows to its new height.
             * One clean downward spring — no double-bounce, no zero-height collapse.
             * mode="popLayout" was wrong here: it set height→0 first then grew,
             * causing the visible double-stretch / bounce the user reported.
             */}
            <AnimatePresence mode="wait" initial={false}>
              {activeTab === "login" && (
                <LoginForm key="login" onSwitchToSignup={() => setActiveTab("signup")} onSwitchToReset={() => setActiveTab("reset")} />
              )}
              {activeTab === "signup" && (
                <RegisterForm key="signup" onSwitchToLogin={() => setActiveTab("login")} />
              )}
              {activeTab === "reset" && (
                <ResetPasswordForm key="reset" onSwitchToLogin={() => setActiveTab("login")} />
              )}
            </AnimatePresence>

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

          {/* Animated Wordmark */}
          <div className="flex justify-center">
            <AnimatedLogo size="42px" opacity={0.6} textColor="#ffffff" />
          </div>
        </div>
      </main>

      {/*
       * ── Footer Bar ─────────────────────────────────────────────────────────
       * ✏️ BAR BACKGROUND: change "bg-black/80" for a different footer fill.
       * ✏️ BAR BORDER:     change "border-white/[0.08]" for the separator line.
       */}
      <footer className="relative z-10 h-[40px] shrink-0 bg-black/80 backdrop-blur-sm border-t border-white/[0.08] grid grid-cols-3 items-center px-6">
        <div className="flex items-center gap-2">
          <ShieldIcon />
          <span className="font-mono text-[10px] text-[#6a7282]">Protected by University Authentication Protocol</span>
        </div>
        <div className="flex items-center justify-center gap-5">
          {[
            ["TERMS", "/terms"],
            ["PRIVACY", "/privacy"],
            ["SUPPORT", "/support"],
          ].map(([item, path]) => (
            <button key={item} onClick={() => navigate(path)} className="font-mono text-[10px] text-[#6a7282] tracking-[0.5px] hover:text-white transition-colors">
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
