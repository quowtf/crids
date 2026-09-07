/**
 * Definiciones de juegos (variantes de Concentration Grid) y sus generadores.
 *
 * Modelo comun: cada partida produce
 *   - cells: lo que se dibuja en la cuadricula (valor visible + si es distractor)
 *   - sequence: orden de objetivos a tocar, por valor visible
 * El motor solo compara: celda tocada === siguiente objetivo de la secuencia.
 */

export type GameId =
  | "L1" // busqueda 00 -> 99
  | "inverse" // 99 -> 00
  | "alternating" // 00,99,01,98...
  | "letters" // 00,A,01,B,02,C...
  | "distractors" // 00 -> 99 con distractores visuales
  | "no-sequence"; // objetivos aislados sin orden logico

export interface GameCell {
  /** Texto mostrado en la celda (ej. "07", "A"). */
  label: string;
  /** true si es un distractor que nunca es objetivo. */
  distractor?: boolean;
}

export interface GameRun {
  cells: GameCell[];
  /** Secuencia de labels objetivo, en orden. */
  sequence: string[];
}

export interface GameDef {
  id: GameId;
  name: string;
  description: string;
}

export const GAMES: GameDef[] = [
  {
    id: "L1",
    name: "Búsqueda 00 → 99",
    description: "Toca los números en orden ascendente.",
  },
  {
    id: "inverse",
    name: "Inverso 99 → 00",
    description: "Toca los números en orden descendente.",
  },
  {
    id: "alternating",
    name: "Alternante",
    description: "00 → 99 → 01 → 98 → 02 → 97 … alterna extremos.",
  },
  {
    id: "letters",
    name: "Número + letra",
    description: "00 → A → 01 → B → 02 → C … cambia de categoría.",
  },
  {
    id: "distractors",
    name: "Distractores",
    description: "00 → 99, pero hay estímulos parecidos que despistan.",
  },
  {
    id: "no-sequence",
    name: "Sin secuencia",
    description: "Aparece un objetivo aislado; encuéntralo y pasa al siguiente.",
  },
];

// ---- utilidades ----

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---- generadores por juego ----

/** 00..99 en celdas barajadas. */
function numberCells(): GameCell[] {
  const values = shuffle(Array.from({ length: 100 }, (_, i) => pad2(i)));
  return values.map((label) => ({ label }));
}

function genL1(): GameRun {
  return {
    cells: numberCells(),
    sequence: Array.from({ length: 100 }, (_, i) => pad2(i)),
  };
}

function genInverse(): GameRun {
  return {
    cells: numberCells(),
    sequence: Array.from({ length: 100 }, (_, i) => pad2(99 - i)),
  };
}

function genAlternating(): GameRun {
  const seq: string[] = [];
  let lo = 0;
  let hi = 99;
  let takeLow = true;
  while (lo <= hi) {
    if (takeLow) {
      seq.push(pad2(lo));
      lo++;
    } else {
      seq.push(pad2(hi));
      hi--;
    }
    takeLow = !takeLow;
  }
  return { cells: numberCells(), sequence: seq };
}

function genLetters(): GameRun {
  // 26 pares: 00..25 intercalados con A..Z.
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const nums = Array.from({ length: 26 }, (_, i) => pad2(i));
  const seq: string[] = [];
  for (let i = 0; i < 26; i++) {
    seq.push(nums[i]);
    seq.push(letters[i]);
  }
  // Celdas: los 26 numeros + 26 letras, barajados.
  const cells: GameCell[] = shuffle([...nums, ...letters]).map((label) => ({
    label,
  }));
  return { cells, sequence: seq };
}

function genDistractors(): GameRun {
  // Objetivos reales: 00..99 (los usamos todos como en L1).
  // Reservamos espacio para distractores reduciendo objetivos a 64 (8x8 mental)
  // para que quepan distractores sin pasar de 100 celdas.
  const targetCount = 64;
  const targets = Array.from({ length: targetCount }, (_, i) => pad2(i));

  // Distractores: variaciones visuales de numeros (invertidos, con letra parecida).
  const distractorPool: string[] = [];
  for (let i = 0; i < targetCount; i++) {
    const s = pad2(i);
    const rev = s[1] + s[0];
    if (rev !== s) distractorPool.push(rev); // 27 -> 72
  }
  // Añadir algunos con caracteres parecidos.
  ["2T", "5S", "1I", "0O", "8B", "6G", "4A", "9g"].forEach((d) =>
    distractorPool.push(d),
  );

  const distractorCount = 100 - targetCount;
  const distractors = shuffle(distractorPool).slice(0, distractorCount);

  const cells: GameCell[] = shuffle([
    ...targets.map((label) => ({ label })),
    ...distractors.map((label) => ({ label, distractor: true })),
  ]);

  return { cells, sequence: targets };
}

function genNoSequence(): GameRun {
  // 100 numeros; objetivos = 20 valores aleatorios distintos, en orden dado.
  const cells = numberCells();
  const all = cells.map((c) => c.label);
  const sequence = shuffle([...all]).slice(0, 20);
  return { cells, sequence };
}

export function generateGame(id: GameId): GameRun {
  switch (id) {
    case "L1":
      return genL1();
    case "inverse":
      return genInverse();
    case "alternating":
      return genAlternating();
    case "letters":
      return genLetters();
    case "distractors":
      return genDistractors();
    case "no-sequence":
      return genNoSequence();
  }
}
