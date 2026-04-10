import { Character, INITIAL_CHARACTERS } from '../characters/CharacterData';

export interface SaveData {
  currentChapter: number;
  party: string[];
  characters: Character[];
  inventory: InventoryItem[];
  money: number;
  storyFlags: Record<string, boolean>;
  playTime: number;
  clearedChapters: number[];
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  type: 'consumable' | 'seishouseki' | 'equipment';
}

const SAVE_KEY = 'seimyaku_resistance_save';

export class SaveSystem {
  static getDefaultSave(): SaveData {
    return {
      currentChapter: 1,
      party: ['rei', 'kanade', 'jin'],
      characters: INITIAL_CHARACTERS.map(c => ({ ...c })),
      inventory: [
        { id: 'potion', name: 'ポーション', description: 'HP30%回復', quantity: 5, type: 'consumable' },
        { id: 'ether', name: 'エーテル', description: 'SP30%回復', quantity: 3, type: 'consumable' },
      ],
      money: 500,
      storyFlags: {},
      playTime: 0,
      clearedChapters: [],
    };
  }

  static save(data: SaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      console.warn('セーブに失敗しました');
    }
  }

  static load(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SaveData;
    } catch {
      console.warn('ロードに失敗しました');
      return null;
    }
  }

  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
