import { validate } from 'class-validator';
import { GenerateContentDto, ContentType, ProficiencyLevel } from './generate-content.dto';

describe('GenerateContentDto', () => {
    it('should pass with valid model', async () => {
        const dto = new GenerateContentDto();
        dto.topic = 'test';
        dto.sourceLanguage = 'es';
        dto.isLearningMode = true;
        dto.proficiencyLevel = ProficiencyLevel.B1;
        dto.contentType = ContentType.Story;
        dto.model = 'gemma:4b'; // Valid

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail with invalid model', async () => {
        const dto = new GenerateContentDto();
        dto.topic = 'test';
        dto.sourceLanguage = 'es';
        dto.isLearningMode = true;
        dto.proficiencyLevel = ProficiencyLevel.B1;
        dto.contentType = ContentType.Story;
        dto.model = 'hack-model'; // Invalid

        const errors = await validate(dto);
        console.log('Validation errors:', errors);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('model');
    });
});
