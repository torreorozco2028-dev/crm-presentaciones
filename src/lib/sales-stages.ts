export const MAX_SALES_STAGES = 10;
const MAX_NAME_LENGTH = 50;

/** Etapas sugeridas al crear un edificio nuevo. */
export const DEFAULT_STAGE_NAMES = [
  'Preventa',
  'En construcción',
  'Obra terminada',
];

/** Las primeras versiones guardaban una clave en vez del nombre. */
const LEGACY_NAMES: Record<string, string> = {
  preventa: 'Preventa',
  construccion: 'En construcción',
  terminada: 'Obra terminada',
};

export interface SalesStageInput {
  stage_type: string;
  price: number | null;
  sold_percent: number | null;
  position: number;
  is_current: boolean;
}

interface StageRow {
  stage_type: string;
  price: number | null;
  sold_percent: number | null;
  position?: number | null;
  is_current: boolean;
}

export function stageName(stage: { stage_type: string }) {
  return LEGACY_NAMES[stage.stage_type] ?? stage.stage_type;
}

/** Etapas ordenadas tal como las definio el admin. */
export function sortStages<T extends StageRow>(
  stages: T[] | null | undefined
): T[] {
  return [...(stages ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );
}

export function getCurrentStage<T extends StageRow>(
  stages: T[] | null | undefined
): T | null {
  return stages?.find((s) => s.is_current) ?? null;
}

function parseOptionalInt(raw: unknown, label: string, max?: number) {
  const text = raw == null ? '' : String(raw).trim();
  if (!text) return null;
  const value = Number(text);
  if (!Number.isInteger(value) || value < 0 || (max != null && value > max)) {
    throw new Error(
      max != null
        ? `${label} debe ser un número entre 0 y ${max}`
        : `${label} debe ser un número entero positivo`
    );
  }
  return value;
}

/**
 * Lee las etapas del campo `stages` (JSON): [{ name, price, percent, current }].
 * Sin el campo devuelve null para no tocar las etapas guardadas.
 */
export function parseSalesStages(formData: FormData): SalesStageInput[] | null {
  const raw = formData.get('stages');
  if (typeof raw !== 'string') return null;

  let list: unknown;
  try {
    list = JSON.parse(raw);
  } catch {
    throw new Error('Las etapas no son válidas');
  }
  if (!Array.isArray(list)) throw new Error('Las etapas no son válidas');
  if (list.length > MAX_SALES_STAGES) {
    throw new Error(`Máximo ${MAX_SALES_STAGES} etapas`);
  }

  let currentFound = false;
  return list.map((item, position) => {
    const name = String(item?.name ?? '').trim();
    if (!name) throw new Error('Cada etapa necesita un nombre');
    if (name.length > MAX_NAME_LENGTH) {
      throw new Error(
        `El nombre de la etapa no puede pasar de ${MAX_NAME_LENGTH} caracteres`
      );
    }
    const isCurrent = item?.current === true && !currentFound;
    if (isCurrent) currentFound = true;

    return {
      stage_type: name,
      price: parseOptionalInt(item?.price, `El precio de "${name}"`),
      sold_percent: parseOptionalInt(
        item?.percent,
        `El porcentaje de "${name}"`,
        100
      ),
      position,
      is_current: isCurrent,
    };
  });
}
