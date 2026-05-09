import { useNavigate } from "react-router";
import imgLogo from "../../../assets/logo.png";

const PAGE_COPY = {
  terms: {
    eyebrow: "TERMS",
    title: "Uni-Lift Terms of Use",
    intro: "Use Uni-Lift only for campus mobility, safety coordination, and approved university transport workflows.",
    sections: [
      ["Account responsibility", "Keep your account details accurate and do not share access with other students or drivers."],
      ["Ride conduct", "Riders and drivers must follow campus rules, agreed fares, safety instructions, and lawful transport practices."],
      ["Driver verification", "Driver access can be approved, rejected, suspended, or revoked by administrators when verification or safety requirements are not met."],
      ["Platform actions", "Admins may suspend accounts, force-end rides, review SOS alerts, and retain operational logs to keep the service safe."],
    ],
  },
  privacy: {
    eyebrow: "PRIVACY",
    title: "Privacy Notice",
    intro: "Uni-Lift stores only the data needed to authenticate users, match rides, support safety workflows, and audit incidents.",
    sections: [
      ["Data collected", "Account profile, student ID, role, vehicle details, driver documents, ride routes, ratings, messages, and SOS alert metadata may be processed."],
      ["Location use", "Ride coordinates and live driver location are used for matching, route display, trip progress, and emergency response."],
      ["Access controls", "Operational data is limited by user role, admin workflows, and Supabase security policies configured for the project."],
      ["Support requests", "When you contact support, include only information needed to investigate the issue."],
    ],
  },
  support: {
    eyebrow: "SUPPORT",
    title: "Support",
    intro: "For account, verification, ride, or safety issues, contact the Uni-Lift administrator or campus mobility office.",
    sections: [
      ["Urgent safety issue", "Use the in-app SOS flow during an active ride, then follow campus emergency procedures."],
      ["Driver verification", "Prepare your license, plate or vehicle file, full address, college, course, plate number, and license number before applying."],
      ["Account help", "Use Reset Key on the login page for password recovery, or ask an admin to review account status."],
      ["Recommended details", "Include your Uni-Lift email, ride ID if available, screenshots, and a short description of what happened."],
    ],
  },
};

export function LegalPage({ type = "terms" }) {
  const navigate = useNavigate();
  const copy = PAGE_COPY[type] ?? PAGE_COPY.terms;

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col">
      <header className="h-[52px] border-b border-white/[0.08] flex items-center justify-between px-4">
        <button onClick={() => navigate("/")} className="h-8 w-[134px]">
          <img src={imgLogo} alt="Uni-Lift" className="h-full w-full object-contain object-left" />
        </button>
        <button
          onClick={() => navigate("/")}
          className="border border-white/20 px-3 py-1 text-[9px] tracking-[0.8px] text-white/70 hover:text-white hover:border-white/50"
        >
          BACK TO LOGIN
        </button>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-[9px] tracking-[3px] text-[#6a7282]">{copy.eyebrow}</p>
          <h1 className="mt-3 text-[28px] font-bold tracking-[0.5px]">{copy.title}</h1>
          <p className="mt-4 text-[11px] leading-6 text-white/60">{copy.intro}</p>

          <div className="mt-8 border border-white/10">
            {copy.sections.map(([title, body]) => (
              <section key={title} className="border-b border-white/10 p-4 last:border-b-0">
                <h2 className="text-[10px] tracking-[1.2px] text-white">{title.toUpperCase()}</h2>
                <p className="mt-2 text-[10px] leading-5 text-white/55">{body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
