import { getLocale, getTranslations } from 'next-intl/server';
import { Resend } from 'resend';
import InviteUser from '@/emails/invite-user';
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendInvitationEmail = async (email: string, token: string) => {
  try {
    const locale: string = await getLocale();

    const t = await getTranslations('Email');

    const subject = t('invite.subject');

    const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/register?token=${token}`;

    const response = await resend.emails.send({
      from: 'noreply@structec.com.bo',
      to: email,
      subject,
      react: <InviteUser confirmLink={confirmLink} />,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
