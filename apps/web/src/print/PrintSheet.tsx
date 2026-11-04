import type { ChannelRow, ShapeItem, StageDoc } from "@stageplot/shared";
import { getLibraryItem } from "../editor/library";
import { routeCable } from "../editor/routing";

/**
 * The read-only rider: stage plot, input list, monitor outputs and footer.
 * Rendered identically on screen, in the browser's print dialog and by the
 * headless PDF renderer — one layout source for all three.
 */
export function PrintSheet({ doc }: { doc: StageDoc }) {
  const portrait = doc.meta.orientation === "portrait";

  // Give the stage as much room as the lists can spare: short riders get a big
  // plot, longer ones shrink it so they still fit one page before flowing over.
  const rowCount = doc.channels.length + doc.outputs.length;
  const stageHeight = portrait
    ? Math.max(80, 130 - rowCount * 4)
    : Math.max(60, 100 - rowCount * 4);

  return (
    <article className={`print-sheet ${portrait ? "portrait" : "landscape"}`}>
      <style>{`@page { size: A4 ${portrait ? "portrait" : "landscape"}; margin: 10mm; }`}</style>

      <header className="print-head">
        <div>
          <h1>{doc.meta.name || "Untitled rider"}</h1>
          <p className="print-kicker">Stage plot &amp; technical rider</p>
        </div>
        <div className="print-meta">
          <span>{doc.channels.length} inputs</span>
          <span>{doc.outputs.length} monitors</span>
          <span>{portrait ? "Portrait" : "Landscape"} A4</span>
        </div>
      </header>

      <div className="print-stage" style={{ height: `${stageHeight}mm` }}>
        <StageSvg doc={doc} />
      </div>

      <section className="print-block">
        <h2>Input list</h2>
        {doc.channels.length === 0 ? (
          <p className="print-empty">No inputs listed.</p>
        ) : (
          <table className="print-table">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Instrument</th>
                <th>Person</th>
                <th>Input</th>
                <th>Microphone</th>
                <th>Monitor</th>
                <th>DCA / Sub</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {doc.channels.map((row) => (
                <tr key={row.id}>
                  <td className="num">{row.number}</td>
                  <td>{row.source}</td>
                  <td>{row.person}</td>
                  <td>{row.inputType}</td>
                  <td>{row.mic}</td>
                  <td>{row.monitor}</td>
                  <td>{row.dca}</td>
                  <td>{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="print-block">
        <h2>Monitors / outputs</h2>
        {doc.outputs.length === 0 ? (
          <p className="print-empty">No monitors listed.</p>
        ) : (
          <table className="print-table narrow">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Monitor</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {doc.outputs.map((row: ChannelRow) => (
                <tr key={row.id}>
                  <td className="num">{row.number}</td>
                  <td>{row.source}</td>
                  <td>{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer className="print-foot">
        {doc.footer.text ? <p>{doc.footer.text}</p> : null}
        <p className="print-sign">Made with StagePlot</p>
      </footer>
    </article>
  );
}

/** The plot on its own, so the thumbnail can reuse the exact print artwork. */
export function StageSvg({ doc }: { doc: StageDoc }) {
  const { width, height } = doc.stage;
  const ink = "#111827";
  const obstacles = [
    ...doc.items.map((i) => ({ x: i.x, y: i.y, w: i.w, h: i.h })),
    ...doc.shapes.map((s) => ({ x: s.x, y: s.y, w: s.w, h: s.h })),
  ];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="print-stage-svg"
      role="img"
      aria-label="Stage plot"
    >
      <rect x={0} y={0} width={width} height={height} fill="#ffffff" stroke={ink} strokeWidth={2} />

      {doc.stage.background && (
        <image
          href={doc.stage.background}
          x={0}
          y={0}
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid meet"
          opacity={doc.stage.backgroundOpacity ?? 1}
        />
      )}

      {doc.shapes.map((shape) => (
        <PrintShape key={shape.id} shape={shape} />
      ))}

      {doc.cables.map((cable) => {
        const pts = routeCable(cable.anchors, obstacles, width, height);
        return (
          <g key={cable.id}>
            <polyline
              points={pts.join(" ")}
              fill="none"
              stroke={cable.color}
              strokeWidth={4}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {Array.from({ length: cable.anchors.length / 2 }).map((_, i) => (
              <circle
                key={i}
                cx={cable.anchors[i * 2]}
                cy={cable.anchors[i * 2 + 1]}
                r={3.5}
                fill={cable.color}
              />
            ))}
          </g>
        );
      })}

      {doc.items.map((item) => {
        const lib = getLibraryItem(item.itemKey);
        if (!lib) return null;
        const { Icon } = lib;
        const cx = item.x + item.w / 2;
        const cy = item.y + item.h / 2;
        return (
          <g
            key={item.id}
            transform={`translate(${cx} ${cy}) rotate(${item.rotation}) scale(${
              item.flipX ? -1 : 1
            } ${item.flipY ? -1 : 1})`}
          >
            <svg
              x={-item.w / 2}
              y={-item.h / 2}
              width={item.w}
              height={item.h}
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
              color={ink}
              overflow="visible"
            >
              <Icon />
            </svg>
          </g>
        );
      })}

      {doc.items.map((item) =>
        item.label ? (
          <text
            key={`label-${item.id}`}
            x={item.x + item.w / 2}
            y={item.y + item.h + 13}
            textAnchor="middle"
            fontSize={11}
            fill="#374151"
          >
            {item.label}
          </text>
        ) : null,
      )}

      {doc.texts.map((text) => (
        <text
          key={text.id}
          x={text.x}
          y={text.y + text.fontSize}
          fontSize={text.fontSize}
          fill={ink}
          transform={`rotate(${text.rotation} ${text.x} ${text.y + text.fontSize / 2})`}
        >
          {text.text}
        </text>
      ))}
    </svg>
  );
}

function PrintShape({ shape }: { shape: ShapeItem }) {
  const ink = "#111827";
  const fill = shape.fill ? "rgba(17,24,39,0.08)" : "none";
  const common = { fill, stroke: ink, strokeWidth: 2 } as const;
  const rotate = `rotate(${shape.rotation} ${shape.x + shape.w / 2} ${shape.y + shape.h / 2})`;

  if (shape.kind === "rect") {
    return (
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.w}
        height={shape.h}
        transform={rotate}
        {...common}
      />
    );
  }
  if (shape.kind === "ellipse") {
    return (
      <ellipse
        cx={shape.x + shape.w / 2}
        cy={shape.y + shape.h / 2}
        rx={shape.w / 2}
        ry={shape.h / 2}
        transform={rotate}
        {...common}
      />
    );
  }
  const points = shape.points ?? [];
  const poly: string[] = [];
  for (let i = 0; i < points.length; i += 2) {
    poly.push(`${shape.x + points[i] * shape.w},${shape.y + points[i + 1] * shape.h}`);
  }
  return <polygon points={poly.join(" ")} transform={rotate} {...common} />;
}
