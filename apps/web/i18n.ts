// PATH: apps/web/i18n.ts
// DESC: Configuración mínima de next-intl — idioma por defecto español, sin rutas i18n activas en esta fase

import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  const locale = 'es';
  return {
    locale,
    messages: {},
  };
});
