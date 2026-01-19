import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LearningControls } from './LearningControls';

describe('LearningControls', () => {
    const mockSetIsLearningMode = vi.fn();
    const mockSetProficiencyLevel = vi.fn();
    const mockSetTopic = vi.fn();
    const mockSetContentType = vi.fn();

    const defaultProps = {
        isLearningMode: false,
        setIsLearningMode: mockSetIsLearningMode,
        proficiencyLevel: 'B1',
        setProficiencyLevel: mockSetProficiencyLevel,
        topic: '',
        setTopic: mockSetTopic,
        contentType: 'Story' as const,
        setContentType: mockSetContentType
    };

    it('renders switch to enable learning mode', () => {
        render(<LearningControls {...defaultProps} />);
        expect(screen.getByLabelText('Enable Learning Mode')).toBeInTheDocument();
        // Proficiency and topic should be hidden
        expect(screen.queryByText('Proficiency Level')).not.toBeInTheDocument();
    });

    it('toggles learning mode on click', () => {
        render(<LearningControls {...defaultProps} />);
        const switchControl = screen.getByLabelText('Enable Learning Mode');
        fireEvent.click(switchControl);
        expect(mockSetIsLearningMode).toHaveBeenCalledWith(true);
    });

    it('shows additional controls when learning mode is enabled', () => {
        render(<LearningControls {...defaultProps} isLearningMode={true} />);
        expect(screen.getByText('Proficiency Level')).toBeInTheDocument();
        expect(screen.getByText('Topic (Optional)')).toBeInTheDocument();
        expect(screen.getByText('Content Type')).toBeInTheDocument();
    });

    it('calls handler when topic changes', () => {
        render(<LearningControls {...defaultProps} isLearningMode={true} />);
        const topicInput = screen.getByPlaceholderText('e.g. Travel, Cooking');
        fireEvent.change(topicInput, { target: { value: 'Physics' } });
        expect(mockSetTopic).toHaveBeenCalled();
    });
});
