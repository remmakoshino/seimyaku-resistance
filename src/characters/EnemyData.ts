import { ElementType } from '../utils/constants';

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  agility: number;
  element: ElementType;
  exp: number;
  money: number;
  smp: number;
  category: 'mechanical' | 'mutant' | 'mercenary' | 'starbeast' | 'boss';
  skills: EnemySkill[];
  isBoss: boolean;
  bossPhase?: number;
  maxBossPhase?: number;
  phaseHpThresholds?: number[];
  dropItems?: DropItem[];
}

export interface EnemySkill {
  name: string;
  element: ElementType;
  power: number;
  target: 'single' | 'all' | 'random';
  hitCount: number;
  probability: number;
  effects?: { type: string; multiplier: number; duration: number }[];
}

export interface DropItem {
  itemId: string;
  name: string;
  probability: number;
}

// ===== 雑魚敵データ =====
export const ENEMIES: Record<string, Enemy> = {
  drone: {
    id: 'drone',
    name: 'クロノス量産型ドローン',
    hp: 120, maxHp: 120,
    sp: 20, maxSp: 20,
    attack: 18, defense: 20,
    magicAttack: 10, magicDefense: 10,
    agility: 25,
    element: 'none',
    exp: 15, money: 30, smp: 5,
    category: 'mechanical',
    isBoss: false,
    skills: [
      { name: 'レーザー射撃', element: 'none', power: 25, target: 'single', hitCount: 1, probability: 0.6 },
      { name: '自爆', element: 'fire', power: 50, target: 'single', hitCount: 1, probability: 0.1 },
    ],
    dropItems: [{ itemId: 'potion', name: 'ポーション', probability: 0.3 }],
  },
  guardRobot: {
    id: 'guardRobot',
    name: '警備ロボ',
    hp: 200, maxHp: 200,
    sp: 30, maxSp: 30,
    attack: 25, defense: 30,
    magicAttack: 15, magicDefense: 15,
    agility: 15,
    element: 'none',
    exp: 25, money: 50, smp: 8,
    category: 'mechanical',
    isBoss: false,
    skills: [
      { name: 'アームクラッシュ', element: 'none', power: 30, target: 'single', hitCount: 1, probability: 0.5 },
      { name: '電磁バリア', element: 'thunder', power: 0, target: 'single', hitCount: 0, probability: 0.2, effects: [{ type: 'defUp', multiplier: 1.3, duration: 3 }] },
    ],
    dropItems: [{ itemId: 'potion', name: 'ポーション', probability: 0.4 }],
  },
  mutantBeast: {
    id: 'mutantBeast',
    name: '変異獣',
    hp: 150, maxHp: 150,
    sp: 15, maxSp: 15,
    attack: 30, defense: 15,
    magicAttack: 20, magicDefense: 12,
    agility: 35,
    element: 'water',
    exp: 20, money: 40, smp: 6,
    category: 'mutant',
    isBoss: false,
    skills: [
      { name: '毒牙', element: 'none', power: 28, target: 'single', hitCount: 1, probability: 0.5, effects: [{ type: 'poison', multiplier: 0.05, duration: 3 }] },
      { name: '星脈噴射', element: 'water', power: 35, target: 'single', hitCount: 1, probability: 0.3 },
    ],
    dropItems: [{ itemId: 'antidote', name: '解毒剤', probability: 0.3 }],
  },
  mercenary: {
    id: 'mercenary',
    name: 'クロノス傭兵',
    hp: 180, maxHp: 180,
    sp: 25, maxSp: 25,
    attack: 28, defense: 22,
    magicAttack: 12, magicDefense: 18,
    agility: 30,
    element: 'none',
    exp: 22, money: 60, smp: 7,
    category: 'mercenary',
    isBoss: false,
    skills: [
      { name: '連続斬り', element: 'none', power: 15, target: 'single', hitCount: 2, probability: 0.5 },
      { name: '手榴弾', element: 'fire', power: 25, target: 'all', hitCount: 1, probability: 0.2 },
    ],
    dropItems: [{ itemId: 'potion', name: 'ポーション', probability: 0.5 }],
  },
  starBeast: {
    id: 'starBeast',
    name: '星脈獣',
    hp: 160, maxHp: 160,
    sp: 40, maxSp: 40,
    attack: 22, defense: 18,
    magicAttack: 30, magicDefense: 25,
    agility: 28,
    element: 'thunder',
    exp: 25, money: 45, smp: 8,
    category: 'starbeast',
    isBoss: false,
    skills: [
      { name: '星脈雷撃', element: 'thunder', power: 35, target: 'single', hitCount: 1, probability: 0.5 },
      { name: '星脈光弾', element: 'light', power: 30, target: 'single', hitCount: 1, probability: 0.3 },
    ],
    dropItems: [{ itemId: 'ether', name: 'エーテル', probability: 0.25 }],
  },
};

