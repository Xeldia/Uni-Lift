import { useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useTheme } from "next-themes";
import imgLogo from "../../assets/logo.png";
import { signOut, supabase, submitDriverVerificationRequest, uploadVerificationDocToStorage } from "../lib/supabase";
import { useThemeSync } from "../hooks/useThemeSync";

export function Navigation({ activePage, mode = "RIDER", onModeToggle }) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("USER");
  useThemeSync();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Driver gate state
  const [driverModal, setDriverModal] = useState(null); // null | "form" | "pending" | "submitted"
  const [driverStatus, setDriverStatus] = useState(null);
  const [driverRejectionReason, setDriverRejectionReason] = useState("");
  const [driverChecking, setDriverChecking] = useState(false);
  const [driverSubmitting, setDriverSubmitting] = useState(false);
  const [driverFormError, setDriverFormError] = useState("");
  const [driverForm, setDriverForm] = useState({
    fullAddress: "", college: "", course: "", plateNumber: "", licenseNumber: "",
  });
  const [driverFiles, setDriverFiles] = useState({
    licenseFront: null, licenseBack: null, vehicleReg: null,
  });

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setDisplayName("USER");
        return;
      }

      const metadataName = user.user_metadata?.full_name;
      if (typeof metadataName === "string" && metadataName.trim().length > 0) {
        setDisplayName(metadataName.trim());
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      setDisplayName(profile?.full_name || user.email?.split("@")[0] || "USER");
    };

    loadUser();
  }, []);

  const initials = useMemo(
    () =>
      displayName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    [displayName],
  );

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleDriverModeClick = async () => {
    if (mode === "DRIVER") return; // already driver, no gate needed
    setDriverChecking(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setDriverChecking(false); return; }

    const { data: profile } = await supabase
      .from("users")
      .select("role, driver_verification_status, driver_rejection_reason")
      .eq("id", user.id)
      .maybeSingle();

    setDriverChecking(false);

    const role = (profile?.role ?? "").toLowerCase();
    const verStatus = profile?.driver_verification_status ?? "NOT_SUBMITTED";
    const canDrive = role === "driver" || role === "both" || role === "admin";

    if (canDrive && verStatus === "APPROVED") {
      onModeToggle?.("DRIVER");
      return;
    }

    setDriverStatus(verStatus);
    setDriverRejectionReason(profile?.driver_rejection_reason ?? "");
    setDriverForm({ fullAddress: "", college: "", course: "", plateNumber: "", licenseNumber: "" });
    setDriverFiles({ licenseFront: null, licenseBack: null, vehicleReg: null });
    setDriverFormError("");

    if (verStatus === "PENDING") {
      setDriverModal("pending");
    } else {
      setDriverModal("form");
    }
  };

  const handleDriverFormSubmit = async (e) => {
    e.preventDefault();
    const { fullAddress, college, course, plateNumber, licenseNumber } = driverForm;
    if (!fullAddress || !college || !course || !plateNumber || !licenseNumber) {
      setDriverFormError("All fields are required.");
      return;
    }
    setDriverSubmitting(true);
    setDriverFormError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setDriverSubmitting(false); return; }

    let licenseFrontUrl, licenseBackUrl, vehicleRegUrl;
    try {
      if (driverFiles.licenseFront) licenseFrontUrl = await uploadVerificationDocToStorage(user.id, driverFiles.licenseFront, "license_front_url");
      if (driverFiles.licenseBack) licenseBackUrl = await uploadVerificationDocToStorage(user.id, driverFiles.licenseBack, "license_back_url");
      if (driverFiles.vehicleReg) vehicleRegUrl = await uploadVerificationDocToStorage(user.id, driverFiles.vehicleReg, "vehicle_reg_url");
    } catch (uploadErr) {
      setDriverSubmitting(false);
      setDriverFormError(uploadErr.message || "Document upload failed.");
      return;
    }

    const { error } = await submitDriverVerificationRequest(user.id, { ...driverForm, licenseFrontUrl, licenseBackUrl, vehicleRegUrl });
    setDriverSubmitting(false);
    if (error) {
      setDriverFormError(error.message || "Submission failed.");
    } else {
      setDriverModal("submitted");
    }
  };

  return (
    <>
    <nav className="bg-white h-[52px] shrink-0 w-full border-b border-black relative z-10">
      <div className="flex items-center justify-between h-full px-4">

        {/* Logo */}
        <button onClick={() => navigate("/home")} className="h-8 w-[134px] shrink-0">
          <img src={imgLogo} alt="Uni-Lift" className="h-full w-full object-contain object-left" />
        </button>

        {/* Center Nav Tabs */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-end h-full gap-0">
          <button
            onClick={() => navigate("/home")}
            className={`h-full px-5 flex items-center gap-2 border-b-2 transition-colors ${
              activePage === "home" ? "border-black" : "border-transparent"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M1.5 5C1.5 4.85 1.53 4.71 1.59 4.58C1.65 4.45 1.74 4.33 1.85 4.24L5.35 1.24C5.53 1.08 5.76 1 6 1C6.24 1 6.47 1.08 6.65 1.24L10.15 4.24C10.26 4.33 10.35 4.45 10.41 4.58C10.47 4.71 10.5 4.85 10.5 5V9.5C10.5 9.77 10.39 10.02 10.21 10.21C10.02 10.39 9.77 10.5 9.5 10.5H2.5C2.23 10.5 1.98 10.39 1.79 10.21C1.61 10.02 1.5 9.77 1.5 9.5V5Z"
                stroke={activePage === "home" ? "black" : "#666"}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.5 10.5V6.5C7.5 6.37 7.45 6.24 7.35 6.15C7.26 6.05 7.13 6 7 6H5C4.87 6 4.74 6.05 4.65 6.15C4.55 6.24 4.5 6.37 4.5 6.5V10.5"
                stroke={activePage === "home" ? "black" : "#666"}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={`font-mono text-[10px] tracking-[0.5px] ${activePage === "home" ? "text-black" : "text-[#666]"}`}>
              HOME
            </span>
          </button>

          <button
            onClick={() => navigate("/messages")}
            className={`h-full px-5 flex items-center gap-2 border-b-2 transition-colors ${
              activePage === "messages" ? "border-black" : "border-transparent"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M10.5 7.5C10.5 7.77 10.39 8.02 10.21 8.21C10.02 8.39 9.77 8.5 9.5 8.5H3.5L1.5 10.5V2.5C1.5 2.23 1.61 1.98 1.79 1.79C1.98 1.61 2.23 1.5 2.5 1.5H9.5C9.77 1.5 10.02 1.61 10.21 1.79C10.39 1.98 10.5 2.23 10.5 2.5V7.5Z"
                stroke={activePage === "messages" ? "black" : "#666"}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={`font-mono text-[10px] tracking-[0.5px] ${activePage === "messages" ? "text-black" : "text-[#666]"}`}>
              MESSAGES
            </span>
          </button>

          <button
            onClick={() => navigate("/settings")}
            className={`h-full px-5 flex items-center gap-2 border-b-2 transition-colors ${
              activePage === "settings" ? "border-black" : "border-transparent"
            }`}
          >
            <span className={`font-mono text-[10px] tracking-[0.5px] ${activePage === "settings" ? "text-black" : "text-[#666]"}`}>
              SETTINGS
            </span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">

          {/* Mode Toggle */}
          <div className="flex items-center border border-black h-[23px]">
            <span className="px-2 font-mono text-[9px] text-[#666] tracking-[0.45px]">MODE:</span>
            <button
              onClick={() => onModeToggle?.("RIDER")}
              className={`h-full px-3 font-mono text-[9px] tracking-[0.45px] transition-colors ${
                mode === "RIDER" ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              RIDER
            </button>
            <button
              onClick={handleDriverModeClick}
              disabled={driverChecking}
              className={`h-full px-3 font-mono text-[9px] tracking-[0.45px] flex items-center gap-1 transition-colors disabled:opacity-60 ${
                mode === "DRIVER" ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              {driverChecking ? "..." : "DRIVER"}
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path
                  d="M3 6L5 4L3 2"
                  stroke={mode === "DRIVER" ? "white" : "black"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="0.8"
                />
              </svg>
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="size-[26px] flex items-center justify-center hover:bg-gray-100 transition-colors"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M9.01 9.01l1.06 1.06M2.93 11.07l1.06-1.06M9.01 4.99l1.06-1.06" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M12 9.5A6 6 0 0 1 4.5 2 6 6 0 1 0 12 9.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* SOS Button */}
          <button className="bg-[#ef4444] h-[25px] px-3 flex items-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path
                d="M9.96 8.25L6.29 1.83C6.21 1.69 6.1 1.57 5.96 1.49C5.82 1.41 5.66 1.37 5.5 1.37C5.33 1.37 5.17 1.41 5.03 1.49C4.89 1.57 4.78 1.69 4.7 1.83L1.03 8.25C0.95 8.39 0.91 8.55 0.91 8.71C0.91 8.87 0.95 9.03 1.03 9.17C1.11 9.31 1.23 9.43 1.37 9.51C1.51 9.59 1.67 9.63 1.83 9.63H9.17C9.33 9.63 9.49 9.58 9.62 9.5C9.76 9.42 9.88 9.31 9.96 9.17C10.04 9.03 10.08 8.87 10.08 8.71C10.08 8.55 10.04 8.39 9.96 8.25Z"
                stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9"
              />
              <path d="M5.5 4.13V5.96" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9" />
              <path d="M5.5 7.79H5.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9" />
            </svg>
            <span className="font-mono text-[9px] text-white tracking-[0.45px]">SOS</span>
          </button>

          {/* User Badge */}
          <button onClick={() => navigate("/profile")} className="border border-black h-[30px] flex items-center gap-2 px-2 hover:bg-gray-50 transition-colors">
            <div className="bg-black size-5 flex items-center justify-center">
              <span className="font-mono text-[8px] text-white">{initials}</span>
            </div>
            <span className="font-mono text-[9px] text-[#0a0a0a] tracking-[0.2px] max-w-[72px] truncate">{displayName.split(" ")[0]?.toUpperCase() || "USER"}</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="size-[26px] flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M4.08 11.08H1.75C1.44 11.08 1.14 10.96 0.93 10.74C0.71 10.52 0.58 10.23 0.58 9.92V1.75C0.58 1.44 0.71 1.14 0.93 0.93C1.14 0.71 1.44 0.58 1.75 0.58H4.08"
                stroke="#0A0A0A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.17"
              />
              <path d="M0.58 6.42L3.5 3.5L0.58 0.58" stroke="#0A0A0A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.17" transform="translate(6, 3.5)" />
              <path d="M7.58 5.83H0.58" stroke="#0A0A0A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.17" transform="translate(5.5, 1.17)" />
            </svg>
          </button>
        </div>
      </div>
    </nav>

      {/* Driver verification gate modal — outside nav so map stacking context can't block it */}
      {driverModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white border border-black w-full max-w-[480px] mx-4 flex flex-col">

            {/* Header */}
            <div className="bg-black px-4 py-3 flex items-center justify-between">
              <span className="font-mono text-[10px] text-white tracking-[1px]">
                {driverModal === "pending" && "APPLICATION UNDER REVIEW"}
                {driverModal === "form" && (driverStatus === "REJECTED" ? "RESUBMIT DRIVER APPLICATION" : driverStatus === "REVOKED" ? "DRIVER ACCESS REVOKED" : "DRIVER APPLICATION")}
                {driverModal === "submitted" && "APPLICATION SUBMITTED"}
              </span>
              <button
                onClick={() => setDriverModal(null)}
                className="text-white font-mono text-[14px] leading-none hover:opacity-70"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">

              {/* PENDING state */}
              {driverModal === "pending" && (
                <>
                  <div className="border border-[#f59e0b] bg-[#fef3c7] px-3 py-2">
                    <p className="font-mono text-[9px] tracking-[0.5px] text-[#92400e]">
                      Your driver application is currently under admin review. You will be notified once a decision is made.
                    </p>
                  </div>
                  <p className="font-mono text-[9px] text-[#666] tracking-[0.3px]">
                    Driver mode will be unlocked automatically once your application is approved.
                  </p>
                  <button
                    onClick={() => setDriverModal(null)}
                    className="w-full h-[34px] bg-black text-white font-mono text-[9px] tracking-[1px] hover:bg-[#222] transition-colors"
                  >
                    GOT IT
                  </button>
                </>
              )}

              {/* SUBMITTED success state */}
              {driverModal === "submitted" && (
                <>
                  <div className="border border-[#10b981] bg-[#d1fae5] px-3 py-2">
                    <p className="font-mono text-[9px] tracking-[0.5px] text-[#065f46]">
                      Application submitted successfully. An admin will review your documents and notify you.
                    </p>
                  </div>
                  <button
                    onClick={() => setDriverModal(null)}
                    className="w-full h-[34px] bg-black text-white font-mono text-[9px] tracking-[1px] hover:bg-[#222] transition-colors"
                  >
                    CLOSE
                  </button>
                </>
              )}

              {/* FORM state (NOT_SUBMITTED / REJECTED / REVOKED) */}
              {driverModal === "form" && (
                <form onSubmit={handleDriverFormSubmit} className="flex flex-col gap-3">

                  {driverStatus === "REJECTED" && (
                    <div className="border border-[#ef4444] bg-[#fef2f2] px-3 py-2">
                      <p className="font-mono text-[9px] tracking-[0.5px] text-[#991b1b]">
                        <span className="font-bold">REJECTED:</span>{" "}
                        {driverRejectionReason || "Your previous application was rejected. Please resubmit."}
                      </p>
                    </div>
                  )}

                  {driverStatus === "REVOKED" && (
                    <div className="border border-[#ef4444] bg-[#fef2f2] px-3 py-2">
                      <p className="font-mono text-[9px] tracking-[0.5px] text-[#991b1b]">
                        Your driver access was revoked by an admin. You may reapply below.
                      </p>
                    </div>
                  )}

                  <p className="font-mono text-[9px] text-[#666] tracking-[0.3px]">
                    Fill out the form below. An admin will review your application before granting driver mode access.
                  </p>

                  {[
                    { key: "fullAddress", label: "HOME ADDRESS" },
                    { key: "college",     label: "COLLEGE / SCHOOL" },
                    { key: "course",      label: "COURSE / PROGRAM" },
                    { key: "plateNumber", label: "PLATE NUMBER" },
                    { key: "licenseNumber", label: "DRIVER LICENSE NO." },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="font-mono text-[8px] text-[#666] tracking-[0.8px]">{label}</label>
                      <input
                        type="text"
                        value={driverForm[key]}
                        onChange={(e) => setDriverForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="border border-black px-2 h-[30px] font-mono text-[10px] outline-none focus:ring-1 focus:ring-black w-full"
                        disabled={driverSubmitting}
                      />
                    </div>
                  ))}

                  <div className="border-t border-[#e5e7eb] pt-3 flex flex-col gap-3">
                    <p className="font-mono text-[8px] text-[#666] tracking-[0.8px]">DOCUMENTS (optional but recommended)</p>
                    {[
                      { key: "licenseFront", label: "DRIVER LICENSE (FRONT)" },
                      { key: "licenseBack",  label: "DRIVER LICENSE (BACK)" },
                      { key: "vehicleReg",   label: "VEHICLE REGISTRATION / PLATE PHOTO" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex flex-col gap-1">
                        <label className="font-mono text-[8px] text-[#666] tracking-[0.8px]">{label}</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          onChange={(e) => setDriverFiles((f) => ({ ...f, [key]: e.target.files?.[0] ?? null }))}
                          className="font-mono text-[9px] text-black file:border file:border-black file:bg-white file:font-mono file:text-[8px] file:px-2 file:py-1 file:mr-2 file:cursor-pointer"
                          disabled={driverSubmitting}
                        />
                        {driverFiles[key] && (
                          <p className="font-mono text-[8px] text-[#10b981]">{driverFiles[key].name}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {driverFormError && (
                    <p className="font-mono text-[9px] text-[#ef4444] tracking-[0.3px]">{driverFormError}</p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDriverModal(null)}
                      className="flex-1 h-[34px] border border-black font-mono text-[9px] tracking-[1px] hover:bg-gray-50 transition-colors"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={driverSubmitting}
                      className="flex-1 h-[34px] bg-black text-white font-mono text-[9px] tracking-[1px] hover:bg-[#222] transition-colors disabled:opacity-50"
                    >
                      {driverSubmitting ? "SUBMITTING..." : "SUBMIT APPLICATION"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

Navigation.propTypes = {
  activePage: PropTypes.string,
  mode: PropTypes.oneOf(["RIDER", "DRIVER"]),
  onModeToggle: PropTypes.func,
};
