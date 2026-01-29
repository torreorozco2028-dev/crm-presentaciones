import { getTranslations } from 'next-intl/server';
import {
  Button,
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
} from '@react-email/components';
import * as React from 'react';

interface InviteUserProps {
  confirmLink?: string;
}

export default async function InviteUser({ confirmLink }: InviteUserProps) {
  const t = await getTranslations('Email.invite');

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
        <Container
          style={{
            maxWidth: '600px',
            margin: 'auto',
            padding: '20px',
            border: '1px solid #eaeaea',
            borderRadius: '10px',
          }}
        >
          <Section>
            <Text
              style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}
            >
              {t('welcome')}
            </Text>
            <Text>{t('invited')}</Text>
            <Text style={{ fontSize: '16px' }}>{t('clickBelow')}</Text>
          </Section>

          <Section style={{ textAlign: 'center', margin: '20px 0' }}>
            <Button
              href={confirmLink}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                color: '#fff',
                backgroundColor: '#007bff',
                borderRadius: '5px',
                textDecoration: 'none',
              }}
            >
              {t('startRegistration')}
            </Button>
          </Section>

          <Section>
            <Text>{t('buttonNotWorking')}</Text>
            <Text style={{ wordWrap: 'break-word' }}>
              <Link href={confirmLink} style={{ color: '#007bff' }}>
                {confirmLink}
              </Link>
            </Text>
            <Text>
              {t('thankYou')}
              <br />
              {t('team')}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
