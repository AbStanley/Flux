import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExampleDto {
  @IsString()
  @IsNotEmpty()
  sentence: string = '';

  @IsString()
  @IsOptional()
  translation?: string;
}

export class CreateWordDto {
  @IsString()
  @IsNotEmpty()
  text: string = '';

  @IsString()
  @IsOptional()
  definition?: string;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsString()
  @IsOptional()
  context?: string;

  @IsString()
  @IsOptional()
  sourceLanguage?: string;

  @IsString()
  @IsOptional()
  targetLanguage?: string;

  @IsString()
  @IsOptional()
  sourceTitle?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  pronunciation?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExampleDto)
  examples?: ExampleDto[];
}

