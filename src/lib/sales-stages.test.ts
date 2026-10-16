import { describe, expect, it } from 'vitest';
import {
  getCurrentStage,
  parseSalesStages,
  sortStages,
  stageName,
} from './sales-stages';

const form = (stages: unknown) => {
  const data = new FormData();
  data.append(
    'stages',
    typeof stages === 'string' ? stages : JSON.stringify(stages)
  );
  return data;
};

describe('parseSalesStages', () => {
  it('lee nombre, precio, porcentaje, orden y etapa actual', () => {
    expect(
      parseSalesStages(
        form([
          { name: ' Preventa ', price: '1100', percent: '70', current: true },
          { name: 'Fase 2', price: '', percent: '', current: false },
        ])
      )
    ).toEqual([
      {
        stage_type: 'Preventa',
        price: 1100,
        sold_percent: 70,
        position: 0,
        is_current: true,
      },
      {
        stage_type: 'Fase 2',
        price: null,
        sold_percent: null,
        position: 1,
        is_current: false,
      },
    ]);
  });

  it('devuelve null si no viene el campo y [] si se borraron todas', () => {
    expect(parseSalesStages(new FormData())).toBeNull();
    expect(parseSalesStages(form([]))).toEqual([]);
  });

  it('solo deja una etapa actual', () => {
    const stages = parseSalesStages(
      form([
        { name: 'A', current: true },
        { name: 'B', current: true },
      ])
    )!;
    expect(stages.map((s) => s.is_current)).toEqual([true, false]);
  });

  it('rechaza datos invalidos', () => {
    expect(() => parseSalesStages(form('no json'))).toThrow();
    expect(() => parseSalesStages(form({ a: 1 }))).toThrow();
    expect(() => parseSalesStages(form([{ name: '  ' }]))).toThrow();
    expect(() =>
      parseSalesStages(form([{ name: 'A', percent: '101' }]))
    ).toThrow();
    expect(() =>
      parseSalesStages(form([{ name: 'A', price: '-5' }]))
    ).toThrow();
    expect(() => parseSalesStages(form([{ name: 'x'.repeat(51) }]))).toThrow();
    expect(() =>
      parseSalesStages(form(Array.from({ length: 11 }, () => ({ name: 'A' }))))
    ).toThrow();
  });
});

describe('helpers', () => {
  const a = {
    stage_type: 'preventa',
    price: 1,
    sold_percent: 1,
    position: 1,
    is_current: false,
  };
  const b = { ...a, stage_type: 'Fase 2', position: 0, is_current: true };

  it('getCurrentStage devuelve la etapa marcada o null', () => {
    expect(getCurrentStage([a, b])).toBe(b);
    expect(getCurrentStage([a])).toBeNull();
    expect(getCurrentStage(undefined)).toBeNull();
  });

  it('sortStages ordena por posicion', () => {
    expect(sortStages([a, b])).toEqual([b, a]);
  });

  it('stageName traduce las claves antiguas', () => {
    expect(stageName(a)).toBe('Preventa');
    expect(stageName(b)).toBe('Fase 2');
  });
});
