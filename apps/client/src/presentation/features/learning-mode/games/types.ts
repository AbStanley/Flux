export interface SlotData {
    char: string;
    isFilled: boolean;
    isStatic: boolean;
    sourceBtnId?: string;
    /** 'none' | 'correct' | 'wrong' | 'revealed' */
    status: 'none' | 'correct' | 'wrong' | 'revealed';
}

export interface LetterParams {
    id: string;
    char: string;
    isUsed: boolean;
}
