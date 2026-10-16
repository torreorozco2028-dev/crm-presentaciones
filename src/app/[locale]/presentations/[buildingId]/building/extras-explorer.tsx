'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Layers,
  LayoutGrid,
  Maximize2,
  MessageCircle,
  Minus,
  MousePointerClick,
  Package,
  Plus,
  Ruler,
  RotateCcw,
  X,
} from 'lucide-react';
import Carousel from '@/components/carousel';
import { getPresentationGalleryImages } from '@/lib/presentation-gallery';
import { siteConfig } from '@/config/site';

type Kind = 'vaulera' | 'estacionamiento';
type Status = 'available' | 'few' | 'soldout' | 'info';
type Filter = 'all' | Kind;

interface ExtraModel {
  id: string;
  name_model_department: string | null;
  model_type: string;
  model_description: string | null;
  base_square_meters: number | null;
  id_plan: string | null;
  prymary_image: string | null;
  batch_images: unknown;
}

interface ExtraUnit {
  id: string;
  unit_number: string | null;
  floor: number;
  real_square_meters: number | string | null;
  state: number | null;
  modelId: string;
}

interface Item {
  model: ExtraModel;
  kind: Kind;
  name: string;
  zoneId: string;
  images: string[];
  units: ExtraUnit[];
  total: number;
  available: number;
  status: Status;
}

interface Props {
  models: ExtraModel[];
  units: ExtraUnit[];
  planImage?: string | null;
  buildingTitle?: string;
  isAuthenticated?: boolean;
}

const KIND_META: Record<
  Kind,
  { label: string; plural: string; icon: typeof Car }
> = {
  vaulera: { label: 'Vaulera', plural: 'Vauleras', icon: Package },
  estacionamiento: {
    label: 'Estacionamiento',
    plural: 'Estacionamientos',
    icon: Car,
  },
};

const STATUS_META: Record<
  Status,
  { label: string; dot: string; chip: string; bar: string }
> = {
  available: {
    label: 'Disponible',
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300',
    bar: 'bg-emerald-500',
  },
  few: {
    label: 'Últimas unidades',
    dot: 'bg-amber-500',
    chip: 'bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  soldout: {
    label: 'Agotado',
    dot: 'bg-rose-500',
    chip: 'bg-rose-500/10 text-rose-700 ring-rose-500/30 dark:text-rose-300',
    bar: 'bg-rose-500',
  },
  info: {
    label: 'Consultar',
    dot: 'bg-zinc-400',
    chip: 'bg-zinc-500/10 text-zinc-700 ring-zinc-500/30 dark:text-zinc-300',
    bar: 'bg-zinc-400',
  },
};

const UNIT_STATE_CLASS: Record<number, string> = {
  1: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-500 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:border-emerald-600',
  2: 'cursor-not-allowed border-amber-300 bg-amber-50 text-amber-700 opacity-80 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300',
  3: 'cursor-not-allowed border-rose-300 bg-rose-50 text-rose-700 opacity-70 line-through dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300',
};

const UNIT_STATE_LABEL: Record<number, string> = {
  1: 'Disponible',
  2: 'Reservado',
  3: 'Vendido',
};

const svgCache = new Map<string, string>();

/** Índice de la foto visible en el carrusel (su alt es "Imagen N de M"). */
function getActiveIndex(root: HTMLElement | null) {
  const alt = root?.querySelector('img.opacity-100')?.getAttribute('alt');
  const match = alt?.match(/Imagen (\d+) de/);
  return match ? Number(match[1]) - 1 : 0;
}
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Normaliza ids: ignora mayúsculas, espacios y los escapes que exporta Illustrator (_x31_). */
function normalizeZoneId(id: string) {
  return id
    .trim()
    .replace(/_x([0-9a-f]{2,4})_/gi, (_m, hex: string) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/[\s_-]+/g, '')
    .toLowerCase();
}

