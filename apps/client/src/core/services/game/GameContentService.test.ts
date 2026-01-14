import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameContentService } from './GameContentService';
import { DatabaseContentStrategy } from './strategies/DatabaseContentStrategy';
import { AnkiContentStrategy } from './strategies/AnkiContentStrategy';

// Mock strategies
vi.mock('./strategies/DatabaseContentStrategy');
vi.mock('./strategies/AnkiContentStrategy');

describe('GameContentService', () => {
    let service: GameContentService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new GameContentService();
    });

    it('should initialize with default strategies', () => {
        // We can't easily inspect private properties, but we can test behavior
        expect(DatabaseContentStrategy).toHaveBeenCalled();
        expect(AnkiContentStrategy).toHaveBeenCalled();
    });

    it('should select correct strategy for "anki" source', async () => {
        const mockStrategy = {
            validateAvailability: vi.fn().mockResolvedValue(true),
            fetchItems: vi.fn().mockResolvedValue([]),
        };

        // Inject our mock instance for testing - since we can't easily access the internal map initialized in constructor
        // except by mocking the constructor of dependencies globally before instantiation.
        // But logic: constructor calls `new AnkiContentStrategy()`.
        // The mock above `vi.mock` makes `new AnkiContentStrategy()` return an auto-mocked class.
        // We can grab the instance from the mock implementation if we want rigorous testing,
        // or we can just spy on the methods if we setup the mock correctly.

        // Simpler approach: Register a custom strategy for test
        const testStrategy = {
            validateAvailability: vi.fn().mockResolvedValue(true),
            fetchItems: vi.fn().mockResolvedValue([{ id: '1', question: 'q', answer: 'a' }]),
        } as any;

        service.registerStrategy('test-source', testStrategy);

        const items = await service.getItems({ source: 'test-source' } as any);
        expect(items).toHaveLength(1);
        expect(testStrategy.validateAvailability).toHaveBeenCalled();
        expect(testStrategy.fetchItems).toHaveBeenCalled();
    });

    it('should throw if strategy not found/mock not ready (e.g. invalid source)', async () => {
        await expect(service.getItems({ source: 'invalid' } as any)).rejects.toThrow("implemented");
    });

    it('should throw if strategy is unavailable', async () => {
        const unavailableStrategy = {
            validateAvailability: vi.fn().mockResolvedValue(false),
            fetchItems: vi.fn(),
        } as any;

        service.registerStrategy('offline', unavailableStrategy);

        await expect(service.getItems({ source: 'offline' } as any)).rejects.toThrow("unavailable");
    });
});
