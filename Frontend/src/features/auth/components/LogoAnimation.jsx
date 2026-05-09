import "./LogoAnimation.css";
import imgLogo from "../../../assets/logo.png";

/**
 * AnimatedLogo
 *
 * Animation sequence:
 *  1. [State 1] The UL logo icon pops into view.
 *  2. [State 2] After a hold, the wrapper shifts left (flex layout pulls icon left as text appears).
 *  3. [State 3] "ni-Lift" text fades in and slides in from the right.
 *
 * Props:
 *  @param {string}  iconHeight  - Controls the PNG icon height. Default: "36px"
 *  @param {string}  className   - Extra classes on the outer wrapper.
 *  @param {number}  opacity     - Wrapper opacity. Default: 1
 */
export function AnimatedLogo({ iconHeight = "36px", className = "", opacity = 1, textColor = "#ffffff" }) {
  return (
    <div
      className={`logo-anim-wrapper ${className}`}
      style={{ opacity }}
    >
      {/* ── Phase 1 & 2: The UL monogram PNG ─────────────────────────────── */}
      <div className="logo-anim-icon" style={{ height: iconHeight }}>
        <img
          src={imgLogo}
          alt=""
          aria-hidden="true"
          className="logo-anim-img"
          style={{ height: "100%", width: "auto", display: "block" }}
        />
      </div>

      {/* ── Phase 3: "ni-Lift" text reveal ──────────────────────────────── */}
      <span
        className="logo-anim-text"
        style={{
          fontFamily: "'Space Mono', ui-monospace, monospace",
          fontSize: `calc(${iconHeight} * 0.42)`,
          fontWeight: 700,
          letterSpacing: "0.04em",
          color: textColor,
          lineHeight: 1,
        }}
        aria-label="Uni-Lift"
      >
        ni-Lift
      </span>
    </div>
  );
}
