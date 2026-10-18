"use client";

import type { MetricSeries } from "@/lib/mock-data";

type LineChartProps = {
  series: MetricSeries;
  height?: number;
  showGrid?: boolean;
  showPoints?: boolean;
  showLegend?: boolean;
  color?: string;
};

function getPath(points: Array<{ timestamp: string; value: number }>, width: number, height: number): string {
  if (points.length === 0) return "";

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max === min ? 1 : max - min;
  const padding = 20;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const d = points
    .map((point, index) => {
      const x = padding + (index / Math.max(points.length - 1, 1)) * plotWidth;
      const y =
        padding +
        plotHeight -
        ((point.value - min) / range) * plotHeight;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  return d;
}

export function LineChart({
  series,
  height = 160,
  showGrid = true,
  showPoints = true,
  showLegend = true,
  color = "var(--accent)",
}: LineChartProps) {
  const width = 100;
  const points = series.data;
  const pathD = getPath(points, width, height);

  const values = points.map((p) => p.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const current = points[points.length - 1]?.value ?? 0;
  const first = points[0]?.value ?? 0;
  const change = ((current - first) / Math.max(first, 0.01)) * 100;

  return (
    <div className="trend-card">
      <div className="trend-card-heading">
        <div>
          <div className="panel-kicker">{series.unit}</div>
          <div className="section-title">{series.trend.toUpperCase()} TREND</div>
        </div>
        <div className="range-controls">
          <button className="range-button is-selected" type="button">
            1H
          </button>
          <button className="range-button" type="button">
            6H
          </button>
          <button className="range-button" type="button">
            24H
          </button>
        </div>
      </div>

      <div className="trend-current">
        <strong>{current.toFixed(1)}<small> {series.unit}</small></strong>
        <span>
          {change >= 0 ? "+" : ""}{change.toFixed(1)}%
        </span>
      </div>

      <div className="trend-figure">
        <svg
          className="trend-svg"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          xmlns="http://www.w3.org/2000/svg"
          aria-label={`${series.unit} trend chart`}
          role="img"
        >
          {showGrid && (
            <>
              <line
                className="chart-gridline"
                x1={20}
                y1={height / 2}
                x2={width - 20}
                y2={height / 2}
              />
              <line
                className="chart-gridline"
                x1={20}
                y1={height * 0.25}
                x2={width - 20}
                y2={height * 0.25}
              />
              <line
                className="chart-gridline"
                x1={20}
                y1={height * 0.75}
                x2={width - 20}
                y2={height * 0.75}
              />
            </>
          )}
          <path className="chart-line" d={pathD} stroke={color} />
          {showPoints &&
            points.map((p, i) => (
              <circle
                key={i}
                className={`chart-point${
                  i === points.length - 1 ? " is-current" : ""
                }`}
                cx={20 + (i / Math.max(points.length - 1, 1)) * (width - 40)}
                cy={
                  height / 2 +
                  ((p.value - (min + max) / 2) /
                    Math.max(max - min, 0.01)) *
                    (height / 2 - 10)
                }
                r={3}
              />
            ))}
        </svg>
      </div>

      {showLegend && (
        <div className="chart-legend">
          <span className="chart-legend-swatch" />
          <span className="chart-legend-unit">{series.unit}</span>
          <span className="chart-sample-count">{points.length} samples</span>
        </div>
      )}
    </div>
  );
}
