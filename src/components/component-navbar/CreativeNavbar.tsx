'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from 'framer-motion';
import { FiMenu, FiX, FiChevronDown } from 'react-icons/fi';

const LOGO_SRC = '/logo1.png';

const BASE_NAV_LINKS = [
  {
    title: 'INICIO',
    href: '#inicio',
    dropdown: [
      { title: 'Introducción', href: '#introduccion' },
      { title: 'Ubicación', href: '#ubicacion' },
      { title: 'Proceso de construcción', href: '#proceso' },
    ],
  },
  { title: 'AREAS COMUNES', href: '#areas-comunes' },
  { title: 'DISTRIBUCION', href: '#distribucion' },
  { title: 'EQUIPO', href: '#equipo' },
];

export default function CreativeNavbar() {
  const params = useParams();
  const buildingId = params?.buildingId as string | undefined;
  const locale = params?.locale as string | undefined;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Construir NAV_LINKS dinámicamente
  const NAV_LINKS = BASE_NAV_LINKS.map((link) => {
    if (link.title === 'DISTRIBUCION') {
      return {
        ...link,
        dropdown: [
          {
            title: 'Departamentos',
            href: buildingId
              ? `/${locale}/presentations/${buildingId}/departamentos`
              : '#distribucion',
          },
          { title: 'Precio', href: '#precio' },
        ],
      };
    }
    return link;
  });
  const [isHidden, setIsHidden] = useState(false);
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = lastScrollY.current;
    if (latest > previous && latest > 100) {
      setIsHidden(true);
      setOpenDropdown(null);
    } else {
      setIsHidden(false);
    }
    lastScrollY.current = latest;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navbarVariants = {
    visible: { y: 0, opacity: 1 },
    hidden: { y: -100, opacity: 0 },
  };

  const dropdownVariants = {
    closed: { opacity: 0, y: -10, scale: 0.95, display: 'none' },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      display: 'block',
      transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
    },
  };

  const mobileMenuContainerVariants = {
    closed: { opacity: 0 },
    open: {
      opacity: 1,
      transition: { when: 'beforeChildren', staggerChildren: 0.1 },
    },
  };

  const mobileItemVariants = {
    closed: { opacity: 0, y: 50 },
    open: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100 },
    },
  };

  return (
    <>
      <motion.header
        variants={navbarVariants}
        animate={isHidden ? 'hidden' : 'visible'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='fixed left-0 right-0 top-4 z-50 flex justify-center px-4'
      >
        <div className='flex w-full max-w-6xl items-center justify-between rounded-full border border-white/20 bg-white/70 px-6 py-3 shadow-lg backdrop-blur-xl dark:border-zinc-800/50 dark:bg-black/60'>
          <Link
            href='/'
            className='relative flex h-10 w-auto items-center overflow-hidden rounded-full'
          >
            <Image
              src={LOGO_SRC}
              alt='Logo'
              width={120}
              height={40}
              className='h-full w-auto object-contain'
              priority
            />
          </Link>

          <nav className='hidden md:block'>
            <ul className='flex items-center gap-8 text-sm font-medium text-zinc-800 dark:text-zinc-200'>
              {NAV_LINKS.map((link) => (
                <li key={link.title} className='relative'>
                  {link.dropdown ? (
                    <div
                      ref={(el: any) => (dropdownRefs.current[link.title] = el)}
                      onBlur={() =>
                        setTimeout(() => {
                          const active = document.activeElement;
                          const el = dropdownRefs.current[link.title];
                          if (!el || !el.contains(active as Node)) {
                            if (openDropdown === link.title)
                              setOpenDropdown(null);
                          }
                        }, 150)
                      }
                      tabIndex={-1}
                    >
                      <button
                        onClick={() =>
                          setOpenDropdown((prev) =>
                            prev === link.title ? null : link.title
                          )
                        }
                        className='flex items-center gap-1 transition-colors hover:text-amber-500 focus:outline-none'
                      >
                        {link.title}
                        <motion.span
                          animate={{
                            rotate: openDropdown === link.title ? 180 : 0,
                          }}
                        >
                          <FiChevronDown />
                        </motion.span>
                      </button>

                      {/* Dropdown Menu */}
                      <motion.ul
                        initial='closed'
                        animate={
                          openDropdown === link.title ? 'open' : 'closed'
                        }
                        variants={dropdownVariants}
                        className='absolute left-0 mt-4 min-w-[220px] overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-2 shadow-xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/90'
                      >
                        {link.dropdown.map((subItem) => (
                          <li key={subItem.title}>
                            <Link
                              href={subItem.href}
                              className='block rounded-xl px-4 py-3 text-sm transition-colors hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-500'
                              onClick={() => setOpenDropdown(null)}
                            >
                              {subItem.title}
                            </Link>
                          </li>
                        ))}
                      </motion.ul>
                    </div>
                  ) : (
                    <Link
                      href={link.href}
                      className='transition-colors hover:text-amber-500'
                    >
                      {link.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className='md:hidden'>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className='rounded-full p-2 text-2xl text-zinc-800 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10'
            >
              <FiMenu />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial='closed'
            animate='open'
            exit='closed'
            variants={mobileMenuContainerVariants}
            className='fixed inset-0 z-[60] flex flex-col bg-black/95 text-white backdrop-blur-lg'
          >
            <div className='flex justify-end p-6'>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className='flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-lg font-medium uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-black'
              >
                Cerrar <FiX />
              </button>
            </div>

            <nav className='flex flex-grow flex-col justify-center px-10'>
              <ul className='flex flex-col gap-6'>
                {NAV_LINKS.map((link) => (
                  <motion.li key={link.title} variants={mobileItemVariants}>
                    {link.dropdown ? (
                      <div className='flex flex-col items-start'>
                        <span className='block text-5xl font-black uppercase tracking-tight text-[#4A678D] md:text-7xl'>
                          {link.title}
                        </span>
                        <ul className='mt-4 flex flex-col gap-3 border-l-2 border-[#4A678D]/30 pl-6'>
                          {link.dropdown.map((subItem) => (
                            <li key={subItem.title}>
                              <Link
                                href={subItem.href}
                                className='text-xl font-medium text-zinc-300 transition-colors hover:text-white'
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {subItem.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <Link
                        href={link.href}
                        className='block text-5xl font-black uppercase tracking-tight transition-colors hover:text-amber-500 md:text-7xl'
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.title}
                      </Link>
                    )}
                  </motion.li>
                ))}
              </ul>
            </nav>
            <motion.div
              variants={mobileItemVariants}
              className='p-10 text-zinc-400'
            >
              <p className='text-lg font-medium text-white'>Contacto</p>
              <p>info@structec.com</p>
              <p>+591 777 777 77</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
