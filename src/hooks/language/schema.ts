import { z } from 'zod';

export const enum SupportedLanguages {
  EN_EN = 'en-EN',
  FR_FR = 'fr-FR',
  KR_KR = 'ko-KR'
}

export const languageSchema = z.enum([
  SupportedLanguages.EN_EN,
  SupportedLanguages.FR_FR,
  SupportedLanguages.KR_KR,
]);

export type Language = z.infer<typeof languageSchema>;
