import React, { useState } from 'react';
import { useServices } from '../../contexts/ServiceContext';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
    onTextChange: (text: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onTextChange }) => {
    const { aiService, setServiceType, currentServiceType } = useServices();
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await aiService.generateText(
                "Write a short, interesting story about a robot learning to paint."
            );
            setInputText(result);
            onTextChange(result);
        } catch (error) {
            console.error(error);
            alert("Failed to generate text");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setInputText(content);
            onTextChange(content);
        };
        reader.readAsText(file);
    };

    const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value);
        onTextChange(e.target.value);
    };

    return (
        <div className={`${styles.panel} glass-panel`}>
            <div className={styles.header}>
                <h2 className={styles.title}>Reader Input</h2>
                <div className={styles.controls}>
                    <select
                        value={currentServiceType}
                        onChange={(e) => setServiceType(e.target.value as 'mock' | 'ollama')}
                        className={styles.select}
                    >
                        <option value="mock">Mock AI</option>
                        <option value="ollama">Ollama (Local)</option>
                    </select>
                </div>
            </div>

            <textarea
                className={styles.textarea}
                placeholder="Paste text here, or generate..."
                value={inputText}
                onChange={handleManualChange}
            />

            <div className={styles.actions}>
                <button
                    className="btn-primary"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                >
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                </button>

                <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                    Load File
                    <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
            </div>
        </div>
    );
};
