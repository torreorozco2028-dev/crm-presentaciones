export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: 'Structec',
  description: 'A CRM for construction companies',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://structec.vercel.app',
  navItems: [],
  navMenuItems: [],
  links: {},
  contact: {
    email: 'contacto@structec.com',
    whatsapp: 'https://wa.me/59100000000',
  },
};