// ===== ボスデータ =====
export const BOSSES: Record<string, Enemy> = {
  gares: {
    id: 'gares',
    name: 'ガレス',
    hp: 2000, maxHp: 2000,
    sp: 100, maxSp: 100,
    attack: 40, defense: 35,
    magicAttack: 45, magicDefense: 30,
    agility: 28,
    element: 'fire',
    exp: 200, money: 500, smp: 50,
    category: 'boss',
    isBoss: true,
    skills: [
      { name: '火炎放射', element: 'fire', power: 45, target: 'single', hitCount: 1, probability: 0.4 },
      { name: '業火の壁', element: 'fire', power: 35, target: 'all', hitCount: 1, probability: 0.3 },
      { name: '炉心暴走', element: 'fire', power: 60, target: 'all', hitCount: 1, probability: 0.1 },
    ],
    dropItems: [{ itemId: 'fire_seishouseki', name: '炎の星晶石', probability: 1.0 }],
  },
  selene: {
    id: 'selene',
    name: 'セレーネ',
    hp: 3500, maxHp: 3500,
    sp: 150, maxSp: 150,
    attack: 35, defense: 30,
    magicAttack: 55, magicDefense: 40,
    agility: 45,
    element: 'ice',
    exp: 400, money: 800, smp: 80,
    category: 'boss',
    isBoss: true,
    skills: [
      { name: '氷結の刃', element: 'ice', power: 50, target: 'single', hitCount: 1, probability: 0.4 },
      { name: 'ブリザードストーム', element: 'ice', power: 40, target: 'all', hitCount: 1, probability: 0.3, effects: [{ type: 'spdDown', multiplier: 0.7, duration: 2 }] },
      { name: '絶対零度', element: 'ice', power: 80, target: 'single', hitCount: 1, probability: 0.1 },
    ],
    dropItems: [{ itemId: 'ice_seishouseki', name: '氷の星晶石', probability: 1.0 }],
  },
  olga: {
    id: 'olga',
    name: 'オルガ',
    hp: 2800, maxHp: 2800,
    sp: 120, maxSp: 120,
    attack: 50, defense: 35,
    magicAttack: 30, magicDefense: 25,
    agility: 35,
    element: 'thunder',
    exp: 350, money: 600, smp: 70,
    category: 'boss',
    isBoss: true,
    skills: [
      { name: '雷撃拳', element: 'thunder', power: 55, target: 'single', hitCount: 1, probability: 0.5 },
      { name: '落雷', element: 'thunder', power: 45, target: 'all', hitCount: 1, probability: 0.3 },
    ],
    dropItems: [{ itemId: 'thunder_seishouseki', name: '雷の星晶石', probability: 1.0 }],
  },
  boris: {
    id: 'boris',
    name: 'ボリス',
    hp: 2800, maxHp: 2800,
    sp: 140, maxSp: 140,
    attack: 30, defense: 40,
    magicAttack: 50, magicDefense: 40,
    agility: 30,
    element: 'water',
    exp: 350, money: 600, smp: 70,
    category: 'boss',
    isBoss: true,
    skills: [
      { name: '津波', element: 'water', power: 50, target: 'all', hitCount: 1, probability: 0.4 },
      { name: '水流砲', element: 'water', power: 60, target: 'single', hitCount: 1, probability: 0.3 },
      { name: '全力回復', element: 'none', power: -300, target: 'single', hitCount: 1, probability: 0.15 },
    ],
    dropItems: [{ itemId: 'water_seishouseki', name: '水の星晶石', probability: 1.0 }],
  },
  xenon: {
    id: 'xenon',
    name: 'ゼノン',
    hp: 5000, maxHp: 5000,
    sp: 200, maxSp: 200,
    attack: 55, defense: 45,
    magicAttack: 50, magicDefense: 40,
    agility: 40,
    element: 'light',
    exp: 600, money: 1200, smp: 120,
    category: 'boss',
    isBoss: true,
    bossPhase: 1,
    maxBossPhase: 3,
    phaseHpThresholds: [0.7, 0.35],
    skills: [
      { name: '聖光剣', element: 'light', power: 55, target: 'single', hitCount: 1, probability: 0.4 },
      { name: '審判の光', element: 'light', power: 45, target: 'all', hitCount: 1, probability: 0.3 },
      { name: 'ステラガード・斬', element: 'light', power: 70, target: 'single', hitCount: 2, probability: 0.15 },
    ],
    dropItems: [{ itemId: 'light_seishouseki', name: '光の星晶石', probability: 1.0 }],
  },
  valthor: {
    id: 'valthor',
    name: 'ヴァルトール',
    hp: 6000, maxHp: 6000,
    sp: 250, maxSp: 250,
    attack: 50, defense: 40,
    magicAttack: 65, magicDefense: 50,
    agility: 35,
    element: 'dark',
    exp: 800, money: 2000, smp: 200,
    category: 'boss',
    isBoss: true,
    bossPhase: 1,
    maxBossPhase: 2,
    phaseHpThresholds: [0.5],
    skills: [
      { name: '暗黒の波動', element: 'dark', power: 55, target: 'all', hitCount: 1, probability: 0.3 },
      { name: '支配の眼光', element: 'dark', power: 70, target: 'single', hitCount: 1, probability: 0.3 },
      { name: '星脈吸収', element: 'none', power: 40, target: 'single', hitCount: 1, probability: 0.2 },
    ],
    dropItems: [],
  },
  valthorFinal: {
    id: 'valthorFinal',
    name: '星脈融合体ヴァルトール',
    hp: 10000, maxHp: 10000,
    sp: 500, maxSp: 500,
    attack: 65, defense: 50,
    magicAttack: 80, magicDefense: 55,
    agility: 40,
    element: 'dark',
    exp: 1500, money: 5000, smp: 500,
    category: 'boss',
    isBoss: true,
    skills: [
      { name: '星脈崩壊', element: 'none', power: 70, target: 'all', hitCount: 1, probability: 0.3 },
      { name: '全属性解放', element: 'none', power: 60, target: 'all', hitCount: 1, probability: 0.2 },
      { name: '神の裁定', element: 'light', power: 90, target: 'single', hitCount: 1, probability: 0.15 },
      { name: '虚無の抱擁', element: 'dark', power: 85, target: 'all', hitCount: 1, probability: 0.1 },
    ],
    dropItems: [],
  },
};

// エンカウントテーブル（チャプター別）
export const ENCOUNTER_TABLES: Record<number, string[]> = {
  1: ['drone', 'guardRobot', 'mercenary'],
  2: ['mutantBeast', 'starBeast', 'mercenary'],
  3: ['drone', 'guardRobot', 'mutantBeast', 'starBeast'],
  4: ['guardRobot', 'mercenary', 'starBeast'],
  5: ['mutantBeast', 'starBeast', 'mercenary', 'guardRobot'],
};
