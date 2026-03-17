// PATH: apps/web/app/(auth)/login/page.tsx
// DESC: Página de login con React Hook Form + Zod y redirección por rol

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await login.mutateAsync(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
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
            Iniciar sesión
          </h1>
          <p className="text-[13px] text-text-secondary font-sans mb-6">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-accent hover:text-accent-hover transition-colors">
              Regístrate gratis
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-text-secondary mb-1.5 font-sans">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full bg-[#111629] border border-[#1c2240] text-text-primary text-[14px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-accent transition-colors"
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-[12px] text-negative">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-text-secondary mb-1.5 font-sans">
                Contraseña
              </label>
              <input
                type="password"
                {...register('password')}
                className="w-full bg-[#111629] border border-[#1c2240] text-text-primary text-[14px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-accent transition-colors"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-[12px] text-negative">{errors.password.message}</p>
              )}
            </div>

            {login.isError && (
              <p className="text-[13px] text-negative text-center font-sans">
                Credenciales inválidas. Intenta de nuevo.
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || login.isPending}
              className="w-full py-2.5 bg-accent text-background font-sans font-medium text-[14px] rounded-md hover:bg-accent-hover disabled:opacity-50 transition-colors mt-2"
            >
              {isSubmitting || login.isPending ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
