"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ChartPoint {
  label: string; // ej. sesion #1
  seconds: number;
  errors: number;
}

export default function HistoryChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Aún no hay datos para graficar.
      </p>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="label" fontSize={12} />
          <YAxis
            yAxisId="left"
            fontSize={12}
            label={{ value: "seg", angle: -90, position: "insideLeft", fontSize: 12 }}
          />
          <YAxis yAxisId="right" orientation="right" fontSize={12} allowDecimals={false} />
          <Tooltip
            formatter={(value, name) =>
              name === "seconds"
                ? [`${value}s`, "Tiempo"]
                : [`${value}`, "Errores"]
            }
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="seconds"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="seconds"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="errors"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="errors"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
