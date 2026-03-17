// PATH: apps/web/app/(auth)/register/page.tsx
// DESC: Página de registro de nuevos clientes con validaciones Zod

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula')
    .regex(/\d/, 'Debe incluir un número')
    .regex(/[!@#$%^&*]/, 'Debe incluir un carácter especial (!@#$%^&*)'),
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerAuth } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await registerAuth.mutateAsync(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
              <Image src="/logo.svg" alt="More Exchange" fill className="object-contain" />
            </div>
            <span className="font-display font-bold text-[16px] text-text-primary">
              More Exchange
            </span>
          </Link>
        </div>

        <div className="border border-[#1c2240] rounded-lg bg-[#0c0f1a] p-8">
          <h1 className="font-display font-bold text-[22px] text-text-primary mb-1">
            Crear cuenta
          </h1>
          <p className="text-[13px] text-text-secondary font-sans mb-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-accent hover:text-accent-hover transition-colors">
              Inicia sesión
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-text-secondary mb-1.5 font-sans">
                  Nombre
                </label>
                <input
                  {...register('firstName')}
                  className="w-full bg-[#111629] border border-[#1c2240] text-text-primary text-[13px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-accent"
                  placeholder="Juan"
                />
                {errors.firstName && (
                  <p className="mt-1 text-[11px] text-negative">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-text-secondary mb-1.5 font-sans">
                  Apellido
                </label>
                <input
                  {...register('lastName')}
                  className="w-full bg-[#111629] border border-[#1c2240] text-text-primary text-[13px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-accent"
                  placeholder="Pérez"
                />
                {errors.lastName && (
                  <p className="mt-1 text-[11px] text-negative">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-text-secondary mb-1.5 font-sans">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full bg-[#111629] border border-[#1c2240] text-text-primary text-[13px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-accent"
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-negative">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-text-secondary mb-1.5 font-sans">
                Contraseña
              </label>
              <input
                type="password"
                {...register('password')}
                className="w-full bg-[#111629] border border-[#1c2240] text-text-primary text-[13px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-accent"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-[11px] text-negative">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-text-secondary mb-1.5 font-sans">
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full bg-[#111629] border border-[#1c2240] text-text-primary text-[13px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-accent"
                placeholder="+56912345678"
              />
            </div>

            {registerAuth.isError && (
              <p className="text-[13px] text-negative text-center font-sans">
                Error al crear la cuenta. Intenta de nuevo.
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || registerAuth.isPending}
              className="w-full py-2.5 bg-accent text-background font-sans font-medium text-[14px] rounded-md hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {isSubmitting || registerAuth.isPending ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
