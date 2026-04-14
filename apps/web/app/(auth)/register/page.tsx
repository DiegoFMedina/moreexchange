// PATH: apps/web/app/(auth)/register/page.tsx
// DESC: Página de registro — tema claro con card blanca

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
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FE] px-4 py-12">
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
          <h1 className="font-display font-bold text-[22px] text-[#1B2141] mb-1">Crear cuenta</h1>
          <p className="text-[13px] text-[#5C6489] font-sans mb-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-[#2458F5] hover:text-[#1A3FBF] transition-colors">
              Inicia sesión
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[#5C6489] mb-1.5 font-sans">
                  Nombre
                </label>
                <input
                  {...register('firstName')}
                  className="w-full bg-[#F5F7FE] border border-[#E2E5F1] text-[#1B2141] text-[13px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-[#2458F5] focus:ring-1 focus:ring-[#2458F5]/20"
                  placeholder="Juan"
                />
                {errors.firstName && (
                  <p className="mt-1 text-[11px] text-[#DC2626]">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[#5C6489] mb-1.5 font-sans">
                  Apellido
                </label>
                <input
                  {...register('lastName')}
                  className="w-full bg-[#F5F7FE] border border-[#E2E5F1] text-[#1B2141] text-[13px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-[#2458F5] focus:ring-1 focus:ring-[#2458F5]/20"
                  placeholder="Pérez"
                />
                {errors.lastName && (
                  <p className="mt-1 text-[11px] text-[#DC2626]">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#5C6489] mb-1.5 font-sans">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full bg-[#F5F7FE] border border-[#E2E5F1] text-[#1B2141] text-[13px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-[#2458F5] focus:ring-1 focus:ring-[#2458F5]/20"
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-[#DC2626]">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#5C6489] mb-1.5 font-sans">
                Contraseña
              </label>
              <input
                type="password"
                {...register('password')}
                className="w-full bg-[#F5F7FE] border border-[#E2E5F1] text-[#1B2141] text-[13px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-[#2458F5] focus:ring-1 focus:ring-[#2458F5]/20"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-[11px] text-[#DC2626]">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#5C6489] mb-1.5 font-sans">
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full bg-[#F5F7FE] border border-[#E2E5F1] text-[#1B2141] text-[13px] font-sans rounded-md px-3 py-2.5 focus:outline-none focus:border-[#2458F5] focus:ring-1 focus:ring-[#2458F5]/20"
                placeholder="+56912345678"
              />
            </div>

            {registerAuth.isError && (
              <p className="text-[13px] text-[#DC2626] text-center font-sans">
                Error al crear la cuenta. Intenta de nuevo.
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || registerAuth.isPending}
              className="w-full py-2.5 bg-[#2458F5] text-white font-sans font-medium text-[14px] rounded-md hover:bg-[#1A3FBF] disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting || registerAuth.isPending ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
