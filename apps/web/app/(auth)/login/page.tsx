// PATH: apps/web/app/(auth)/login/page.tsx
// DESC: Página de login — tema claro con card blanca

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
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FE] px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
              <Image src="/logo.svg" alt="More Exchange" fill className="object-contain" />
            </div>
            <span className="font-display font-bold text-[16px] text-[#243a85]">More Exchange</span>
          </Link>
        </div>

        <div className="border border-[#E2E5F1] rounded-xl bg-white p-8 shadow-widget">
          <h1 className="font-display font-bold text-[22px] text-[#1B2141] mb-1">Iniciar sesión</h1>
          <p className="text-[13px] text-[#5C6489] font-sans mb-6">
            ¿No tienes cuenta?{' '}
            <Link
              href="/register"
              className="text-[#2458F5] hover:text-[#1A3FBF] transition-colors"
            >
              Regístrate gratis
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#5C6489] mb-1.5 font-sans">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full bg-[#F5F7FE] border border-[#E2E5F1] text-[#1B2141] text-[14px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-[#2458F5] focus:ring-1 focus:ring-[#2458F5]/20 transition-colors"
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-[12px] text-[#DC2626]">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#5C6489] mb-1.5 font-sans">
                Contraseña
              </label>
              <input
                type="password"
                {...register('password')}
                className="w-full bg-[#F5F7FE] border border-[#E2E5F1] text-[#1B2141] text-[14px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-[#2458F5] focus:ring-1 focus:ring-[#2458F5]/20 transition-colors"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-[12px] text-[#DC2626]">{errors.password.message}</p>
              )}
            </div>

            {login.isError && (
              <p className="text-[13px] text-[#DC2626] text-center font-sans">
                Credenciales inválidas. Intenta de nuevo.
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || login.isPending}
              className="w-full py-2.5 bg-[#2458F5] text-white font-sans font-medium text-[14px] rounded-md hover:bg-[#1A3FBF] disabled:opacity-50 transition-colors mt-2 shadow-sm"
            >
              {isSubmitting || login.isPending ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
