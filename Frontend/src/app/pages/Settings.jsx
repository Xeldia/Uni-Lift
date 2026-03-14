import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Navigation } from "../components/Navigation";
import { TerminalContainer } from "../components/TerminalContainer";
import { TerminalInput } from "../components/TerminalInput";
import { TerminalButton } from "../components/TerminalButton";
import { SettingToggle } from "../components/SettingToggle";
import { saveUserProfile, signOut, supabase } from "../../lib/supabase";

const ICON_MAIL = (
  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
    <path d="M10.8332 2.16797H2.1665C1.70627 2.16797 1.33317 2.54106 1.33317 3.0013V10.0013C1.33317 10.4615 1.70627 10.8346 2.1665 10.8346H10.8332C11.2934 10.8346 11.6665 10.4615 11.6665 10.0013V3.0013C11.6665 2.54106 11.2934 2.16797 10.8332 2.16797Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
    <path d="M1.33317 3.0013L6.49984 6.5013L11.6665 3.0013" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
  </svg>
);

const ICON_LOCK = (
  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
    <path d="M10.8332 5.9987H2.1665C1.70627 5.9987 1.33317 6.3718 1.33317 6.83203V10.832C1.33317 11.2923 1.70627 11.6654 2.1665 11.6654H10.8332C11.2934 11.6654 11.6665 11.2923 11.6665 10.832V6.83203C11.6665 6.3718 11.2934 5.9987 10.8332 5.9987Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
    <path d="M3.8335 5.9987V3.83203C3.8335 3.14529 4.10641 2.48681 4.59401 2.00047C5.08161 1.51413 5.74348 1.24121 6.43016 1.24121C7.11685 1.24121 7.77872 1.51413 8.26632 2.00047C8.75392 2.48681 9.02683 3.14529 9.02683 3.83203V5.9987" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
  </svg>
);

