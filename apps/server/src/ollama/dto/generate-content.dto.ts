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
  sourceLanguage: string = 'English';

  @IsBoolean()
  isLearningMode: boolean = true;

  @IsEnum(ProficiencyLevel)
  proficiencyLevel: ProficiencyLevel = ProficiencyLevel.A1;

  @IsEnum(ContentType)
  contentType: ContentType = ContentType.Story;

  @IsString()
  @IsOptional()
  @IsIn(ALLOWED_MODELS)
  model?: string;
}
