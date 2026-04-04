import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

/** Ollama model tags: letters, digits, and common separators (e.g. gemma4:e4b, llama3.2:3b). */
const OLLAMA_MODEL_TAG = /^[a-zA-Z0-9._+:-]+$/;

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

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  @Matches(OLLAMA_MODEL_TAG, {
    message:
      'model must be a valid Ollama tag (letters, digits, . _ + : - only)',
  })
  model?: string;
}
