// PATH: apps/api/src/prisma/seed.ts
// DESC: Seed inicial — 6 divisas (USD, EUR, GBP, CLP, BRL, ARS), tasas de cambio y usuario admin

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CURRENCIES = [
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$', flagEmoji: '🇺🇸', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', flagEmoji: '🇪🇺', decimals: 2 },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£', flagEmoji: '🇬🇧', decimals: 2 },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$', flagEmoji: '🇨🇱', decimals: 0 },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$', flagEmoji: '🇧🇷', decimals: 2 },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$', flagEmoji: '🇦🇷', decimals: 2 },
];

// Pares de tasas: [from, to, buyRate, sellRate]
// Buy = la casa compra la divisa base (cliente vende), Sell = la casa vende (cliente compra)
const RATE_PAIRS: [string, string, number, number][] = [
  ['USD', 'CLP', 930.0, 940.0],
  ['EUR', 'CLP', 1010.0, 1025.0],
  ['GBP', 'CLP', 1180.0, 1195.0],
  ['USD', 'EUR', 0.92, 0.935],
  ['USD', 'GBP', 0.785, 0.795],
  ['EUR', 'USD', 1.085, 1.095],
  ['BRL', 'CLP', 180.0, 185.0],
  ['USD', 'BRL', 5.1, 5.18],
  ['ARS', 'CLP', 0.95, 1.02],
  ['USD', 'ARS', 890.0, 910.0],
];

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear divisas
  const currencyMap: Record<string, string> = {};
  for (const currency of CURRENCIES) {
    const created = await prisma.currency.upsert({
      where: { code: currency.code },
      update: {},
      create: currency,
    });
    currencyMap[currency.code] = created.id;
    console.log(`  ✓ Divisa: ${currency.code} — ${currency.name}`);
  }

  // Crear usuario admin
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@moreexchange.cl';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin1234!';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
      firstName: 'Admin',
      lastName: 'More Exchange',
      isActive: true,
    },
  });
  console.log(`  ✓ Admin creado: ${admin.email}`);

  // Crear tasas de cambio
  for (const [fromCode, toCode, buyRate, sellRate] of RATE_PAIRS) {
    const fromId = currencyMap[fromCode];
    const toId = currencyMap[toCode];
    if (!fromId || !toId) continue;

    const spread = parseFloat(((sellRate - buyRate) / sellRate).toFixed(4));

    const rate = await prisma.exchangeRate.upsert({
      where: { fromCurrencyId_toCurrencyId: { fromCurrencyId: fromId, toCurrencyId: toId } },
      update: { buyRate, sellRate, spread },
      create: {
        fromCurrencyId: fromId,
        toCurrencyId: toId,
        buyRate,
        sellRate,
        spread,
        updatedById: admin.id,
      },
    });

    // Registrar en historial
    await prisma.rateHistory.create({
      data: {
        exchangeRateId: rate.id,
        buyRate,
        sellRate,
        changedById: admin.id,
      },
    });

    console.log(`  ✓ Tasa: ${fromCode}/${toCode} — compra ${buyRate} / venta ${sellRate}`);
  }

  console.log('\n✅ Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
