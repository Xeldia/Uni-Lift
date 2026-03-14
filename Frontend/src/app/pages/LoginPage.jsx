import { useState } from "react";
import { useNavigate } from "react-router";
import imgLogo from "figma:asset/cf24a05d7bab431c95d30e2583597f4692c35574.png";
import imgSystemText from "figma:asset/9bd888463ca9367ff14ba6b7ad16ee6a7d8a7be9.png";
import imgShield from "figma:asset/441daa1dae41629e2a7035f925ccb7f3a7efff67.png";
import { signIn, signUp } from "../../lib/supabase";

const normalizeEmail = (email) => email.trim().toLowerCase();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function mapAuthError(message) {
  const lower = (message || "").toLowerCase();

  if (lower.includes("invalid") && lower.includes("email")) {
    return "Invalid email format. Use a valid address like name@cit.edu.";
  }

  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many signup attempts. Please wait a minute, then try again.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  return message || "Authentication failed. Please try again.";
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function MailIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M10.83 2.17H2.17C1.57 2.17 1.08 2.65 1.08 3.25V9.75C1.08 10.35 1.57 10.83 2.17 10.83H10.83C11.43 10.83 11.92 10.35 11.92 9.75V3.25C11.92 2.65 11.43 2.17 10.83 2.17Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
      <path d="M11.92 3.79L7.06 6.88C6.89 6.98 6.7 7.04 6.5 7.04C6.3 7.04 6.11 6.98 5.94 6.88L1.08 3.79" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M10.29 5.96H2.71C2.11 5.96 1.63 6.44 1.63 7.04V10.83C1.63 11.43 2.11 11.92 2.71 11.92H10.29C10.89 11.92 11.38 11.43 11.38 10.83V7.04C11.38 6.44 10.89 5.96 10.29 5.96Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
      <path d="M3.79 5.96V3.79C3.79 3.07 4.08 2.38 4.58 1.88C5.09 1.37 5.78 1.08 6.5 1.08C7.22 1.08 7.91 1.37 8.42 1.88C8.92 2.38 9.21 3.07 9.21 3.79V5.96" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M0.58 4.52C0.53 4.4 0.53 4.27 0.58 4.14C1.02 3.08 1.76 2.17 2.72 1.53C3.68 0.88 4.81 0.54 5.96 0.54C7.11 0.54 8.24 0.88 9.2 1.53C10.16 2.17 10.9 3.08 11.34 4.14C11.39 4.27 11.39 4.4 11.34 4.52C10.9 5.59 10.16 6.5 9.2 7.14C8.24 7.78 7.11 8.12 5.96 8.12C4.81 8.12 3.68 7.78 2.72 7.14C1.76 6.5 1.02 5.59 0.58 4.52Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
      <path d="M7.79 4.33C7.79 5.22 7.06 5.96 6.17 5.96C5.27 5.96 4.54 5.22 4.54 4.33C4.54 3.44 5.27 2.71 6.17 2.71C7.06 2.71 7.79 3.44 7.79 4.33Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M10.83 11.38V10.29C10.83 9.74 10.61 9.22 10.22 8.83C9.83 8.44 9.31 8.21 8.75 8.21H4.25C3.69 8.21 3.17 8.44 2.78 8.83C2.39 9.22 2.17 9.74 2.17 10.29V11.38" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
      <path d="M6.5 6.04C7.67 6.04 8.63 5.08 8.63 3.92C8.63 2.75 7.67 1.79 6.5 1.79C5.33 1.79 4.38 2.75 4.38 3.92C4.38 5.08 5.33 6.04 6.5 6.04Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
    </svg>
  );
}

function IdCardIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M11.38 2.17H1.63C1.03 2.17 0.54 2.65 0.54 3.25V9.75C0.54 10.35 1.03 10.83 1.63 10.83H11.38C11.97 10.83 12.46 10.35 12.46 9.75V3.25C12.46 2.65 11.97 2.17 11.38 2.17Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
      <path d="M4.33 7.58V6.5C4.33 6.21 4.44 5.94 4.65 5.73C4.85 5.53 5.12 5.42 5.42 5.42H7.58C7.88 5.42 8.15 5.53 8.35 5.73C8.56 5.94 8.67 6.21 8.67 6.5V7.58" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
      <path d="M6.5 5.42C7.1 5.42 7.58 4.93 7.58 4.33C7.58 3.74 7.1 3.25 6.5 3.25C5.9 3.25 5.42 3.74 5.42 4.33C5.42 4.93 5.9 5.42 6.5 5.42Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08" />
    </svg>
  );
}

// ─── Reusable Input ───────────────────────────────────────────────────────────
function FormInput({ label, icon, placeholder, type = "text", value, onChange, rightElement }) {
  return (
    <div className="flex flex-col gap-[6px] w-full">
      <p className="font-mono text-[9px] text-black tracking-[1.5px]">{label}</p>
      <div className="relative border border-black h-[46px] flex items-center px-3 gap-2 bg-white">
        <span className="shrink-0">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 font-mono text-[11px] text-black tracking-[0.55px] bg-transparent outline-none placeholder:text-[#d1d5dc]"
        />
        {rightElement}
      </div>
    </div>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ onSwitchToSignup }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stayActive, setStayActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    const emailValue = normalizeEmail(email);
    if (!emailValue || !password) { setError("Email and password are required."); return; }
    if (!isValidEmail(emailValue)) { setError("Invalid email format. Use a valid address like name@cit.edu."); return; }
    setLoading(true); setError("");
    const { data, error: err } = await signIn(emailValue, password);
    setLoading(false);
    if (err) { setError(mapAuthError(err.message)); return; }
    if (data?.user) navigate("/home");
  };

  return (
    <div className="flex flex-col gap-4 pt-7 px-10 pb-4">
      <FormInput
        label="TERMINAL ID / EMAIL"
        icon={<MailIcon />}
        placeholder="S.JOBS@UNIVERSITY.EDU"
        type="email"
        value={email}
        onChange={setEmail}
      />
      <FormInput
        label="ACCESS KEY / PASSWORD"
        icon={<LockIcon />}
        placeholder="••••••••••••"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={setPassword}
        rightElement={
          <button onClick={() => setShowPassword(!showPassword)} className="shrink-0">
            <EyeIcon />
          </button>
        }
      />

      {/* Remember / Reset */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            className={`size-[14px] border border-black flex items-center justify-center cursor-pointer ${stayActive ? "bg-black" : "bg-white"}`}
            onClick={() => setStayActive(!stayActive)}
          >
            {stayActive && (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="font-mono text-[9px] text-[#0a0a0a] tracking-[0.45px]">STAY ACTIVE</span>
        </label>
        <button className="font-mono text-[9px] text-[#0a0a0a] tracking-[0.45px] underline">RESET KEY?</button>
      </div>

      {/* Error message */}
      {error && (
        <div className="border border-[#ef4444] bg-[#fef2f2] px-3 py-2">
          <span className="font-mono text-[9px] text-[#ef4444] tracking-[0.5px]">{error}</span>
        </div>
      )}

      {/* Sign In */}
      <button
        onClick={handleSignIn}
        disabled={loading}
        className={`h-[52px] w-full flex items-center justify-center gap-2 transition-colors ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-900 cursor-pointer"
        }`}
      >
        <span className="font-mono text-[11px] text-white tracking-[1.1px]">{loading ? "AUTHENTICATING..." : "Sign In"}</span>
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M5.63 11.25L9.38 7.5L5.63 3.75" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
        </svg>
      </button>

      <div className="flex items-center justify-center gap-1">
        <span className="font-mono text-[9px] text-[#0a0a0a] tracking-[0.45px]">NEW USER?</span>
        <button onClick={onSwitchToSignup} className="font-mono text-[16px] text-[#0a0a0a] tracking-[0.45px] underline">
          CREATE ACCOUNT
        </button>
      </div>
    </div>
  );
}

// ─── Register Form ────────────────────────────────────────────────────────────
function RegisterForm({ onSwitchToLogin }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async () => {
    const emailValue = normalizeEmail(email);
    if (!agreedTerms) return;
    if (password !== verifyPassword) { setError("Passwords do not match."); return; }
    if (!fullName || !emailValue || !studentId || !password) { setError("All fields are required."); return; }
    if (!isValidEmail(emailValue)) { setError("Invalid email format. Use a valid address like name@cit.edu."); return; }
    setLoading(true); setError(""); setSuccess("");
    const { data, error: err } = await signUp(emailValue, password, fullName.trim(), studentId.trim());
    if (err) { setLoading(false); setError(mapAuthError(err.message)); return; }
    if (!data?.user) { setLoading(false); setError("Registration failed. Please try again."); return; }
    // Auto sign-in immediately after registration (no email confirmation needed)
    const { data: loginData, error: loginErr } = await signIn(emailValue, password);
    setLoading(false);
    if (loginErr) {
      const message = mapAuthError(loginErr.message || "Authentication failed.");
      if (/confirm|verification|verify/i.test(message)) {
        setSuccess("Account created. Check your email to confirm, then sign in.");
        setActiveTab("login");
        return;
      }
      setError(message);
      return;
    }
    if (loginData?.user) navigate("/home");
  };

  return (
    <div className="flex flex-col gap-3.5 pt-7 px-10 pb-4">
      <FormInput label="IDENTITY / FULL NAME" icon={<UserIcon />} placeholder="ALAN TURING" value={fullName} onChange={setFullName} />
      <FormInput label="COMMUNICATION / EMAIL" icon={<MailIcon />} placeholder="A.TURING@UNIVERSITY.EDU" type="email" value={email} onChange={setEmail} />

      <FormInput label="CAMPUS ID" icon={<IdCardIcon />} placeholder="002-001-X" value={studentId} onChange={setStudentId} />

      <FormInput
        label="ACCESS KEY / PASSWORD"
        icon={<LockIcon />}
        placeholder="••••••••••••"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={setPassword}
        rightElement={
          <button onClick={() => setShowPassword(!showPassword)} className="shrink-0"><EyeIcon /></button>
        }
      />
      <FormInput
        label="VERIFY KEY"
        icon={<LockIcon />}
        placeholder="••••••••"
        type={showPassword ? "text" : "password"}
        value={verifyPassword}
        onChange={setVerifyPassword}
      />

      {/* Consent */}
      <label className="flex items-start gap-2.5 cursor-pointer">
        <div
          className={`mt-0.5 size-[14px] border border-black shrink-0 flex items-center justify-center cursor-pointer ${agreedTerms ? "bg-black" : "bg-white"}`}
          onClick={() => setAgreedTerms(!agreedTerms)}
        >
          {agreedTerms && (
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <p className="font-mono text-[9px] text-[#0a0a0a] leading-[14px] tracking-[0.45px]">
          I HEREBY ACKNOWLEDGE THE <span className="underline">SECURITY PROTOCOL AGREEMENT</span> AND CONSENT TO CAMPUS-WIDE DATA TRACKING FOR MOBILITY OPTIMIZATION.
        </p>
      </label>

      {/* Error/Success messages */}
      {error && (
        <div className="border border-[#ef4444] bg-[#fef2f2] px-3 py-2">
          <span className="font-mono text-[9px] text-[#ef4444] tracking-[0.5px]">{error}</span>
        </div>
      )}
      {success && (
        <div className="border border-[#10b981] bg-[#f0fdf4] px-3 py-2">
          <span className="font-mono text-[9px] text-[#10b981] tracking-[0.5px]">{success}</span>
        </div>
      )}

      {/* Register Button */}
      <button
        onClick={handleRegister}
        disabled={!agreedTerms || loading}
        className={`h-[52px] w-full flex items-center justify-center gap-2 transition-colors ${
          agreedTerms && !loading ? "bg-black hover:bg-gray-900 cursor-pointer" : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        {loading ? (
          <span className="font-mono text-[11px] text-white tracking-[1.1px]">INITIALIZING...</span>
        ) : (
          <>
            <span className="font-mono text-[11px] text-white tracking-[1.1px]">Initialize Registration</span>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M5.63 11.25L9.38 7.5L5.63 3.75" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
            </svg>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1">
        <span className="font-mono text-[9px] text-[#0a0a0a] tracking-[0.45px]">ALREADY HAVE AN ACCOUNT?</span>
        <button onClick={onSwitchToLogin} className="font-mono text-[16px] text-[#0a0a0a] tracking-[0.45px] underline">
          SIGN IN
        </button>
      </div>
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export function LoginPage() {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="bg-white h-screen flex flex-col font-mono overflow-hidden">

      {/* Header */}
      <header className="h-[52px] shrink-0 border-b border-black flex items-center justify-between px-4">
        <img src={imgLogo} alt="Uni-Lift" className="h-[30px] w-[134px] object-contain object-left" />
        <span className="font-mono text-[10px] text-[#6a7282] tracking-[0.8px]">UNI-LIFT ACCESS PORTAL</span>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center py-6 overflow-y-auto">
        <div className="w-[560px] flex flex-col gap-5">

          {/* Auth Card */}
          <div className="w-full bg-white border-2 border-black" style={{ boxShadow: "4px 4px 0px 0px black" }}>

            {/* Title */}
            <div className="px-10 pt-8 pb-4">
              <h1 className="font-mono text-[28px] text-black tracking-[1px]">
                {activeTab === "login" ? "TERMINAL LOGIN" : "REGISTER ACCOUNT"}
              </h1>
              <p className="font-mono text-[10px] text-black opacity-60 tracking-[4px] mt-1">
                {activeTab === "login" ? "Secure Gateway for A Mobility" : "Authorized Personnel Entry Only"}
              </p>
            </div>

            <div className="h-px bg-black w-full" />

            {/* Tabs */}
            <div className="flex h-[44px] border-b border-black">
              <button
                onClick={() => setActiveTab("login")}
                className={`flex-1 flex items-center justify-center font-mono text-[10px] tracking-[1px] transition-colors ${
                  activeTab === "login" ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab("signup")}
                className={`flex-1 flex items-center justify-center font-mono text-[10px] tracking-[1px] transition-colors ${
                  activeTab === "signup" ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                Sign up
              </button>
            </div>

            {/* Form */}
            {activeTab === "login"
              ? <LoginForm onSwitchToSignup={() => setActiveTab("signup")} />
              : <RegisterForm onSwitchToLogin={() => setActiveTab("login")} />
            }

            {/* Status Bar */}
            <div className="h-[29px] bg-[#f9f9f9] border-t border-black flex items-center px-6 justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-[#00c950]" />
                <span className="font-mono text-[8px] text-[#6a7282] tracking-[0.8px]">ENCRYPTION: AES-256</span>
                <span className="font-mono text-[8px] text-[#6a7282] tracking-[0.8px]">SSL: SECURE</span>
              </div>
              <span className="font-mono text-[8px] text-[#99a1af] tracking-[0.8px]">NODE ID: P01 • • •</span>
            </div>
          </div>

          {/* System Text Image */}
          <div className="flex justify-center">
            <img src={imgSystemText} alt="Central Auto System" className="h-[60px] w-[213px] object-contain opacity-70" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-[40px] shrink-0 border-t border-black/20 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <img src={imgShield} alt="" className="h-3 w-[13px] opacity-60 object-cover" />
          <span className="font-mono text-[10px] text-[#6a7282]">Protected by University Authentication Protocol</span>
        </div>
        <div className="flex items-center gap-5">
          {["TERMS", "PRIVACY", "SUPPORT"].map((item) => (
            <button key={item} className="font-mono text-[10px] text-[#6a7282] tracking-[0.5px] hover:text-black transition-colors">
              {item}
            </button>
          ))}
        </div>
        <span className="font-mono text-[10px] text-[#d1d5dc] tracking-[0.5px]">© 2026 UNI-LIFT TERMINAL V1.0.4</span>
      </footer>
    </div>
  );
}
