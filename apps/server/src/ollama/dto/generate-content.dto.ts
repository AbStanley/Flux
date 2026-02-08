import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ALLOWED_MODELS } from '../ollama.constants';

export enum ContentType {
  Story = 'Story',
  Monologue = 'Monologue',
  Conversation = 'Conversation',
}

export enum ProficiencyLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
}

export class GenerateContentDto {
  @IsString()
  @IsOptional()
  topic?: string;

  @IsString()
  @IsNotEmpty()
  sourceLanguage: string;

  @IsBoolean()
  isLearningMode: boolean;

  @IsEnum(ProficiencyLevel)
  proficiencyLevel: ProficiencyLevel;

  @IsEnum(ContentType)
  contentType: ContentType;

  @IsString()
  @IsOptional()
  @IsIn(ALLOWED_MODELS)
  model?: string;
}
