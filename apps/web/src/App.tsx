import { useEffect } from "react";
import { Editor } from "./editor/components/Editor";
import { useAuthStore } from "./auth/store";

export function App() {
  // Resolve the session once; the toolbar shows the result.
  useEffect(() => {
    void useAuthStore.getState().refresh();
  }, []);

  return <Editor />;
}