const ICON_USER = (
  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
    <circle cx="6.5" cy="4.5" r="2.5" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
    <path d="M2.5 11.5C2.5 9.567 4.067 8 6 8H7C8.933 8 10.5 9.567 10.5 11.5" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
  </svg>
);

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [mode, setMode] = useState("RIDER");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedConfirm, setSavedConfirm] = useState("");

  const [authUser, setAuthUser] = useState(null);
  const [studentId, setStudentId] = useState("");

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notifications, setNotifications] = useState(true);
  const [autoLogout, setAutoLogout] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [locationServices, setLocationServices] = useState(true);
  const [rideUpdates, setRideUpdates] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [deviceTracking, setDeviceTracking] = useState(true);
  const [biometric, setBiometric] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        navigate("/");
        return;
      }

      setAuthUser(authData.user);
      const metadata = authData.user.user_metadata ?? {};
      const { data: profile } = await supabase
        .from("users")
        .select("student_id, full_name")
        .eq("id", authData.user.id)
        .maybeSingle();

      setEmail(authData.user.email ?? "");
      setDisplayName(profile?.full_name ?? metadata.full_name ?? "");
      setStudentId(profile?.student_id ?? metadata.student_id ?? `TEMP-${authData.user.id.slice(0, 8)}`);

      const settings = metadata.settings ?? {};
      setNotifications(settings.notifications ?? true);
      setAutoLogout(settings.autoLogout ?? true);
      setDataSharing(settings.dataSharing ?? false);
      setLocationServices(settings.locationServices ?? true);
      setRideUpdates(settings.rideUpdates ?? true);
      setTwoFactor(settings.twoFactor ?? false);
      setLoginAlerts(settings.loginAlerts ?? true);
      setDeviceTracking(settings.deviceTracking ?? true);
      setBiometric(settings.biometric ?? false);

      setLoading(false);
    };

    load();
  }, [navigate]);

  const settingsPayload = useMemo(
    () => ({
      notifications,
      autoLogout,
      dataSharing,
      locationServices,
      rideUpdates,
      twoFactor,
      loginAlerts,
      deviceTracking,
      biometric,
    }),
    [
      notifications,
      autoLogout,
      dataSharing,
      locationServices,
      rideUpdates,
      twoFactor,
      loginAlerts,
      deviceTracking,
      biometric,
    ],
  );

  const handleSaveAccount = async () => {
    if (!authUser) return;
    setSaving(true);
    setError("");
    setSavedConfirm("");

    try {
      if (newPassword || confirmPassword || currentPassword) {
        if (!currentPassword) {
          throw new Error("Current password is required to change password.");
        }

        if (newPassword.length < 8) {
          throw new Error("New password must be at least 8 characters.");
        }

        if (newPassword !== confirmPassword) {
          throw new Error("New password and confirm password do not match.");
        }

        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: authUser.email,
          password: currentPassword,
        });

        if (verifyError) {
          throw new Error("Current password is incorrect.");
        }

        const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
        if (pwError) throw pwError;
      }

      if (email !== authUser.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
      }

      await saveUserProfile({
        id: authUser.id,
        email,
        full_name: displayName,
        student_id: studentId,
      });

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          ...(authUser.user_metadata ?? {}),
          full_name: displayName,
          student_id: studentId,
          settings: settingsPayload,
        },
      });

      if (metadataError) throw metadataError;

      setSavedConfirm("CONFIGURATION SAVED ✓");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (saveError) {
      setError(saveError.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    if (!authUser) return;
    setSaving(true);
    setError("");
    setSavedConfirm("");

    try {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          ...(authUser.user_metadata ?? {}),
          settings: settingsPayload,
        },
      });
      if (metadataError) throw metadataError;
      setSavedConfirm("SECURITY SETTINGS SAVED ✓");
    } catch (saveError) {
      setError(saveError.message || "Failed to save security settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-white font-mono overflow-hidden">
        <Navigation
          activePage="settings"
          mode={mode}
          onModeToggle={() => setMode(mode === "RIDER" ? "DRIVER" : "RIDER")}
        />
        <div className="flex-1 overflow-y-auto">
          <TerminalContainer title="SYSTEM SETTINGS" subtitle="Loading account..." maxWidth="740px">
            <div className="px-[40px] py-[32px] font-['Consolas:Regular',sans-serif] text-[10px] text-[#6a7282]">Fetching your profile and settings…</div>
          </TerminalContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white font-mono overflow-hidden">
      <Navigation
        activePage="settings"
        mode={mode}
        onModeToggle={() => setMode(mode === "RIDER" ? "DRIVER" : "RIDER")}
      />
      <div className="flex-1 overflow-y-auto">
        <TerminalContainer title="SYSTEM SETTINGS" subtitle="Configure Terminal Preferences" maxWidth="740px">
        <div className="w-full">
          <div className="content-stretch flex h-[44px] items-start pb-px relative shrink-0 w-full">
            <div aria-hidden="true" className="absolute border-b border-black border-solid inset-0 pointer-events-none" />

            <button
              onClick={() => setActiveTab("account")}
              className={`flex-1 relative h-[43px] transition-colors ${activeTab === "account" ? "bg-black" : "bg-white hover:bg-[#f9f9f9]"}`}
            >
              <p className={`font-['Consolas:Bold',sans-serif] text-[10px] text-center tracking-[1px] whitespace-nowrap ${activeTab === "account" ? "text-white" : "text-black"}`}>
                ACCOUNT
              </p>
            </button>

            <Link to="/profile" className="flex-1 relative bg-white h-[43px] flex items-center justify-center hover:bg-[#f9f9f9] transition-colors">
              <p className="font-['Consolas:Bold',sans-serif] text-[10px] text-black text-center tracking-[1px] whitespace-nowrap">PROFILE</p>
            </Link>

            <button
              onClick={() => setActiveTab("security")}
              className={`flex-1 relative h-[43px] transition-colors ${activeTab === "security" ? "bg-black" : "bg-white hover:bg-[#f9f9f9]"}`}
            >
              <p className={`font-['Consolas:Bold',sans-serif] text-[10px] text-center tracking-[1px] whitespace-nowrap ${activeTab === "security" ? "text-white" : "text-black"}`}>
                SECURITY
              </p>
            </button>
          </div>

          {activeTab === "account" && (
            <div className="px-[40px] py-[32px] flex flex-col gap-[28px]">
              <div className="flex flex-col gap-[16px]">
                <div className="flex items-center gap-[12px] mb-[4px]">
                  <p className="font-['Consolas:Bold',sans-serif] text-[11px] text-black tracking-[1.5px] whitespace-nowrap">ACCOUNT INFORMATION</p>
                  <div className="flex-1 h-px bg-black opacity-10" />
                </div>

                <TerminalInput label="TERMINAL ID / EMAIL" icon={ICON_MAIL} value={email} onChange={(e) => setEmail(e.target.value)} />
                <TerminalInput label="DISPLAY NAME" icon={ICON_USER} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                <div className="grid grid-cols-3 gap-[12px]">
                  <TerminalInput label="CURRENT PASSWORD" icon={ICON_LOCK} type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  <TerminalInput label="NEW PASSWORD" icon={ICON_LOCK} type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <TerminalInput label="CONFIRM PASSWORD" icon={ICON_LOCK} type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-[12px] mb-[4px]">
                  <p className="font-['Consolas:Bold',sans-serif] text-[11px] text-black tracking-[1.5px] whitespace-nowrap">PREFERENCES</p>
                  <div className="flex-1 h-px bg-black opacity-10" />
                </div>
                <SettingToggle label="NOTIFICATION ALERTS" description="Receive system notifications and ride updates via push alert" enabled={notifications} onChange={setNotifications} />
                <SettingToggle label="RIDE STATUS UPDATES" description="Push updates when driver status changes or ride is confirmed" enabled={rideUpdates} onChange={setRideUpdates} />
                <SettingToggle label="AUTO-LOGOUT PROTOCOL" description="Automatic session termination after 30 minutes of inactivity" enabled={autoLogout} onChange={setAutoLogout} />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-[12px] mb-[4px]">
                  <p className="font-['Consolas:Bold',sans-serif] text-[11px] text-black tracking-[1.5px] whitespace-nowrap">DATA &amp; PRIVACY</p>
                  <div className="flex-1 h-px bg-black opacity-10" />
                </div>
                <SettingToggle label="LOCATION SERVICES" description="Allow the app to access your location for ride matching" enabled={locationServices} onChange={setLocationServices} />
                <SettingToggle label="ANONYMOUS DATA SHARING" description="Share anonymized usage analytics to improve the platform" enabled={dataSharing} onChange={setDataSharing} />
              </div>

              <div className="flex flex-col gap-[12px]">
                <div className="flex items-center gap-[12px] mb-[4px]">
                  <p className="font-['Consolas:Bold',sans-serif] text-[11px] text-black tracking-[1.5px] whitespace-nowrap">SESSION</p>
                  <div className="flex-1 h-px bg-black opacity-10" />
                </div>
                <div className="border border-black p-[16px] flex items-center justify-between gap-[16px]">
                  <div>
                    <p className="font-['Consolas:Bold',sans-serif] text-[9px] text-black tracking-[1.1px] mb-[4px]">CURRENT SESSION</p>
                    <p className="font-['Consolas:Regular',sans-serif] text-[8px] text-[#6a7282] tracking-[0.45px]">{authUser?.email} · Last sign in: {authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString() : "N/A"}</p>
                  </div>
                  <div className="w-[180px]"><TerminalButton variant="secondary" onClick={handleLogout}>LOG OUT</TerminalButton></div>
                </div>
              </div>

              {error && <div className="border border-[#ef4444] bg-[#fef2f2] px-3 py-2 font-mono text-[9px] text-[#ef4444]">{error}</div>}
              {savedConfirm && <div className="border border-[#10b981] bg-[#f0fdf4] px-3 py-2 font-mono text-[9px] text-[#10b981]">{savedConfirm}</div>}

              <div className="pt-[4px]">
                <TerminalButton onClick={handleSaveAccount} disabled={saving}>{saving ? "SAVING..." : "SAVE ACCOUNT"}</TerminalButton>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="px-[40px] py-[32px] flex flex-col gap-[28px]">
              <div className="flex flex-col">
                <div className="flex items-center gap-[12px] mb-[4px]">
                  <p className="font-['Consolas:Bold',sans-serif] text-[11px] text-black tracking-[1.5px] whitespace-nowrap">AUTHENTICATION</p>
                  <div className="flex-1 h-px bg-black opacity-10" />
                </div>
                <SettingToggle label="TWO-FACTOR AUTHENTICATION" description="Require a verification code from your phone on each login" enabled={twoFactor} onChange={setTwoFactor} />
                <SettingToggle label="BIOMETRIC LOGIN" description="Enable fingerprint or face recognition for faster access" enabled={biometric} onChange={setBiometric} />
                <SettingToggle label="LOGIN ACTIVITY ALERTS" description="Get notified when a new device accesses your account" enabled={loginAlerts} onChange={setLoginAlerts} />
                <SettingToggle label="DEVICE TRACKING" description="Monitor current authorized device metadata" enabled={deviceTracking} onChange={setDeviceTracking} />
              </div>

              <div className="border border-black p-[16px]">
                <p className="font-['Consolas:Bold',sans-serif] text-[9px] text-black tracking-[1px] mb-[4px]">RECENT SECURITY EVENT</p>
                <p className="font-['Consolas:Regular',sans-serif] text-[8px] text-[#6a7282]">Last sign in: {authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString() : "Unknown"}</p>
              </div>

              {error && <div className="border border-[#ef4444] bg-[#fef2f2] px-3 py-2 font-mono text-[9px] text-[#ef4444]">{error}</div>}
              {savedConfirm && <div className="border border-[#10b981] bg-[#f0fdf4] px-3 py-2 font-mono text-[9px] text-[#10b981]">{savedConfirm}</div>}

              <div className="pt-[4px]">
                <TerminalButton onClick={handleSaveSecurity} disabled={saving}>{saving ? "SAVING..." : "SAVE SECURITY SETTINGS"}</TerminalButton>
              </div>
            </div>
          )}

          <div className="bg-[#f9f9f9] h-[29px] relative shrink-0 w-full">
            <div aria-hidden="true" className="absolute border-black border-solid border-t inset-0 pointer-events-none" />
            <div className="flex items-center justify-between px-[24px] h-full">
              <div className="flex items-center gap-[16px]">
                <div className="flex items-center gap-[8px]"><div className="bg-[#00c950] rounded-full size-[8px]" /><p className="font-['Consolas:Regular',sans-serif] text-[#6a7282] text-[8px] tracking-[0.8px] whitespace-nowrap">SYSTEM: ACTIVE</p></div>
                <p className="font-['Consolas:Regular',sans-serif] text-[#6a7282] text-[8px] tracking-[0.8px] whitespace-nowrap">REAL-TIME PROFILE DATA</p>
              </div>
              <p className="font-['Consolas:Regular',sans-serif] text-[#99a1af] text-[8px] tracking-[0.8px] whitespace-nowrap">CONFIG ID: S02 • • •</p>
            </div>
          </div>
        </div>
        </TerminalContainer>
      </div>
    </div>
  );
}
