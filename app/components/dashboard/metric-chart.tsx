import type {
  ChartMetric,
  ChartRange,
  TrendPoint,
} from "../../../lib/demo-data";

const CHART_FRAME = {
  width: 640,
  height: 224,
  left: 49,
  right: 16,
  top: 18,
  bottom: 35,
};

function formatValue(value: number, metric: ChartMetric): string {
  return metric === "temperature"
    ? `${value.toFixed(1)} °C`
    : `${value.toFixed(1)} mm/s`;
}

function getDomain(values: readonly number[]): [number, number] {
  if (values.length === 0) return [0, 1];

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const padding = Math.max((maximum - minimum) * 0.34, 0.7);

  return [
    Math.floor((minimum - padding) * 2) / 2,
    Math.ceil((maximum + padding) * 2) / 2,
  ];
}

function getPath(points: readonly { x: number; y: number }[]): string {
  return points
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
}

export function MetricChart({
  title,
  metric,
  points,
  range,
  onRangeChange,
  seriesLabel = "Fleet average",
}: {
  title: string;
  metric: ChartMetric;
  points: readonly TrendPoint[];
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
  seriesLabel?: string;
}) {
  const plotWidth =
    CHART_FRAME.width - CHART_FRAME.left - CHART_FRAME.right;
  const plotHeight =
    CHART_FRAME.height - CHART_FRAME.top - CHART_FRAME.bottom;
  const [domainMin, domainMax] = getDomain(points.map(({ value }) => value));
  const coordinates = points.map((point, index) => ({
    ...point,
    x:
      CHART_FRAME.left +
      (index / Math.max(points.length - 1, 1)) * plotWidth,
    y:
      CHART_FRAME.top +
      ((domainMax - point.value) / (domainMax - domainMin)) * plotHeight,
  }));
  const linePath = getPath(coordinates);
  const baseline = CHART_FRAME.top + plotHeight;
  const areaPath = `${linePath} L ${coordinates.at(-1)?.x ?? CHART_FRAME.left} ${baseline} L ${coordinates[0]?.x ?? CHART_FRAME.left} ${baseline} Z`;
  const current = points.at(-1);
  const minimum = Math.min(...points.map(({ value }) => value));
  const maximum = Math.max(...points.map(({ value }) => value));
  const gradientId = `${metric}-trend-fill`;
  const axisValues = [domainMax, (domainMin + domainMax) / 2, domainMin];
  const tickIndices =
    range === "24h" ? [0, 6, 12, 18, points.length - 1] : [];
  const timeLabels =
    tickIndices.length > 0
      ? tickIndices.map((index) => points[index]?.label).filter(Boolean)
      : [points[0]?.label, points.at(-1)?.label].filter(Boolean);

  return (
    <section className="ui-card trend-card" aria-labelledby={`${metric}-title`}>
      <div className="trend-card-heading">
        <div>
          <div className="panel-kicker">
            <span className="simulated-dot" aria-hidden="true" />
            SIMULATED DATA
          </div>
          <h2 className="panel-title" id={`${metric}-title`}>
            {title}
          </h2>
        </div>
        <div className="range-controls" aria-label={`${title} time range`}>
          {(["6h", "24h", "7d"] as const).map((option) => (
            <button
              aria-pressed={range === option}
              className={`range-button${range === option ? " is-selected" : ""}`}
              key={option}
              onClick={() => onRangeChange(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="trend-current">
        <strong>{current ? formatValue(current.value, metric) : "—"}</strong>
        <span>latest illustrative sample</span>
      </div>

      {points.length > 0 ? (
        <figure className="trend-figure">
          <svg
            aria-label={`${title} simulated trend from ${formatValue(minimum, metric)} to ${formatValue(maximum, metric)}; latest sample ${current ? formatValue(current.value, metric) : "unavailable"}.`}
            className="trend-svg"
            preserveAspectRatio="none"
            role="img"
            viewBox={`0 0 ${CHART_FRAME.width} ${CHART_FRAME.height}`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.24" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {axisValues.map((value, index) => {
              const y = CHART_FRAME.top + (index / 2) * plotHeight;

              return (
                <g key={index}>
                  <line
                    className="chart-gridline"
                    x1={CHART_FRAME.left}
                    x2={CHART_FRAME.width - CHART_FRAME.right}
                    y1={y}
                    y2={y}
                  />
                  <text
                    className="chart-axis-label"
                    dominantBaseline="middle"
                    textAnchor="end"
                    x={CHART_FRAME.left - 10}
                    y={y}
                  >
                    {value.toFixed(metric === "temperature" ? 0 : 1)}
                  </text>
                </g>
              );
            })}
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path className="chart-line" d={linePath} />
            {coordinates.map((point, index) => (
              <circle
                className={`chart-point${index === coordinates.length - 1 ? " is-current" : ""}`}
                cx={point.x}
                cy={point.y}
                key={`${point.label}-${index}`}
                r={index === coordinates.length - 1 ? 4 : 2}
              />
            ))}
            {timeLabels.map((label, index) => {
              const x =
                CHART_FRAME.left +
                (index / Math.max(timeLabels.length - 1, 1)) * plotWidth;

              return (
                <text
                  className="chart-axis-label"
                  key={`${label}-${index}`}
                  textAnchor={
                    index === 0
                      ? "start"
                      : index === timeLabels.length - 1
                        ? "end"
                        : "middle"
                  }
                  x={x}
                  y={CHART_FRAME.height - 8}
                >
                  {label}
                </text>
              );
            })}
          </svg>
          <figcaption className="sr-only">
            Deterministic illustrative {title.toLowerCase()} samples; values
            are not live sensor measurements.
          </figcaption>
        </figure>
      ) : (
        <div className="chart-empty" role="status">
          No simulated samples are available for this view.
        </div>
      )}

      <div className="chart-legend">
        <span className={`chart-legend-swatch ${metric}`} aria-hidden="true" />
        <span>
          {seriesLabel}
        </span>
        <span className="chart-legend-unit">
          {metric === "temperature" ? "°C" : "mm/s RMS"}
        </span>
        <span className="chart-sample-count">
          {points.length} seeded samples
        </span>
      </div>
    </section>
  );
}
