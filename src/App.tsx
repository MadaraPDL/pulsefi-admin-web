import PulseFiDesignPreviewApp from "./PulseFiDesignPreviewApp";
import RealApp from "./App.real";

const showDesignPreview = import.meta.env.MODE === "design";

export default function App() {
  if (showDesignPreview) {
    return <PulseFiDesignPreviewApp />;
  }

  return <RealApp />;
}
