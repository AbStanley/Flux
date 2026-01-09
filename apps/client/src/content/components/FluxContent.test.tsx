import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FluxContent } from './FluxContent';

describe('FluxContent', () => {
    it('renders loading state', () => {
        render(<FluxContent loading={true} error={null} result="" />);
        expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('renders error state', () => {
        render(<FluxContent loading={false} error="Something went wrong" result="" />);
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders result content when not loading and no error', () => {
        const markdown = "**Hello** world";
        render(<FluxContent loading={false} error={null} result={markdown} />);

        // FluxContent uses react-markdown, so **Hello** should be strong
        const strongElement = screen.getByText('Hello');
        expect(strongElement.tagName).toBe('STRONG');
        expect(screen.getByText('world')).toBeInTheDocument();
    });

    it('renders nothing when idle (no result, no loading, no error)', () => {
        const { container } = render(<FluxContent loading={false} error={null} result="" />);
        expect(container.firstChild).toBeEmptyDOMElement();
    });
});
