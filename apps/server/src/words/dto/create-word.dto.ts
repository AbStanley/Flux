export class CreateWordDto {
  text: string = '';
  definition?: string;
  explanation?: string;
  context?: string;

  sourceLanguage?: string;
  targetLanguage?: string;
  sourceTitle?: string;
  imageUrl?: string;
  pronunciation?: string;
  type?: string;

  examples?: {
    sentence: string;
    translation?: string;
  }[];
}
