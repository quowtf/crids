/**
 * Modo visual del grid.
 * - normal: tamaño y separación cómodos.
 * - load: carga visual (bases.md L2): números algo más pequeños, menor
 *   separación, contraste ligeramente menor. NO se reduce hasta volverlo
 *   una prueba de agudeza visual — el objetivo es atención, no la vista.
 */
export type VisualMode = "normal" | "load";

export interface VisualStyle {
  /** clases tailwind para el gap del grid */
  gap: string;
  /** clamp de tamaño de fuente de la celda */
  fontClamp: string;
  /** opacidad del texto de la celda (contraste) */
  textOpacity: string;
}

export const VISUAL_STYLES: Record<VisualMode, VisualStyle> = {
  normal: {
    gap: "gap-1.5 sm:gap-2",
    fontClamp: "text-[clamp(0.7rem,3.2vw,1.15rem)]",
    textOpacity: "opacity-100",
  },
  load: {
    // Menos separación y letra algo menor, contraste levemente reducido.
    gap: "gap-0.5 sm:gap-1",
    fontClamp: "text-[clamp(0.6rem,2.6vw,0.95rem)]",
    textOpacity: "opacity-80",
  },
};

export const VISUAL_LABELS: Record<VisualMode, string> = {
  normal: "Normal",
  load: "Carga visual",
};
