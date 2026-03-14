import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Navigation } from "../components/Navigation";
import { TerminalContainer } from "../components/TerminalContainer";
import { TerminalInput } from "../components/TerminalInput";
import { TerminalButton } from "../components/TerminalButton";
import { saveUserProfile, supabase } from "../../lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

const toBase64 = (fileBuffer) => {
  const bytes = new Uint8Array(fileBuffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

const ICON_USER = (
  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
    <circle cx="6.5" cy="4.5" r="2.5" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
    <path d="M2.5 11.5C2.5 9.567 4.067 8 6 8H7C8.933 8 10.5 9.567 10.5 11.5" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
  </svg>
);

const ICON_ID = (
  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
    <rect x="2" y="3.5" width="9" height="6" rx="1" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
    <path d="M4 6.5H9" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
    <path d="M4 8.5H7" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
  </svg>
);

const ICON_BUILDING = (
  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
    <rect x="2.5" y="3" width="8" height="7.5" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
    <path d="M4.5 3V2.5C4.5 2.224 4.724 2 5 2H8C8.276 2 8.5 2.224 8.5 2.5V3" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
    <line x1="2.5" y1="5.5" x2="10.5" y2="5.5" stroke="#99A1AF" strokeWidth="1.08333" />
  </svg>
);

const ICON_PIN = (
  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
    <path d="M6.5 11.5C6.5 11.5 10.5 8.5 10.5 5.5C10.5 3.291 8.709 1.5 6.5 1.5C4.291 1.5 2.5 3.291 2.5 5.5C2.5 8.5 6.5 11.5 6.5 11.5Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
    <circle cx="6.5" cy="5.5" r="1.5" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
  </svg>
);

const ICON_PHONE = (
  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
    <path d="M11.5 9.2V10.7C11.5 10.975 11.275 11.2 11 11.2H10.3C6.544 11.2 3.5 8.156 3.5 4.4V3.7C3.5 3.425 3.725 3.2 4 3.2H5.5C5.775 3.2 6 3.425 6 3.7V5.8C6 6.075 5.775 6.3 5.5 6.3H4.5C4.5 8.233 6.067 9.8 8 9.8V8.8C8 8.525 8.225 8.3 8.5 8.3H10.6C10.875 8.3 11.1 8.525 11.1 8.8V9.2H11.5Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
  </svg>
);

const ICON_CALENDAR = (
  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
    <rect x="2.5" y="3" width="8" height="7.5" rx="1" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
    <path d="M8.5 2V4" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
    <path d="M4.5 2V4" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
    <line x1="2.5" y1="5.5" x2="10.5" y2="5.5" stroke="#99A1AF" strokeWidth="1.08333" />
  </svg>
);

export default function Profile() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("RIDER");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedConfirm, setSavedConfirm] = useState("");

  const [authUser, setAuthUser] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoReference, setPhotoReference] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [campus, setCampus] = useState("");
  const [phone, setPhone] = useState("");
  const [enrollmentDate, setEnrollmentDate] = useState("");
  const [bio, setBio] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [role, setRole] = useState("rider");

  const [summary, setSummary] = useState({
    totalRides: 0,
    avgRating: 0,
    avgFare: 0,
    completedRides: 0,
  });

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

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, email, full_name, student_id, phone_number, role, university, is_verified, rating, rides_completed, created_at")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
      }

      const fallbackStudentId = metadata.student_id ?? `TEMP-${authData.user.id.slice(0, 8)}`;

      setFullName(profile?.full_name ?? metadata.full_name ?? "");
      setStudentId(profile?.student_id ?? fallbackStudentId);
      setPhone(profile?.phone_number ?? metadata.phone_number ?? "");
      setRole(profile?.role ?? metadata.role ?? "rider");
      setCampus(metadata.preferred_campus ?? profile?.university ?? "CIT-U");
      setDepartment(metadata.department ?? "Not specified");
      setBio(metadata.bio ?? "");
      setIsVerified(Boolean(profile?.is_verified));
      setEnrollmentDate(
        profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Unknown",
      );

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (accessToken) {
        const photoResponse = await fetch(`${API_BASE_URL}/api/users/${authData.user.id}/photo`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (photoResponse.ok) {
          const photoPayload = await photoResponse.json();
          if (photoPayload?.fileDataBase64 && photoPayload?.mimeType) {
            setPhotoPreview(`data:${photoPayload.mimeType};base64,${photoPayload.fileDataBase64}`);
            setPhotoReference(photoPayload.fileReference ?? "");
          }
        }
      }

      const filter = `driver_id.eq.${authData.user.id},rider_id.eq.${authData.user.id}`;

      const { count } = await supabase
        .from("rides")
        .select("id", { count: "exact", head: true })
        .or(filter);

      const { data: ridesData, error: ridesError } = await supabase
        .from("rides")
        .select("id,pickup,dropoff,fare,status,created_at")
        .or(filter)
        .order("created_at", { ascending: false })
        .limit(6);

      if (ridesError) {
        setError(ridesError.message);
      } else {
        const mapped = (ridesData ?? []).map((ride) => ({
          from: ride.pickup,
          to: ride.dropoff,
          date: ride.created_at ? new Date(ride.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase() : "N/A",
          fare: typeof ride.fare === "number" ? `₱${ride.fare}` : "N/A",
          status: ride.status ?? "UNKNOWN",
        }));

        setRecentRides(mapped);

        const completed = (ridesData ?? []).filter((ride) => ride.status === "COMPLETED");
        const fareValues = (ridesData ?? [])
          .map((ride) => (typeof ride.fare === "number" ? ride.fare : null))
          .filter((value) => value !== null);

        const avgFare = fareValues.length ? fareValues.reduce((sum, value) => sum + value, 0) / fareValues.length : 0;

        setSummary({
          totalRides: count ?? ridesData?.length ?? 0,
          avgRating: Number(profile?.rating ?? 0),
          avgFare,
          completedRides: completed.length,
        });
      }

      setLoading(false);
    };

    load();
  }, [navigate]);

  const initials = useMemo(
    () =>
      (fullName || "U")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    [fullName],
  );

  const handleSave = async () => {
    if (!authUser) return;
    setSaving(true);
    setError("");
    setSavedConfirm("");

    try {
      await saveUserProfile({
        id: authUser.id,
        email: authUser.email ?? "",
        full_name: fullName,
        student_id: studentId,
        phone_number: phone || null,
        university: campus || "CIT-U",
        role,
      });

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          ...(authUser.user_metadata ?? {}),
          full_name: fullName,
          student_id: studentId,
          phone_number: phone || null,
          preferred_campus: campus,
          department,
          bio,
          role,
        },
      });

      if (metadataError) throw metadataError;

      setSavedConfirm("PROFILE UPDATED ✓");
    } catch (saveError) {
      setError(saveError.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (event) => {
    if (!authUser) return;

    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) return;

    if (!["image/jpeg", "image/png"].includes(selectedFile.type)) {
      setError("Only JPG and PNG files are supported.");
      return;
    }

    setUploadingPhoto(true);
    setError("");
    setSavedConfirm("");

    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const fileDataBase64 = toBase64(fileBuffer);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("Not authenticated. Please sign in again.");
      }

      const response = await fetch(`${API_BASE_URL}/api/users/${authUser.id}/photo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          fileDataBase64,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Upload failed.");
      }

      setPhotoPreview(`data:${selectedFile.type};base64,${fileDataBase64}`);
      setPhotoReference(payload.fileReference ?? "");
      setSavedConfirm(payload.fileReference ? `PHOTO UPLOADED ✓ REF: ${payload.fileReference}` : "PHOTO UPLOADED ✓");
    } catch (uploadError) {
      setError(uploadError.message || "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!authUser) return;

    setUploadingPhoto(true);
    setError("");
    setSavedConfirm("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("Not authenticated. Please sign in again.");
      }

      const response = await fetch(`${API_BASE_URL}/api/users/${authUser.id}/photo`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to remove photo.");
      }

      setPhotoPreview("");
      setPhotoReference("");
      setSavedConfirm("PHOTO REMOVED ✓");
    } catch (removeError) {
      setError(removeError.message || "Failed to remove photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleExport = async () => {
    const payload = {
      fullName,
      studentId,
      department,
      campus,
      phone,
      enrollmentDate,
      bio,
      role,
      isVerified,
      summary,
      recentRides,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `profile-export-${(authUser?.id ?? "user").slice(0, 8)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
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
          <TerminalContainer title="USER PROFILE" subtitle="Loading profile..." maxWidth="740px">
            <div className="px-[40px] py-[32px] font-['Consolas:Regular',sans-serif] text-[10px] text-[#6a7282]">Fetching your profile and rides…</div>
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
        <TerminalContainer title="USER PROFILE" subtitle="Personal Information Management" maxWidth="740px">
        <div className="w-full">
          <div className="content-stretch flex h-[44px] items-start pb-px relative shrink-0 w-full">
            <div aria-hidden="true" className="absolute border-b border-black border-solid inset-0 pointer-events-none" />
            <Link to="/settings" className="flex-1 relative bg-white h-[43px] flex items-center justify-center hover:bg-[#f9f9f9] transition-colors"><p className="font-['Consolas:Bold',sans-serif] text-[10px] text-black text-center tracking-[1px] whitespace-nowrap">ACCOUNT</p></Link>
            <div className="flex-1 relative bg-black h-[43px] flex items-center justify-center"><p className="font-['Consolas:Bold',sans-serif] text-[10px] text-white text-center tracking-[1px] whitespace-nowrap">PROFILE</p></div>
            <Link to="/settings" className="flex-1 relative bg-white h-[43px] flex items-center justify-center hover:bg-[#f9f9f9] transition-colors"><p className="font-['Consolas:Bold',sans-serif] text-[10px] text-black text-center tracking-[1px] whitespace-nowrap">SECURITY</p></Link>
          </div>

          <div className="px-[40px] py-[32px] flex flex-col gap-[28px]">
            <div className="flex items-start gap-[20px] pb-[24px] border-b border-black">
              <div className="relative shrink-0">
                <div className="size-[72px] bg-black flex items-center justify-center relative shadow-[3px_3px_0px_0px_black] border-2 border-black overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <p className="font-['Consolas:Bold',sans-serif] text-[24px] text-white">{initials}</p>
                  )}
                </div>
                <div className={`absolute -bottom-[4px] -right-[4px] size-[14px] border-2 border-white ${isVerified ? "bg-[#00c950]" : "bg-[#f59e0b]"}`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-['Consolas:Bold',sans-serif] text-[20px] text-black tracking-[1px] mb-[6px]">{fullName.toUpperCase()}</p>
                <div className="flex flex-wrap items-center gap-[12px] mb-[8px]">
                  <div className="flex items-center gap-[6px]"><div className="bg-[#ffa500] size-[8px] rounded-full" /><p className="font-['Consolas:Medium',sans-serif] text-[9px] text-[#6a7282] tracking-[0.9px]">{role.toUpperCase()}</p></div>
                  <p className="font-['Consolas:Regular',sans-serif] text-[9px] text-[#6a7282] tracking-[0.45px]">ID: {studentId}</p>
                  <p className="font-['Consolas:Regular',sans-serif] text-[9px] text-[#6a7282] tracking-[0.45px]">{department}</p>
                </div>
                <p className="font-['Consolas:Regular',sans-serif] text-[9px] text-[#6a7282] tracking-[0.45px] leading-[15px]">{bio || "No bio set yet."}</p>
              </div>

              <div className="shrink-0 border border-black px-[10px] h-[24px] flex items-center gap-[6px]"><div className={`size-[6px] rounded-full ${isVerified ? "bg-[#00c950]" : "bg-[#f59e0b]"}`} /><p className="font-['Consolas:Medium',sans-serif] text-[8px] text-black tracking-[0.8px]">{isVerified ? "VERIFIED" : "PENDING"}</p></div>
            </div>

            <div className="flex items-center gap-[12px]">
              <input
                ref={photoInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className="hidden"
                onChange={handleUploadPhoto}
              />
              <div className="w-[220px]">
                <TerminalButton variant="secondary" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}>
                  {uploadingPhoto ? "UPDATING PHOTO..." : "UPDATE PHOTO"}
                </TerminalButton>
              </div>
              <div className="w-[220px]">
                <TerminalButton variant="secondary" onClick={handleRemovePhoto} disabled={uploadingPhoto || !photoPreview}>
                  {uploadingPhoto ? "REMOVING PHOTO..." : "REMOVE PHOTO"}
                </TerminalButton>
              </div>
              <p className="font-['Consolas:Regular',sans-serif] text-[8px] text-[#6a7282] tracking-[0.45px]">
                ACCEPTS .JPG / .PNG • MAX 5MB{photoReference ? ` • REF: ${photoReference}` : ""}
              </p>
            </div>

            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center gap-[12px] mb-[4px]"><p className="font-['Consolas:Bold',sans-serif] text-[11px] text-black tracking-[1.5px] whitespace-nowrap">ACTIVITY SUMMARY</p><div className="flex-1 h-px bg-black opacity-10" /></div>
              <div className="grid grid-cols-4 gap-[10px]">
                {[
                  { value: String(summary.totalRides), label: "TOTAL RIDES", sub: `${summary.completedRides} COMPLETED` },
                  { value: summary.avgRating.toFixed(1), label: "AVG RATING", sub: "FROM PROFILE" },
                  { value: `₱${summary.avgFare.toFixed(0)}`, label: "AVG FARE", sub: "PER RIDE" },
                  { value: String(summary.completedRides), label: "COMPLETED", sub: "LATEST ACTIVITY" },
                ].map((stat, i) => (
                  <div key={i} className="border border-black p-[14px]">
                    <p className="font-['Consolas:Bold',sans-serif] text-[22px] text-black mb-[4px] leading-none">{stat.value}</p>
                    <p className="font-['Consolas:Regular',sans-serif] text-[8px] text-[#6a7282] tracking-[0.8px] mb-[3px]">{stat.label}</p>
                    <p className="font-['Consolas:Regular',sans-serif] text-[7px] text-[#99a1af] tracking-[0.4px]">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-[16px]">
              <div className="flex items-center gap-[12px] mb-[4px]"><p className="font-['Consolas:Bold',sans-serif] text-[11px] text-black tracking-[1.5px] whitespace-nowrap">PERSONAL INFORMATION</p><div className="flex-1 h-px bg-black opacity-10" /></div>
              <div className="grid grid-cols-2 gap-[14px]"><TerminalInput label="FULL NAME" icon={ICON_USER} value={fullName} onChange={(e) => setFullName(e.target.value)} /><TerminalInput label="STUDENT ID" icon={ICON_ID} value={studentId} onChange={(e) => setStudentId(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-[14px]"><TerminalInput label="DEPARTMENT" icon={ICON_BUILDING} value={department} onChange={(e) => setDepartment(e.target.value)} /><TerminalInput label="PREFERRED CAMPUS" icon={ICON_PIN} value={campus} onChange={(e) => setCampus(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-[14px]"><TerminalInput label="CONTACT NUMBER" icon={ICON_PHONE} value={phone} onChange={(e) => setPhone(e.target.value)} /><TerminalInput label="ENROLLMENT DATE" icon={ICON_CALENDAR} value={enrollmentDate} onChange={(e) => setEnrollmentDate(e.target.value)} /></div>

              <div className="flex flex-col gap-[6px]">
                <p className="font-['Consolas:Medium',sans-serif] text-[9px] text-black tracking-[1.5px]">BIO / NOTE</p>
                <div className="border border-black">
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-transparent font-['Consolas:Regular',sans-serif] text-[11px] text-black tracking-[0.55px] px-[13px] py-[12px] outline-none resize-none placeholder:text-[#d1d5dc]" placeholder="Add a short note visible to drivers..." />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center gap-[12px] mb-[4px]"><p className="font-['Consolas:Bold',sans-serif] text-[11px] text-black tracking-[1.5px] whitespace-nowrap">RECENT RIDES</p><div className="flex-1 h-px bg-black opacity-10" /></div>

              <div className="border border-black">
                <div className="flex items-center px-[16px] py-[8px] bg-black gap-[12px]"><p className="flex-[2_0_0] font-['Consolas:Bold',sans-serif] text-[8px] text-white tracking-[1px]">ROUTE</p><p className="flex-[1_0_0] font-['Consolas:Bold',sans-serif] text-[8px] text-white tracking-[1px]">DATE</p><p className="w-[40px] font-['Consolas:Bold',sans-serif] text-[8px] text-white tracking-[1px]">FARE</p><p className="w-[80px] font-['Consolas:Bold',sans-serif] text-[8px] text-white tracking-[1px]">STATUS</p></div>
                {(recentRides.length ? recentRides : [{ from: "N/A", to: "No rides yet", date: "-", fare: "-", status: "NONE" }]).map((ride, i, arr) => (
                  <div key={i} className={`flex items-center px-[16px] py-[10px] gap-[12px] ${i < arr.length - 1 ? "border-b border-[#f3f4f6]" : ""}`}>
                    <div className="flex-[2_0_0] min-w-0"><p className="font-['Consolas:Medium',sans-serif] text-[9px] text-black tracking-[0.45px] truncate">{ride.from}<span className="text-[#99a1af] mx-[6px]">→</span>{ride.to}</p></div>
                    <p className="flex-[1_0_0] font-['Consolas:Regular',sans-serif] text-[8px] text-[#6a7282] tracking-[0.4px] whitespace-nowrap">{ride.date}</p>
                    <p className="w-[40px] font-['Consolas:Bold',sans-serif] text-[9px] text-black tracking-[0.45px]">{ride.fare}</p>
                    <div className="w-[80px] flex items-center gap-[4px]"><div className="bg-[#00c950] size-[5px] rounded-full shrink-0" /><p className="font-['Consolas:Regular',sans-serif] text-[8px] text-[#6a7282] tracking-[0.4px]">{ride.status}</p></div>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="border border-[#ef4444] bg-[#fef2f2] px-3 py-2 font-mono text-[9px] text-[#ef4444]">{error}</div>}
            {savedConfirm && <div className="border border-[#10b981] bg-[#f0fdf4] px-3 py-2 font-mono text-[9px] text-[#10b981]">{savedConfirm}</div>}

            <div className="flex gap-[12px] pt-[4px]">
              <div className="flex-1"><TerminalButton onClick={handleSave} disabled={saving}>{saving ? "SAVING..." : "SAVE PROFILE"}</TerminalButton></div>
              <div className="w-[180px]"><TerminalButton variant="secondary" onClick={handleExport}>EXPORT DATA</TerminalButton></div>
            </div>
          </div>

          <div className="bg-[#f9f9f9] h-[29px] relative shrink-0 w-full">
            <div aria-hidden="true" className="absolute border-black border-solid border-t inset-0 pointer-events-none" />
            <div className="flex items-center justify-between px-[24px] h-full">
              <div className="flex items-center gap-[16px]">
                <div className="flex items-center gap-[8px]"><div className={`rounded-full size-[8px] ${isVerified ? "bg-[#00c950]" : "bg-[#f59e0b]"}`} /><p className="font-['Consolas:Regular',sans-serif] text-[#6a7282] text-[8px] tracking-[0.8px] whitespace-nowrap">{isVerified ? "VERIFIED ACCOUNT" : "VERIFICATION PENDING"}</p></div>
                <p className="font-['Consolas:Regular',sans-serif] text-[#6a7282] text-[8px] tracking-[0.8px] whitespace-nowrap">MEMBER SINCE: {enrollmentDate.toUpperCase()}</p>
              </div>
              <p className="font-['Consolas:Regular',sans-serif] text-[#99a1af] text-[8px] tracking-[0.8px] whitespace-nowrap">USER ID: {(authUser?.id ?? "U").slice(0, 8)}</p>
            </div>
          </div>
        </div>
        </TerminalContainer>
      </div>
    </div>
  );
}