/** Un modelo puede apuntar a varias zonas: "A1, A2; A3". */
function splitZoneIds(raw: string) {
  return raw
    .split(/[,;\n]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

/** Busca la zona del SVG: id exacto y, si no existe, id equivalente normalizado. */
function findZone(host: HTMLElement, zoneId: string): SVGElement | null {
  if (!zoneId) return null;
  const exact = host.querySelector<SVGElement>(`[id="${CSS.escape(zoneId)}"]`);
  if (exact) return exact;
  const wanted = normalizeZoneId(zoneId);
  const all = Array.from(host.querySelectorAll<SVGElement>('svg [id]'));
  const same = (el: SVGElement) => normalizeZoneId(el.id) === wanted;
  // Illustrator duplica ids como "vaulera-1_1_": se acepta como respaldo.
  const loose = (el: SVGElement) =>
    normalizeZoneId(el.id.replace(/_\d+_$/, '')) === wanted;
  return all.find(same) ?? all.find(loose) ?? null;
}

/**
 * Superpone un aro (resalta hover/selección) y un punto de estado sobre la zona,
 * sin tocar el dibujo original del SVG (colores y animaciones propias).
 */
function addOverlay(zone: SVGGraphicsElement) {
  if (zone.querySelector(':scope > .extras-ring')) return;
  try {
    const box = zone.getBBox();
    if (!box.width || !box.height) return;
    const pad = Math.max(box.width, box.height) * 0.015;
    const ring = document.createElementNS(SVG_NS, 'rect');
    ring.setAttribute('class', 'extras-ring');
    ring.setAttribute('x', String(box.x - pad));
    ring.setAttribute('y', String(box.y - pad));
    ring.setAttribute('width', String(box.width + pad * 2));
    ring.setAttribute('height', String(box.height + pad * 2));
    ring.setAttribute('rx', String(Math.max(box.width, box.height) * 0.03));
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('class', 'extras-dot');
    dot.setAttribute('cx', String(box.x + box.width));
    dot.setAttribute('cy', String(box.y));
    dot.setAttribute('r', String(Math.max(box.width, box.height) * 0.055));
    zone.append(ring, dot);
  } catch {
    /* getBBox falla si el SVG aún no se pinta; se reintenta en el próximo render */
  }
}

function cleanSvg(text: string) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/<svg\b([^>]*)>/i, (_match, attrs: string) => {
      const hasViewBox = /\sviewBox\s*=/.test(attrs);
      const withoutPreserve = attrs.replace(
        /\spreserveAspectRatio\s*=\s*(['"]).*?\1/gi,
        ''
      );
      if (!hasViewBox) {
        return `<svg${withoutPreserve} preserveAspectRatio="xMidYMid meet">`;
      }
      const sized = withoutPreserve
        .replace(/\swidth\s*=\s*(['"]).*?\1/gi, '')
        .replace(/\sheight\s*=\s*(['"]).*?\1/gi, '');
      return `<svg${sized} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;
    })
    .replace(/@import[^;]*;/gi, '')
    .replace(
      /<text/g,
      '<text style="pointer-events: none; user-select: none;"'
    );
}

function getStatus(total: number, available: number): Status {
  if (total === 0) return 'info';
  if (available === 0) return 'soldout';
  return available / total <= 0.25 ? 'few' : 'available';
}

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!inView || reduceMotion) {
      node.textContent = String(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.1,
      ease: 'easeOut',
      onUpdate: (v) => {
        node.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, value, reduceMotion]);

  return <span ref={ref}>{value}</span>;
}

/* ------------------------------------------------------------------ */
/* Plano interactivo                                                   */
/* ------------------------------------------------------------------ */

function ExtrasPlan({
  planImage,
  items,
  visibleIds,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onLoadError,
}: {
  planImage: string;
  items: Item[];
  visibleIds: Set<string>;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onLoadError: () => void;
}) {
  const [svg, setSvg] = useState<string | null>(
    () => svgCache.get(planImage) ?? null
  );
  const [zoom, setZoom] = useState(1);
  const [limits, setLimits] = useState({ x: 0, y: 0 });
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(
    null
  );
  const frameRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const lastHovered = useRef<string | null>(null);
  const leaveTimer = useRef<number | null>(null);
  const [introActive, setIntroActive] = useState(true);
  const dragged = useRef(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const inView = useInView(frameRef, { once: true, amount: 0.3 });

  // Referencia estable: si el objeto cambia en cada render, React vuelve a
  // insertar el SVG completo y borra los atributos que se pusieron a las zonas.
  const ownStyle = useMemo(() => /<style/i.test(svg ?? ''), [svg]);
  const svgHtml = useMemo(() => ({ __html: svg ?? '' }), [svg]);
  const byId = useMemo(() => {
    const map = new Map<string, Item>();
    items.forEach((item) => map.set(item.model.id, item));
    return map;
  }, [items]);

  useEffect(() => {
    if (svgCache.has(planImage)) return;
    let cancelled = false;
    fetch(planImage)
      .then((res) => {
        if (!res.ok) throw new Error('svg');
        return res.text();
      })
      .then((text) => {
        const clean = cleanSvg(text);
        svgCache.set(planImage, clean);
        if (!cancelled) setSvg(clean);
      })
      .catch(() => {
        if (!cancelled) onLoadError();
      });
    return () => {
      cancelled = true;
    };
  }, [planImage, onLoadError]);

  // Marca cada zona del SVG con el estado de su modelo.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !svg) return;

    items.forEach((item, index) => {
      splitZoneIds(item.zoneId).forEach((zid) => {
        const el = findZone(host, zid);
        if (!el) return;
        el.setAttribute('data-extra', 'true');
        el.setAttribute('data-extra-id', item.model.id);
        el.setAttribute('data-status', item.status);
        el.setAttribute('data-kind', item.kind);
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', visibleIds.has(item.model.id) ? '0' : '-1');
        el.setAttribute(
          'aria-label',
          `${item.name}, ${STATUS_META[item.status].label}`
        );
        el.setAttribute(
          'data-dim',
          visibleIds.has(item.model.id) ? 'false' : 'true'
        );
        el.setAttribute(
          'data-selected',
          selectedId === item.model.id ? 'true' : 'false'
        );
        el.setAttribute(
          'data-hover',
          hoveredId === item.model.id ? 'true' : 'false'
        );
        el.style.setProperty('--d', `${index * 90}ms`);
        addOverlay(el as unknown as SVGGraphicsElement);
      });
    });
  }, [svg, items, visibleIds, selectedId, hoveredId]);

  // Límites de arrastre según el zoom.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    setLimits({
      x: ((zoom - 1) * frame.clientWidth) / 2,
      y: ((zoom - 1) * frame.clientHeight) / 2,
    });
    if (zoom === 1) {
      animate(x, 0, { duration: 0.3 });
      animate(y, 0, { duration: 0.3 });
    }
  }, [zoom, x, y]);

  const zoneFromEvent = (target: EventTarget | null) => {
    const el = (target as Element | null)?.closest?.('[data-extra-id]');
    const id = el?.getAttribute('data-extra-id');
    return id ? (byId.get(id) ?? null) : null;
  };

  const handleClick = (event: ReactMouseEvent) => {
    if (dragged.current) return;
    const item = zoneFromEvent(event.target);
    if (!item || !visibleIds.has(item.model.id)) return;
    onSelect(selectedId === item.model.id ? null : item.model.id);
  };

  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const item = zoneFromEvent(event.target);
    if (!item) return;
    event.preventDefault();
    onSelect(selectedId === item.model.id ? null : item.model.id);
  };

  const cancelLeave = () => {
    if (leaveTimer.current !== null) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  };

  // Salida con retardo: evita el parpadeo al cruzar huecos entre formas del SVG.
  const scheduleLeave = () => {
    if (leaveTimer.current !== null || lastHovered.current === null) return;
    leaveTimer.current = window.setTimeout(() => {
      leaveTimer.current = null;
      lastHovered.current = null;
      onHover(null);
      setTip(null);
    }, 90);
  };

  const handleMove = (event: ReactMouseEvent) => {
    const item = zoneFromEvent(event.target);
    const frame = frameRef.current;
    if (!item || !frame || !visibleIds.has(item.model.id)) {
      scheduleLeave();
      return;
    }
    cancelLeave();
    const rect = frame.getBoundingClientRect();
    setTip({
      id: item.model.id,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    if (lastHovered.current !== item.model.id) {
      lastHovered.current = item.model.id;
      onHover(item.model.id);
    }
  };

  const handleLeave = () => scheduleLeave();

  useEffect(() => () => cancelLeave(), []);

  // La animación de entrada solo corre una vez.
  useEffect(() => {
    if (!inView) return;
    const timer = window.setTimeout(() => setIntroActive(false), 2600);
    return () => window.clearTimeout(timer);
  }, [inView]);

  const tipItem = tip ? byId.get(tip.id) : null;
  const frameWidth = frameRef.current?.clientWidth ?? 0;

  return (
    <div className='relative'>
      <div
        ref={frameRef}
        className='extras-svg relative h-[52vh] min-h-[320px] w-full overflow-hidden rounded-[30px] border-[2px] border-zinc-100 bg-[#fcfcfc] shadow-xl dark:border-[#949494] dark:bg-transparent lg:h-[440px]'
      >
        {svg ? (
          <motion.div
            ref={hostRef}
            drag={zoom > 1}
            dragConstraints={{
              left: -limits.x,
              right: limits.x,
              top: -limits.y,
              bottom: limits.y,
            }}
            dragElastic={0.08}
            onDragStart={() => {
              dragged.current = true;
            }}
            onDragEnd={() => {
              window.setTimeout(() => {
                dragged.current = false;
              }, 60);
            }}
            animate={{ scale: zoom }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            style={{ x, y, touchAction: zoom > 1 ? 'none' : 'auto' }}
            data-own-style={ownStyle ? 'true' : 'false'}
            data-intro={
              inView && introActive && !reduceMotion ? 'true' : 'false'
            }
            className={`flex h-full w-full items-center justify-center p-3 pt-20 sm:p-6 sm:pt-6 ${
              zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            dangerouslySetInnerHTML={svgHtml}
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center'>
            <div className='h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-700 dark:border-t-white' />
          </div>
        )}

        {/* Leyenda */}
        <div className='pointer-events-none absolute left-4 top-4 flex flex-wrap gap-x-4 gap-y-1 rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 shadow-sm backdrop-blur-md dark:bg-black/60 dark:text-white/70'>
          {(['available', 'few', 'soldout'] as Status[]).map((status) => (
            <span key={status} className='flex items-center gap-1.5'>
              <span
                className={`h-2 w-2 rounded-full ${STATUS_META[status].dot}`}
              />
              {STATUS_META[status].label}
            </span>
          ))}
        </div>

        {/* Zoom */}
        <div className='absolute right-4 top-4 flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white/90 shadow-md backdrop-blur-md dark:border-white/15 dark:bg-black/60'>
          <button
            type='button'
            aria-label='Acercar plano'
            disabled={zoom >= 3}
            onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
            className='flex h-10 w-10 items-center justify-center text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-30 dark:text-white dark:hover:bg-white/10'
          >
            <Plus size={18} />
          </button>
          <button
            type='button'
            aria-label='Alejar plano'
            disabled={zoom <= 1}
            onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
            className='flex h-10 w-10 items-center justify-center border-t border-zinc-200 text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-30 dark:border-white/15 dark:text-white dark:hover:bg-white/10'
          >
            <Minus size={18} />
          </button>
          <button
            type='button'
            aria-label='Restablecer zoom'
            disabled={zoom === 1}
            onClick={() => setZoom(1)}
            className='flex h-10 w-10 items-center justify-center border-t border-zinc-200 text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-30 dark:border-white/15 dark:text-white dark:hover:bg-white/10'
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Pista inicial */}
        <AnimatePresence>
          {!selectedId && svg && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className='pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4'
            >
              <span className='flex items-center gap-2 rounded-full bg-zinc-900/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md dark:bg-white/90 dark:text-zinc-900'>
                <motion.span
                  animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className='flex'
                >
                  <MousePointerClick size={15} />
                </motion.span>
                Toca una zona del plano para ver sus detalles
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip */}
        <AnimatePresence>
          {tip && tipItem && (
            <motion.div
              key='tip'
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              style={{
                left: Math.min(Math.max(tip.x + 14, 8), frameWidth - 190),
                top: Math.max(tip.y - 64, 8),
              }}
              className='pointer-events-none absolute z-20 w-44 rounded-xl border border-zinc-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-md dark:border-white/15 dark:bg-zinc-900/95'
            >
              <p className='truncate text-xs font-black uppercase tracking-wide text-zinc-900 dark:text-white'>
                {tipItem.name}
              </p>
              <p className='mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-white/70'>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${STATUS_META[tipItem.status].dot}`}
                />
                {tipItem.total > 0
                  ? `${tipItem.available} de ${tipItem.total} disponibles`
                  : STATUS_META[tipItem.status].label}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .extras-svg svg {
          display: block;
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          overflow: visible;
        }
        /* Mismo look que el plano de departamentos: gris neutro, hover claro y
           zona seleccionada resaltada. Aplica a la zona y a sus formas internas. */
        .extras-svg [data-own-style='false'] [data-extra],
        .extras-svg
          [data-own-style='false']
          [data-extra]
          :is(path, rect, polygon, polyline, circle, ellipse) {
          fill: #908e8e;
          stroke: #000000;
          stroke-width: 1px;
          vector-effect: non-scaling-stroke;
          transition:
            fill 0.3s ease,
            stroke 0.3s ease;
        }
        :is(.dark) .extras-svg [data-own-style='false'] [data-extra],
        :is(.dark)
          .extras-svg
          [data-own-style='false']
          [data-extra]
          :is(path, rect, polygon, polyline, circle, ellipse) {
          fill: #6b6b6b;
          stroke: #bebdbd;
        }
        .extras-svg [data-own-style='false'] [data-extra][data-hover='true'],
        .extras-svg
          [data-own-style='false']
          [data-extra][data-hover='true']
          :is(path, rect, polygon, polyline, circle, ellipse) {
          fill: #ffffff;
          stroke: #111111;
          stroke-width: 2px;
        }
        .extras-svg [data-own-style='false'] [data-extra][data-selected='true'],
        .extras-svg
          [data-own-style='false']
          [data-extra][data-selected='true']
          :is(path, rect, polygon, polyline, circle, ellipse) {
          fill: #d4d4d4;
          stroke: #8a8a8a;
          stroke-width: 3px;
        }
        .extras-svg [data-extra] {
          --zf: #a1a1aa;
          --zs: #71717a;
          cursor: pointer;
          outline: none;
          transition: opacity 0.3s ease;
        }
        .extras-svg [data-extra][data-status='available'] {
          --zf: #22c55e;
          --zs: #16a34a;
        }
        .extras-svg [data-extra][data-status='few'] {
          --zf: #f59e0b;
          --zs: #d97706;
        }
        .extras-svg [data-extra][data-status='soldout'] {
          --zf: #ef4444;
          --zs: #dc2626;
        }
        /* Aro y punto de estado: se superponen al dibujo sin recolorearlo */
        .extras-svg .extras-ring {
          fill: var(--zf);
          fill-opacity: 0;
          stroke: var(--zs);
          stroke-width: 1.5px;
          stroke-opacity: 0.45;
          vector-effect: non-scaling-stroke;
          pointer-events: none;
          transition:
            fill-opacity 0.2s ease,
            stroke-opacity 0.2s ease,
            stroke-width 0.2s ease;
        }
        .extras-svg .extras-dot {
          fill: var(--zf);
          stroke: #ffffff;
          stroke-width: 1.5px;
          vector-effect: non-scaling-stroke;
          pointer-events: none;
        }
        .extras-svg [data-extra][data-hover='true'] > .extras-ring {
          fill-opacity: 0.03;
          stroke-opacity: 1;
          stroke-width: 2.5px;
        }
        .extras-svg [data-extra][data-selected='true'] > .extras-ring {
          fill-opacity: 0.06;
          stroke-opacity: 1;
          stroke-width: 3px;
          animation: extras-pulse 1.6s ease-in-out infinite;
        }
        .extras-svg [data-extra][data-dim='true'] {
          opacity: 0.18;
          pointer-events: none;
        }
        .extras-svg [data-extra]:focus-visible > .extras-ring {
          stroke: #2563eb;
          stroke-opacity: 1;
          stroke-width: 3px;
        }
        .extras-svg [data-intro='true'] [data-extra] {
          animation: extras-in 0.7s ease-out backwards;
          animation-delay: var(--d, 0ms);
        }
        @keyframes extras-pulse {
          0%,
          100% {
            stroke-opacity: 0.6;
          }
          50% {
            stroke-opacity: 1;
          }
        }
        @keyframes extras-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .extras-svg .extras-ring {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjetas de selección                                               */
/* ------------------------------------------------------------------ */

function ItemCard({
  item,
  selected,
  onSelect,
  onHover,
  index,
}: {
  item: Item;
  selected: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
  index: number;
}) {
  const Icon = KIND_META[item.kind].icon;
  const cover = item.images[0];
  const status = STATUS_META[item.status];

  return (
    <motion.button
      layout
      type='button'
      aria-pressed={selected}
      onClick={onSelect}
      onMouseEnter={() => onHover(item.model.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(item.model.id)}
      onBlur={() => onHover(null)}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: Math.min(index, 6) * 0.05, duration: 0.4 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative overflow-hidden rounded-2xl border-2 bg-white text-left shadow-md transition-colors dark:bg-white/5 ${
        selected
          ? 'border-zinc-900 dark:border-white'
          : 'border-zinc-200 hover:border-zinc-400 dark:border-white/10 dark:hover:border-white/40'
      }`}
    >
      <div className='relative aspect-[16/10] w-full bg-zinc-200 dark:bg-zinc-800'>
        {cover ? (
          <Image
            src={cover}
            alt={item.name}
            fill
            sizes='(max-width: 640px) 90vw, 33vw'
            className='object-cover transition duration-500 group-hover:scale-105'
          />
        ) : (
          <div className='flex h-full items-center justify-center text-zinc-400'>
            <Icon size={28} />
          </div>
        )}
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
        <span className='absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm'>
          <Icon size={11} />
          {KIND_META[item.kind].label}
        </span>
      </div>
      <div className='p-3'>
        <p className='truncate text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-white'>
          {item.name}
        </p>
        <p className='mt-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-white/60'>
          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
          {item.total > 0
            ? `${item.available} de ${item.total} disponibles`
            : status.label}
        </p>
      </div>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Visor de imágenes a pantalla completa                               */
/* ------------------------------------------------------------------ */

function Lightbox({
  images,
  startIndex,
  alt,
  onClose,
}: {
  images: string[];
  startIndex: number;
  alt: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const touchX = useRef<number | null>(null);
  const count = images.length;

  const move = useCallback(
    (step: number) => {
      setZoomed(false);
      setIndex((i) => (i + step + count) % count);
    },
    [count]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') move(-1);
      else if (e.key === 'ArrowRight') move(1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, move]);

  return createPortal(
    <motion.div
      role='dialog'
      aria-modal='true'
      aria-label={`${alt} - foto ${index + 1} de ${count}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className='fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-sm'
      onClick={onClose}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null || zoomed) return;
        const delta = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(delta) > 50) move(delta > 0 ? -1 : 1);
      }}
    >
      <div className='flex items-center justify-between px-4 py-3 text-white'>
        <span className='text-xs font-bold uppercase tracking-[0.2em] opacity-80'>
          {alt} · {index + 1}/{count}
        </span>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label='Cerrar visor'
          className='flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/25'
        >
          <X size={22} />
        </button>
      </div>

      <div
        className='relative min-h-0 flex-1'
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`absolute inset-0 overflow-hidden ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setOrigin(
              `${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`
            );
            setZoomed((z) => !z);
          }}
        >
          <Image
            key={images[index]}
            src={images[index]}
            alt={`${alt} - foto ${index + 1}`}
            fill
            sizes='100vw'
            priority
            draggable={false}
            className='object-contain transition-transform duration-300 ease-out'
            style={{
              transform: zoomed ? 'scale(2.2)' : 'scale(1)',
              transformOrigin: origin,
            }}
          />
        </div>

        {count > 1 && (
          <>
            <button
              type='button'
              onClick={() => move(-1)}
              aria-label='Foto anterior'
              className='absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25'
            >
              <ChevronLeft size={26} />
            </button>
            <button
              type='button'
              onClick={() => move(1)}
              aria-label='Foto siguiente'
              className='absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25'
            >
              <ChevronRight size={26} />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div
          className='flex justify-center gap-2 overflow-x-auto px-4 py-3'
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type='button'
              onClick={() => {
                setZoomed(false);
                setIndex(i);
              }}
              aria-label={`Ver foto ${i + 1}`}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === index
                  ? 'border-white'
                  : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              <Image
                src={src}
                alt=''
                fill
                sizes='80px'
                className='object-cover'
              />
            </button>
          ))}
        </div>
      )}
    </motion.div>,
    document.body
  );
}

/* ------------------------------------------------------------------ */
/* Panel de detalle                                                    */
/* ------------------------------------------------------------------ */

function DetailPanel({
  item,
  position,
  count,
  onClose,
  onStep,
  buildingTitle,
  isAuthenticated,
  locale,
}: {
  item: Item;
  position: number;
  count: number;
  onClose: () => void;
  onStep: (direction: -1 | 1) => void;
  buildingTitle?: string;
  isAuthenticated?: boolean;
  locale: string;
}) {
  const router = useRouter();
  const [unitId, setUnitId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const meta = KIND_META[item.kind];
  const status = STATUS_META[item.status];
  const Icon = meta.icon;

  const selectedUnit = item.units.find((u) => u.id === unitId) ?? null;
  const floors = Array.from(new Set(item.units.map((u) => u.floor))).sort(
    (a, b) => b - a
  );
  const percent = item.total > 0 ? (item.available / item.total) * 100 : 0;
  const area =
    item.model.base_square_meters ||
    (item.units[0]?.real_square_meters
      ? Number(item.units[0].real_square_meters)
      : null);

  const contact = () => {
    if (isAuthenticated && selectedUnit) {
      router.push(
        `/${locale}/admin/sales?reserveUnitId=${encodeURIComponent(selectedUnit.id)}`
      );
      return;
    }
    const target = selectedUnit
      ? `${meta.label.toLowerCase()} ${selectedUnit.unit_number ?? ''}`.trim()
      : `${meta.label.toLowerCase()} "${item.name}"`;
    const message = `Hola, me interesa ${target}${
      buildingTitle ? ` de ${buildingTitle}` : ''
    } y quisiera más información.`;
    window.open(
      `${siteConfig.contact.whatsapp}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const needsUnit = isAuthenticated && !selectedUnit;
  const ctaLabel = isAuthenticated
    ? selectedUnit
      ? `Reservar ${selectedUnit.unit_number ?? ''}`
      : 'Elige una unidad para reservar'
    : selectedUnit
      ? `Consultar por ${selectedUnit.unit_number ?? meta.label}`
      : 'Consultar con un asesor';

  return (
    <motion.div
      key={item.model.id}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className='overflow-hidden rounded-[30px] border-[2px] border-zinc-100 bg-[#fcfcfc] shadow-xl dark:border-[#949494] dark:bg-black'
    >
      <div
        ref={mediaRef}
        className={`relative ${item.images.length > 0 ? '[&_img]:cursor-zoom-in' : ''}`}
        onPointerDownCapture={(e) => {
          pointerStart.current = { x: e.clientX, y: e.clientY };
        }}
        onClick={(e) => {
          // Clic en la foto (no en flechas ni tras arrastrar) abre el visor.
          const start = pointerStart.current;
          const moved = start
            ? Math.hypot(e.clientX - start.x, e.clientY - start.y)
            : 0;
          if (
            (e.target as HTMLElement).tagName === 'IMG' &&
            moved < 6 &&
            item.images.length > 0
          ) {
            setLightboxIndex(getActiveIndex(mediaRef.current));
          }
        }}
      >
        <Carousel
          key={item.model.id}
          images={item.images}
          height='h-[240px] sm:h-[320px]'
          className='rounded-none'
        />
        {/* z-40: las imágenes del carrusel usan z-20 y z-30 */}
        <span className='pointer-events-none absolute left-4 top-4 z-40 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm'>
          <Icon size={13} />
          {meta.label}
        </span>
        <button
          type='button'
          onClick={onClose}
          aria-label='Cerrar detalle'
          className='absolute right-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80'
        >
          <X size={18} />
        </button>
        {item.images.length > 0 && (
          <button
            type='button'
            onClick={() => setLightboxIndex(getActiveIndex(mediaRef.current))}
            aria-label='Ampliar foto'
            className='absolute bottom-3 right-3 z-40 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm transition hover:bg-black/80'
          >
            <Maximize2 size={14} />
            Ampliar
          </button>
        )}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={item.images}
            startIndex={lightboxIndex}
            alt={item.name}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>

      <div className='space-y-5 p-5 sm:p-7'>
        <div className='flex items-center justify-between gap-3'>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ring-1 ${status.chip}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {count > 1 && (
            <div className='flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-white/60'>
              <button
                type='button'
                onClick={() => onStep(-1)}
                aria-label='Espacio anterior'
                className='flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 transition hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/10'
              >
                <ChevronLeft size={16} />
              </button>
              <span className='min-w-[3ch] text-center tabular-nums'>
                {position + 1}/{count}
              </span>
              <button
                type='button'
                onClick={() => onStep(1)}
                aria-label='Espacio siguiente'
                className='flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 transition hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-white/10'
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div>
          <h3 className='mi-fuente-2 bg-gradient-to-b from-zinc-800 to-zinc-500 bg-clip-text text-3xl font-black uppercase leading-tight tracking-tighter text-transparent dark:from-white dark:to-zinc-500 sm:text-4xl'>
            {item.name}
          </h3>
          {item.model.model_description && (
            <p className='mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-white/75 sm:text-base'>
              {item.model.model_description}
            </p>
          )}
        </div>

        {(area || floors.length > 0) && (
          <div className='flex flex-wrap gap-2'>
            {area ? (
              <span className='inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-white/15 dark:text-white/80'>
                <Ruler size={14} /> {area} m²
              </span>
            ) : null}
            {floors.length > 0 && (
              <span className='inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-white/15 dark:text-white/80'>
                <Layers size={14} />
                {floors.length === 1 ? 'Nivel' : 'Niveles'} {floors.join(', ')}
              </span>
            )}
          </div>
        )}

        {item.total > 0 && (
          <div>
            <div className='mb-2 flex items-end justify-between text-xs'>
              <span className='font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-white/60'>
                Disponibilidad
              </span>
              <span className='font-semibold tabular-nums text-zinc-800 dark:text-white'>
                {item.available} de {item.total}
              </span>
            </div>
            <div className='h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10'>
              <motion.div
                key={item.model.id}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className={`h-full rounded-full ${status.bar}`}
              />
            </div>
          </div>
        )}

        {item.units.length > 0 && (
          <div>
            <p className='mb-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-white/60'>
              {isAuthenticated ? 'Elige una unidad' : 'Unidades'}
            </p>
            <div className='grid max-h-44 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4'>
              {item.units.map((unit) => {
                const state = unit.state ?? 1;
                const isAvailable = state === 1;
                const isPicked = unit.id === unitId;
                return (
                  <button
                    key={unit.id}
                    type='button'
                    disabled={!isAvailable}
                    onClick={() => setUnitId(isPicked ? null : unit.id)}
                    title={`${UNIT_STATE_LABEL[state] ?? ''} · Nivel ${unit.floor}`}
                    className={`rounded-xl border-2 px-2 py-2 text-center font-mono text-xs font-black transition ${
                      isPicked
                        ? 'scale-[1.04] border-zinc-900 bg-zinc-900 text-white shadow-lg dark:border-white dark:bg-white dark:text-black'
                        : (UNIT_STATE_CLASS[state] ?? UNIT_STATE_CLASS[1])
                    }`}
                  >
                    {unit.unit_number ?? '—'}
                    <span className='mt-0.5 block text-[8px] font-semibold uppercase tracking-wider opacity-70'>
                      {UNIT_STATE_LABEL[state]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          type='button'
          onClick={contact}
          disabled={needsUnit || item.status === 'soldout'}
          className='group flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-lg transition hover:scale-[1.01] hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 dark:bg-white dark:text-black dark:hover:bg-zinc-200'
        >
          <MessageCircle size={18} />
          {item.status === 'soldout' ? 'Agotado' : ctaLabel}
        </button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Estado vacío                                                        */
/* ------------------------------------------------------------------ */

function EmptyPanel({
  hasPlan,
  availableTotal,
  onStart,
}: {
  hasPlan: boolean;
  availableTotal: number;
  onStart: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className='relative flex min-h-[380px] flex-col items-center justify-center overflow-hidden rounded-[30px] border-[2px] border-dashed border-zinc-300 bg-[#fcfcfc] p-8 text-center dark:border-white/20 dark:bg-transparent lg:h-[440px]'
    >
      <div className='relative mb-6 flex h-24 w-24 items-center justify-center'>
        <motion.div
          animate={
            reduceMotion ? undefined : { y: [0, -8, 0], rotate: [-4, 2, -4] }
          }
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className='absolute left-0 top-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-xl dark:bg-white dark:text-black'
        >
          <Car size={26} />
        </motion.div>
        <motion.div
          animate={
            reduceMotion ? undefined : { y: [0, 8, 0], rotate: [4, -2, 4] }
          }
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className='absolute bottom-0 right-0 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-zinc-900 bg-white text-zinc-900 shadow-xl dark:border-white dark:bg-black dark:text-white'
        >
          <Package size={26} />
        </motion.div>
      </div>

      <p className='text-5xl font-black tracking-tighter text-zinc-900 dark:text-white'>
        <AnimatedNumber value={availableTotal} />
      </p>
      <p className='mt-1 text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500 dark:text-white/60'>
        espacios disponibles
      </p>
      <p className='mx-auto mt-5 max-w-xs text-sm leading-relaxed text-zinc-600 dark:text-white/70'>
        {hasPlan
          ? 'Explora el plano y selecciona una zona para conocer sus fotos, medidas y disponibilidad.'
          : 'Selecciona un espacio para conocer sus fotos, medidas y disponibilidad.'}
      </p>
      <button
        type='button'
        onClick={onStart}
        className='mt-6 rounded-full border border-zinc-900 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-zinc-900 transition hover:bg-zinc-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black'
      >
        Ver el primero
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Sección principal                                                   */
/* ------------------------------------------------------------------ */

export default function ExtrasExplorer({
  models,
  units,
  planImage,
  buildingTitle,
  isAuthenticated,
}: Props) {
  const params = useParams<{ locale?: string }>();
  const locale =
    typeof params?.locale === 'string'
      ? params.locale
      : Array.isArray(params?.locale)
        ? params.locale[0]
        : 'es';

  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [planFailed, setPlanFailed] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const items = useMemo<Item[]>(
    () =>
      (models ?? [])
        .filter(
          (m) =>
            m.model_type === 'vaulera' || m.model_type === 'estacionamiento'
        )
        .map((model) => {
          const modelUnits = (units ?? [])
            .filter((u) => u.modelId === model.id)
            .sort(
              (a, b) =>
                b.floor - a.floor ||
                (a.unit_number ?? '').localeCompare(b.unit_number ?? '', 'es', {
                  numeric: true,
                })
            );
          const available = modelUnits.filter((u) => u.state === 1).length;
          const kind = model.model_type as Kind;
          return {
            model,
            kind,
            name: model.name_model_department || KIND_META[kind].label,
            zoneId: (model.id_plan ?? '').trim(),
            images: getPresentationGalleryImages(
              {
                prymary_image: model.prymary_image ?? undefined,
                batch_images: model.batch_images,
              },
              null
            ),
            units: modelUnits,
            total: modelUnits.length,
            available,
            status: getStatus(modelUnits.length, available),
          };
        }),
    [models, units]
  );

  const kindsPresent = useMemo(
    () =>
      (['vaulera', 'estacionamiento'] as Kind[]).filter((kind) =>
        items.some((item) => item.kind === kind)
      ),
    [items]
  );

  const visible = useMemo(
    () => items.filter((item) => filter === 'all' || item.kind === filter),
    [items, filter]
  );
  const visibleIds = useMemo(
    () => new Set(visible.map((item) => item.model.id)),
    [visible]
  );

  const selected = visible.find((item) => item.model.id === selectedId) ?? null;
  const selectedIndex = selected ? visible.indexOf(selected) : -1;

  const hasPlan = !!planImage && !planFailed;
  const handlePlanError = useCallback(() => setPlanFailed(true), []);

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (id && window.innerWidth < 1024) {
        window.setTimeout(
          () =>
            detailRef.current?.scrollIntoView({
              behavior: reduceMotion ? 'auto' : 'smooth',
              block: 'start',
            }),
          80
        );
      }
    },
    [reduceMotion]
  );

  const step = useCallback(
    (direction: -1 | 1) => {
      if (visible.length === 0) return;
      const next =
        (selectedIndex + direction + visible.length) % visible.length;
      setSelectedId(visible[next].model.id);
    },
    [visible, selectedIndex]
  );

  const changeFilter = (next: Filter) => {
    setFilter(next);
    setSelectedId((current) => {
      if (!current) return current;
      const item = items.find((i) => i.model.id === current);
      return item && (next === 'all' || item.kind === next) ? current : null;
    });
  };

  const availableOf = (kind: Filter) =>
    items
      .filter((item) => kind === 'all' || item.kind === kind)
      .reduce((sum, item) => sum + item.available, 0);

  if (items.length === 0) return null;

  const tabs: { key: Filter; label: string; icon: typeof Car }[] = [
    { key: 'all', label: 'Todos', icon: LayoutGrid },
    ...kindsPresent.map((kind) => ({
      key: kind as Filter,
      label: KIND_META[kind].plural,
      icon: KIND_META[kind].icon,
    })),
  ];

  return (
    <section
      id='vauleras-estacionamientos'
      className='relative flex min-h-screen flex-col items-center overflow-hidden bg-[#ffffff] p-4 py-16 dark:bg-black lg:p-10 lg:py-20'
    >
      <div className='pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-zinc-100/80 to-transparent dark:from-white/[0.04]' />

      <div className='relative mb-8 flex flex-col items-center text-center'>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='mb-2 text-xs font-bold uppercase tracking-[0.5em] text-zinc-500 dark:text-zinc-400'
        >
          Completa tu hogar
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08, duration: 0.5 }}
          className='mi-fuente-2 bg-gradient-to-b from-zinc-800 to-zinc-500 bg-clip-text text-4xl font-black uppercase tracking-tighter text-transparent dark:from-white dark:to-zinc-500 md:text-5xl lg:text-6xl'
        >
          {kindsPresent.length === 1
            ? KIND_META[kindsPresent[0]].plural
            : 'Vauleras y Estacionamientos'}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className='mt-4 max-w-xl text-sm text-zinc-600 dark:text-white/65 sm:text-base'
        >
          Resguarda tu vehículo y tus pertenencias en espacios seguros, dentro
          del mismo edificio.
        </motion.p>
      </div>

      {tabs.length > 2 && (
        <div
          role='tablist'
          aria-label='Filtrar por tipo'
          className='relative mb-8 flex w-full max-w-xl items-stretch gap-1 rounded-full border border-zinc-200 bg-white/80 p-1 shadow-md backdrop-blur-md dark:border-white/15 dark:bg-white/5'
        >
          {tabs.map((tab) => {
            const active = filter === tab.key;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                role='tab'
                aria-selected={active}
                type='button'
                onClick={() => changeFilter(tab.key)}
                className={`relative flex-1 rounded-full px-3 py-2.5 text-center transition-colors ${
                  active
                    ? 'text-white dark:text-black'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId='extras-tab-pill'
                    transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                    className='absolute inset-0 rounded-full bg-zinc-900 dark:bg-white'
                  />
                )}
                <span className='relative flex flex-col items-center gap-0.5 sm:flex-row sm:justify-center sm:gap-2'>
                  <TabIcon size={15} />
                  <span className='whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.14em]'>
                    {tab.label}
                  </span>
                  <span className='whitespace-nowrap text-[10px] font-medium opacity-70'>
                    <AnimatedNumber value={availableOf(tab.key)} /> disp.
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className='relative grid w-full max-w-[1700px] gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start'>
        <div className='order-1 min-w-0 space-y-6 lg:order-2'>
          {hasPlan && (
            <ExtrasPlan
              planImage={planImage as string}
              items={items.filter((i) => i.zoneId)}
              visibleIds={visibleIds}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={select}
              onHover={setHoveredId}
              onLoadError={handlePlanError}
            />
          )}

          {!hasPlan && (
            <div>
              <p className='mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 dark:text-white/55'>
                Elige un espacio
              </p>
              <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                {visible.map((item, index) => (
                  <ItemCard
                    key={item.model.id}
                    item={item}
                    index={index}
                    selected={item.model.id === selectedId}
                    onSelect={() =>
                      select(
                        item.model.id === selectedId ? null : item.model.id
                      )
                    }
                    onHover={setHoveredId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          ref={detailRef}
          className='order-2 scroll-mt-24 lg:sticky lg:top-24 lg:order-1'
        >
          <AnimatePresence mode='wait'>
            {selected ? (
              <DetailPanel
                key={selected.model.id}
                item={selected}
                position={selectedIndex}
                count={visible.length}
                onClose={() => setSelectedId(null)}
                onStep={step}
                buildingTitle={buildingTitle}
                isAuthenticated={isAuthenticated}
                locale={locale}
              />
            ) : (
              <EmptyPanel
                key='empty'
                hasPlan={hasPlan}
                availableTotal={availableOf(filter)}
                onStart={() => select(visible[0]?.model.id ?? null)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
