import { Fira_Code as FontMono, Inter as FontSans } from 'next/font/google';

export const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const fontMono = FontMono({
  subsets: ['latin'],
  variable: '--font-mono',
});

import { Lora, Dancing_Script, Cinzel_Decorative, Cormorant_Unicase, Metamorphous } from 'next/font/google';

export const poppins = Lora({
  subsets: ['latin'],
  weight: ['400','600','700'],
});

export const dancing = Dancing_Script({
  subsets: ['latin'],
  weight: ['400','700'],
});

//candidato1
export const inter = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['400'],
});

export const inter2 = Cormorant_Unicase({
  subsets: ['latin'],
  weight: ['400'],
});
export const inter3 = Metamorphous({
  subsets: ['latin'],
  weight: ['400'],
});

export const fonts = { poppins, dancing, inter, inter2, inter3 };
export default fonts;
