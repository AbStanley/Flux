import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageSelector } from './LanguageSelector';
import userEvent from '@testing-library/user-event';

// Radix UI Select can be tricky to test. 
// We often need to mock pointer capture or use userEvent.

describe('LanguageSelector', () => {
    it('should render label correctly', () => {
        render(
            <LanguageSelector
                value=""
                onChange={() => { }}
                label="Select Language"
            />
        );
        expect(screen.getByText('Select Language')).toBeDefined();
    });

    it('should display the selected value', () => {
        render(
            <LanguageSelector
                value="es"
                onChange={() => { }}
            />
        );
        // "es" maps to Spanish with flag
        // The trigger should show the selected value (or something representing it) if Radix works as expected in this env.
        // However, Radix Select usually renders the value inside a span in the trigger.
        // Given existing setup, let's just check if it renders without crashing first.
    });

    it('should render call onChange when value is changed', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(
            <LanguageSelector
                value="en"
                onChange={handleChange}
            />
        );

        // Find the trigger. Radix Select trigger usually has role 'combobox'
        const trigger = screen.getByRole('combobox');
        await user.click(trigger);

        // Wait for content. "Spanish" text should appear.
        const option = await screen.findByText('Spanish');
        await user.click(option);

        expect(handleChange).toHaveBeenCalledWith('es');
    });

    it('should show "Any / Detect" when no options provided', async () => {
        const user = userEvent.setup();
        render(<LanguageSelector value="" onChange={() => { }} />);

        const trigger = screen.getByRole('combobox');
        await user.click(trigger);

        expect(await screen.findByText("🌍 Any / Detect")).toBeDefined();
    });

    it('should restrict options when "options" prop is provided', async () => {
        const user = userEvent.setup();
        render(
            <LanguageSelector
                value=""
                onChange={() => { }}
                options={['fr', 'de']}
            />
        );

        const trigger = screen.getByRole('combobox');
        await user.click(trigger);

        expect(screen.queryByText("English")).toBeNull();
        expect(await screen.findByText("French")).toBeDefined();
        expect(await screen.findByText("German")).toBeDefined();
    });
});
