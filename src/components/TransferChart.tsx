"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface SeriesLine {
  dataKey: string;
  name: string;
  color: string;
}

interface Props {
  data: object[];
  lines: SeriesLine[];
  height?: number;
}

/** Gráfica de líneas para series de transferencia (eje X = medición). */
export default function TransferChart({ data, lines, height = 220 }: Props) {
  return (
    <div style={{ height, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--cell-border)" />
          <XAxis dataKey="label" fontSize={12} stroke="var(--cell-text)" />
          <YAxis fontSize={12} stroke="var(--cell-text)" allowDecimals />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--cell-bg)",
              border: "1px solid var(--cell-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {lines.map((l) => (
            <Line
              key={l.dataKey}
              type="monotone"
              dataKey={l.dataKey}
              name={l.name}
              stroke={l.color}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
