import { createEmptyDoc, LIBRARY_CATEGORIES } from "@stageplot/shared";

export function App() {
  // M0 skeleton: proves the web app boots and the shared contract resolves.
  // The real editor replaces this in M1.
  const doc = createEmptyDoc();

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">StagePlot</span>
        <span className="muted">M0 skeleton — editor arrives in M1</span>
      </header>
      <main className="placeholder">
        <h1>{doc.meta.name}</h1>
        <p className="muted">
          Stage canvas: {doc.stage.width} × {doc.stage.height} ·{" "}
          {doc.meta.orientation}
        </p>
        <p>Library categories wired from @stageplot/shared:</p>
        <ul>
          {LIBRARY_CATEGORIES.map((category) => (
            <li key={category}>{category}</li>
          ))}
        </ul>
      </main>
    </div>
  );
}
