import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReaderInput } from './ReaderInput';

describe('ReaderInput', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    const defaultProps = {
        text: '',
        isGenerating: false,
        onChange: mockOnChange,
        onClear: mockOnClear
    };

    it('renders correctly with placeholder when empty', () => {
        render(<ReaderInput {...defaultProps} />);
        expect(screen.getByPlaceholderText('Paste text here, or generate...')).toBeInTheDocument();
        expect(screen.queryByTitle('Clear text')).not.toBeInTheDocument();
    });

    it('renders with text and shows clear button', () => {
        render(<ReaderInput {...defaultProps} text="Some text" />);
        expect(screen.getByDisplayValue('Some text')).toBeInTheDocument();
        expect(screen.getByTitle('Clear text')).toBeInTheDocument();
    });

    it('calls onChange when typing', () => {
        render(<ReaderInput {...defaultProps} />);
        const textarea = screen.getByPlaceholderText('Paste text here, or generate...');
        fireEvent.change(textarea, { target: { value: 'New text' } });
        expect(mockOnChange).toHaveBeenCalled();
    });

    it('calls onClear when clear button is clicked', () => {
        render(<ReaderInput {...defaultProps} text="Some text" />);
        const clearBtn = screen.getByTitle('Clear text');
        fireEvent.click(clearBtn);
        expect(mockOnClear).toHaveBeenCalled();
    });

    it('disables textarea and hides clear button when generating', () => {
        render(<ReaderInput {...defaultProps} text="Some text" isGenerating={true} />);

        const textarea = screen.getByDisplayValue('Some text');
        expect(textarea).toBeDisabled();

        // Clear button should not be visible during generation even if there is text
        expect(screen.queryByTitle('Clear text')).not.toBeInTheDocument();

        // Loading indicator
        expect(screen.getByTestId('story-generator-loader')).toBeInTheDocument();
    });
});
