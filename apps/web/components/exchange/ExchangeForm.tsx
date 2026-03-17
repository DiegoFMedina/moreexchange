// PATH: apps/web/components/exchange/ExchangeForm.tsx
// DESC: Formulario completo de orden de cambio con React Hook Form + Zod y creación de PaymentIntent

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRates } from '@/hooks/useRates';
import { useCreateOrder } from '@/hooks/useExchange';

const schema = z.object({
  fromCurrencyId: z.string().min(1, 'Selecciona divisa de origen'),
  toCurrencyId: z.string().min(1, 'Selecciona divisa de destino'),
  fromAmount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  paymentMethod: z.enum(['card', 'transfer']),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ExchangeForm() {
  const { data: rates } = useRates();
  const createOrder = useCreateOrder();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'card' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await createOrder.mutateAsync(data);
      console.log('Orden creada:', result);
    } catch (err) {
      console.error('Error al crear orden:', err);
    }
  };

  const currencies = rates
    ? Array.from(
        new Map(
          [...rates.map((r) => r.fromCurrency), ...rates.map((r) => r.toCurrency)].map((c) => [
            c.code,
            c,
          ]),
        ).values(),
      )
    : [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-text-secondary mb-2 font-sans">
            Divisa origen
          </label>
          <select
            {...register('fromCurrencyId')}
            className="w-full bg-[#111629] border border-[#1c2240] text-text-primary text-[13px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-accent"
          >
            <option value="">Seleccionar</option>
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flagEmoji} {c.code} — {c.name}
              </option>
            ))}
          </select>
          {errors.fromCurrencyId && (
            <p className="mt-1 text-[12px] text-negative">{errors.fromCurrencyId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-widest text-text-secondary mb-2 font-sans">
            Divisa destino
          </label>
          <select
            {...register('toCurrencyId')}
            className="w-full bg-[#111629] border border-[#1c2240] text-text-primary text-[13px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-accent"
          >
            <option value="">Seleccionar</option>
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flagEmoji} {c.code} — {c.name}
              </option>
            ))}
          </select>
          {errors.toCurrencyId && (
            <p className="mt-1 text-[12px] text-negative">{errors.toCurrencyId.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-widest text-text-secondary mb-2 font-sans">
          Monto a cambiar
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          {...register('fromAmount')}
          className="w-full bg-[#111629] border border-[#1c2240] text-text-primary text-[15px] font-display font-bold tabular-nums rounded-md px-3 py-2.5 focus:outline-none focus:border-accent placeholder:text-text-secondary"
          placeholder="0.00"
        />
        {errors.fromAmount && (
          <p className="mt-1 text-[12px] text-negative">{errors.fromAmount.message}</p>
        )}
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-widest text-text-secondary mb-2 font-sans">
          Método de pago
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'card', label: 'Tarjeta' },
            { value: 'transfer', label: 'Transferencia' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={opt.value}
                {...register('paymentMethod')}
                className="accent-accent"
              />
              <span className="text-[13px] font-sans text-text-secondary">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-widest text-text-secondary mb-2 font-sans">
          Notas (opcional)
        </label>
        <input
          type="text"
          {...register('notes')}
          className="w-full bg-[#111629] border border-[#1c2240] text-text-primary text-[13px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-accent placeholder:text-text-secondary"
          placeholder="Referencia interna..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || createOrder.isPending}
        className="w-full py-3 bg-accent text-background font-sans font-medium text-[14px] rounded-md hover:bg-accent-hover disabled:opacity-50 transition-colors"
      >
        {isSubmitting || createOrder.isPending ? 'Procesando...' : 'Confirmar y pagar'}
      </button>

      {createOrder.isError && (
        <p className="text-[13px] text-negative text-center font-sans">
          Error al procesar la solicitud. Intenta de nuevo.
        </p>
      )}
    </form>
  );
}
