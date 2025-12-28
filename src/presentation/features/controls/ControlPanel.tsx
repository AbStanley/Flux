import React, { useState } from 'react';
import { useServices } from '../../contexts/ServiceContext';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
    onTextChange: (text: string) => void;
    sourceLang: string;
    targetLang: string;
    setSourceLang: (lang: string) => void;
    setTargetLang: (lang: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
    onTextChange,
    sourceLang,
    targetLang,
    setSourceLang,
    setTargetLang
}) => {
    const { aiService, setServiceType, currentServiceType } = useServices();
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const [availableModels, setAvailableModels] = useState<string[]>([]);

    React.useEffect(() => {
        if (currentServiceType === 'ollama') {
            aiService.getAvailableModels().then(models => {
                if (models.length > 0) setAvailableModels(models);
            });
        }
    }, [aiService, currentServiceType]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await aiService.generateText(
                `Write a short, interesting story in ${targetLang} about a robot learning to paint.`
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
                <div className={styles.languageControls}>
                    <div className={styles.selectGroup}>
                        <label>Source</label>
                        <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                            <option value="Auto">Auto Detect</option>
                            <option value="Spanish">Spanish</option>
                            <option value="English">English</option>
                            <option value="French">French</option>
                            <option value="German">German</option>
                            <option value="Italian">Italian</option>
                            <option value="Japanese">Japanese</option>
                        </select>
                    </div>
                    <div className={styles.selectGroup}>
                        <label>Target</label>
                        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                            <option value="English">English</option>
                            <option value="Spanish">Spanish</option>
                            <option value="French">French</option>
                            <option value="German">German</option>
                            <option value="Italian">Italian</option>
                            <option value="Japanese">Japanese</option>
                        </select>
                    </div>
                </div>

                <div className={styles.headerTop}>
                    <h2 className={styles.title}>Reader Input</h2>
                    <div className={styles.controls}>
                        {currentServiceType === 'ollama' && (
                            <select
                                className={styles.select}
                                style={{ marginRight: '0.5rem' }}
                                onChange={(e) => setServiceType('ollama', { model: e.target.value })}
                                defaultValue=""
                            >
                                <option value="" disabled>Select Model</option>
                                {availableModels.length > 0 ? (
                                    availableModels.map(m => <option key={m} value={m}>{m}</option>)
                                ) : (
                                    <>
                                        <option value="llama2">llama2 (Default)</option>
                                        <option value="mistral">mistral</option>
                                    </>
                                )}
                            </select>
                        )}
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
