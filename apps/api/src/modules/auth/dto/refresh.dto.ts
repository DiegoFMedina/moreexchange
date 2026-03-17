// PATH: apps/api/src/modules/auth/dto/refresh.dto.ts
// DESC: DTO para renovar el access token usando el refresh token

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
