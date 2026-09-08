import TransferChart from "@/components/TransferChart";
import {
  gridTransferSeries,
  sartTransferSeries,
  hasAnyData,
  type SartRow,
} from "@/lib/transfer";
import { MEASUREMENT_GRID_TESTS } from "@/lib/measurements";
import type { GridResult } from "@/lib/types";

/**
 * Panel de transferencia: evolución de cada prueba a través de las mediciones
 * (M0 = línea base). Solo dibuja las gráficas que tengan datos.
 */
export default function TransferPanel({
  grids,
  sartRows,
}: {
  grids: GridResult[];
  sartRows: SartRow[];
}) {
  const sartSeries = sartTransferSeries(sartRows);
  const sartHasData = hasAnyData(sartSeries, [
    "omissions",
    "commissions",
    "rt",
  ]);

  const gridSeries = MEASUREMENT_GRID_TESTS.map((t) => ({
    test: t,
    series: gridTransferSeries(grids, t.test),
  }));
  const anyGrid = gridSeries.some((g) =>
    hasAnyData(g.series, ["seconds", "errors"]),
  );

  if (!anyGrid && !sartHasData) {
    return (
      <p className="text-sm text-neutral-500">
        Aún no hay datos de mediciones. Completa la línea base y las mediciones
        para ver tu evolución.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-neutral-500">
        Cada punto es una medición. M0 es tu línea base. Menos tiempo y menos
        errores/omisiones = mejor. Recuerda: pocas mediciones = mucho ruido.
      </p>

      {gridSeries.map(
        ({ test, series }) =>
          hasAnyData(series, ["seconds", "errors"]) && (
            <div key={test.test}>
              <h3 className="mb-1 text-sm font-medium">{test.name}</h3>
              <TransferChart
                data={series}
                lines={[
                  { dataKey: "seconds", name: "Tiempo (s)", color: "#0ea5e9" },
                  { dataKey: "errors", name: "Errores", color: "#ef4444" },
                ]}
              />
            </div>
          ),
      )}

      {sartHasData && (
        <div>
          <h3 className="mb-1 text-sm font-medium">
            Prueba D — atención sostenida
          </h3>
          <TransferChart
            data={sartSeries}
            lines={[
              { dataKey: "omissions", name: "Omisiones", color: "#f59e0b" },
              { dataKey: "commissions", name: "Comisiones", color: "#ef4444" },
              { dataKey: "rt", name: "RT (ms)", color: "#0ea5e9" },
            ]}
          />
        </div>
      )}
    </div>
  );
}
