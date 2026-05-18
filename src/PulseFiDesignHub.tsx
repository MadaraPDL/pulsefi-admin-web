import { useState } from "react";
import PulseFiWhiteDesignPreview from "./PulseFiWhiteDesignPreview";
import PulseFiPlatformAdminWhitePreview from "./PulseFiPlatformAdminWhitePreview";
import PulseFiAppUserWhitePreview from "./PulseFiAppUserWhitePreview";
import PulseFiAuthWhitePreview from "./PulseFiAuthWhitePreview";
import PulseFiStatesPreview from "./PulseFiStatesPreview";
import "./pulsefi-white-design.css";

type PreviewMode = "isp" | "platform" | "app" | "auth" | "states";
type PreviewTheme = "light" | "dark";

export default function PulseFiDesignHub() {
  const [mode, setMode] = useState<PreviewMode>("isp");
  const [theme, setTheme] = useState<PreviewTheme>("light");

  return (
    <div className="pf-hub" data-pf-theme={theme}>
      <div className="pf-preview-switch">
        <div>
          <strong>PulseFi UI preview</strong>
          <span>Design only. No backend connection yet.</span>
        </div>

        <div className="pf-preview-controls">
          <div className="pf-preview-tabs">
            <button
              type="button"
              className={mode === "isp" ? "active" : ""}
              onClick={() => setMode("isp")}
            >
              ISP Admin
            </button>

            <button
              type="button"
              className={mode === "platform" ? "active" : ""}
              onClick={() => setMode("platform")}
            >
              Platform Admin
            </button>

            <button
              type="button"
              className={mode === "app" ? "active" : ""}
              onClick={() => setMode("app")}
            >
              App User
            </button>

            <button
              type="button"
              className={mode === "auth" ? "active" : ""}
              onClick={() => setMode("auth")}
            >
              Auth
            </button>

            <button
              type="button"
              className={mode === "states" ? "active" : ""}
              onClick={() => setMode("states")}
            >
              States
            </button>
          </div>

          <div className="pf-theme-tabs">
            <button
              type="button"
              className={theme === "light" ? "active" : ""}
              onClick={() => setTheme("light")}
            >
              White
            </button>

            <button
              type="button"
              className={theme === "dark" ? "active" : ""}
              onClick={() => setTheme("dark")}
            >
              Black
            </button>
          </div>
        </div>
      </div>

      {mode === "isp" ? <PulseFiWhiteDesignPreview /> : null}
      {mode === "platform" ? <PulseFiPlatformAdminWhitePreview /> : null}
      {mode === "app" ? <PulseFiAppUserWhitePreview /> : null}
      {mode === "auth" ? <PulseFiAuthWhitePreview /> : null}
      {mode === "states" ? <PulseFiStatesPreview /> : null}
    </div>
  );
}
