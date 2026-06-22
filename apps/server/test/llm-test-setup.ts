import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { OllamaTranslationService } from '../src/ollama/services/ollama-translation.service';

export type RichDto = {
  text: string;
  targetLanguage: string;
  context?: string;
  sourceLanguage?: string;
  model?: string;
};

export type RichTranslationResult = {
  isVerb?: boolean;
  translation?: string;
  translationConjugated?: string;
  grammar?: { sourceInfinitive?: string };
  _verbAnalysis?: { sourceInfinitive?: string };
};

export class LlmTestHelper {
  static app: INestApplication;
  static service: OllamaTranslationService;

  static async setup() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    await this.app.init();
    this.service = moduleFixture.get<OllamaTranslationService>(
      OllamaTranslationService,
    );
  }

  static async teardown() {
    await this.app.close();
  }

  static async stream(dto: RichDto): Promise<RichTranslationResult> {
    const raw = await this.service.getRichTranslationStream(dto);
    let text = '';
    for await (const chunk of raw) {
      if (chunk.response) text += chunk.response;
    }
    try {
      return JSON.parse(text) as RichTranslationResult;
    } catch {
      throw new Error(`LLM output not valid JSON:\n${text}`);
    }
  }

  static oneOf(actual: string | undefined, accepted: string[]) {
    return accepted.some(
      (v) => actual?.trim().toLowerCase() === v.toLowerCase(),
    );
  }
}
