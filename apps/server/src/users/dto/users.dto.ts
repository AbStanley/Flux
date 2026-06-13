import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  sourceLang?: string;

  @IsOptional()
  @IsString()
  targetLang?: string;

  @IsOptional()
  @IsArray()
  customThemes?: unknown[];
}
