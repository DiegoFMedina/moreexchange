// PATH: apps/api/src/modules/auth/dto/login.dto.ts
// DESC: DTO de login con email y contraseña

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'cliente@ejemplo.cl' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({ example: 'Segura123!' })
  @IsString()
  @MinLength(1)
  password!: string;
}
