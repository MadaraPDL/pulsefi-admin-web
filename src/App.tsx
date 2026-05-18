import { lazy, Suspense } from "react";
import RealApp from "./App.real";

const PulseFiDesignPreviewApp =
  import.meta.env.MODE === "design"
    ? lazy(() => import("./PulseFiDesignPreviewApp"))
    : null;

export default function App() {
  if (PulseFiDesignPreviewApp) {
    return (
      <Suspense fallback={null}>
        <PulseFiDesignPreviewApp />
      </Suspense>
    );
  }

  return <RealApp />;
}
