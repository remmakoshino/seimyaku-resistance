import { ElementType } from '../utils/constants';

// ===== インターフェース =====

export interface CharacterStats {
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  agility: number;
}

export interface Equipment {
  name: string;
  stats: Partial<CharacterStats>;
  slots: number;
}

export interface Skill {
  name: string;
  type: 'attack' | 'recovery' | 'support';
  element: ElementType;
  spCost: number;
  power: number;
  target: 'single' | 'all' | 'self' | 'random';
  hitCount: number;
  description: string;
  effects?: StatusEffect[];
}

export interface StatusEffect {
  type: 'atkUp' | 'defUp' | 'spdUp' | 'atkDown' | 'defDown' | 'spdDown' | 'regen' | 'poison' | 'blind' | 'barrier' | 'mbarrier';
  multiplier: number;
  duration: number;
}

export interface Seishouseki {
  id: string;
  name: string;
  category: 'attack' | 'recovery' | 'support' | 'summon' | 'skill' | 'enhance';
  level: number;
  maxLevel: number;
  smp: number;
  smpToNext: number;
  skills: Skill[];
  color: string;
}

export interface Character {
  id: string;
  name: string;
  level: number;
  exp: number;
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
  awakenGauge: number;
  maxAwakenGauge: number;
  awakenLevel: number;
  weapon: Equipment;
  armor: Equipment;
  accessory: Equipment;
  seishouseki: Seishouseki[];
  weaponType: string;
  colorHex: string;
  awakenSkillName: string;
  awakenSkillDescription: string;
  awakenProgress?: {
    killCount: number;
    useCount: number[];
    unlockedTechs: string[];
  };
}

// ===== 初期キャラクターデータ =====

export const INITIAL_CHARACTERS: Character[] = [
  {
    id: 'rei',
    name: 'レイ・アストラ',
    level: 1,
    exp: 0,
    hp: 450,
    maxHp: 450,
    sp: 120,
    maxSp: 120,
    attack: 42,
    defense: 35,
    magicAttack: 38,
    magicDefense: 30,
    agility: 40,
    element: 'thunder',
    awakenGauge: 0,
    maxAwakenGauge: 100,
    awakenLevel: 1,
    weapon: { name: '星脈剣', stats: { attack: 10 }, slots: 3 },
    armor: { name: 'レジスタンスコート', stats: { defense: 8 }, slots: 2 },
    accessory: { name: 'アームガード', stats: { agility: 3 }, slots: 1 },
    seishouseki: [],
    weaponType: '片手剣',
    colorHex: '#3498DB',
    awakenSkillName: '蒼雷一閃',
    awakenSkillDescription: '雷をまとった高速連続斬り。敵全体に雷属性の大ダメージ',
  },
  {
    id: 'kanade',
    name: 'カナデ・ヒイラギ',
    level: 1,
    exp: 0,
    hp: 380,
    maxHp: 380,
    sp: 100,
    maxSp: 100,
    attack: 48,
    defense: 28,
    magicAttack: 25,
    magicDefense: 25,
    agility: 50,
    element: 'fire',
    awakenGauge: 0,
    maxAwakenGauge: 100,
    awakenLevel: 1,
    weapon: { name: '星脈グローブ', stats: { attack: 12 }, slots: 2 },
    armor: { name: 'ファイタースーツ', stats: { defense: 5, agility: 3 }, slots: 2 },
    accessory: { name: 'バンテージ', stats: { attack: 2 }, slots: 1 },
    seishouseki: [],
    weaponType: '格闘',
    colorHex: '#E74C3C',
    awakenSkillName: '紅蓮旋風脚',
    awakenSkillDescription: '炎をまとった連続蹴りから空中回転蹴り。全体火属性大ダメージ',
  },
  {
    id: 'salt',
    name: 'ソルト・グレイシア',
    level: 1,
    exp: 0,
    hp: 320,
    maxHp: 320,
    sp: 180,
    maxSp: 180,
    attack: 20,
    defense: 25,
    magicAttack: 55,
    magicDefense: 45,
    agility: 30,
    element: 'ice',
    awakenGauge: 0,
    maxAwakenGauge: 100,
    awakenLevel: 1,
    weapon: { name: '霜晶の杖', stats: { magicAttack: 15 }, slots: 3 },
    armor: { name: '学者のローブ', stats: { magicDefense: 10 }, slots: 2 },
    accessory: { name: '星晶ブローチ', stats: { magicAttack: 3 }, slots: 1 },
    seishouseki: [],
    weaponType: '魔導杖',
    colorHex: '#BDC3C7',
    awakenSkillName: '永久凍土の鎮魂歌',
    awakenSkillDescription: '広範囲氷結魔術。敵全体に氷属性の超大ダメージ＋速度低下',
  },
  {
    id: 'jin',
    name: 'ジン・クロガネ',
    level: 1,
    exp: 0,
    hp: 550,
    maxHp: 550,
    sp: 80,
    maxSp: 80,
    attack: 35,
    defense: 50,
    magicAttack: 20,
    magicDefense: 35,
    agility: 25,
    element: 'light',
    awakenGauge: 0,
    maxAwakenGauge: 100,
    awakenLevel: 1,
    weapon: { name: '鉄壁の盾銃', stats: { attack: 8, defense: 8 }, slots: 2 },
    armor: { name: '改造軍服', stats: { defense: 15 }, slots: 2 },
    accessory: { name: '軍章', stats: { defense: 3 }, slots: 1 },
    seishouseki: [],
    weaponType: '大盾＋銃',
    colorHex: '#F39C12',
    awakenSkillName: '黄金の加護',
    awakenSkillDescription: '味方全員にバリア付与＋自身の全力砲撃。全体光属性大ダメージ',
  },
  {
    id: 'misty',
    name: 'ミスティ・ノワール',
    level: 1,
    exp: 0,
    hp: 360,
    maxHp: 360,
    sp: 130,
    maxSp: 130,
    attack: 40,
    defense: 22,
    magicAttack: 42,
    magicDefense: 28,
    agility: 55,
    element: 'dark',
    awakenGauge: 0,
    maxAwakenGauge: 100,
    awakenLevel: 1,
    weapon: { name: '影縫いの双剣', stats: { attack: 11, agility: 3 }, slots: 2 },
    armor: { name: 'スキンスーツ', stats: { defense: 4, agility: 5 }, slots: 1 },
    accessory: { name: 'フードマント', stats: { magicDefense: 3 }, slots: 1 },
    seishouseki: [],
    weaponType: '双短剣',
    colorHex: '#8E44AD',
    awakenSkillName: '深淵の抱擁',
    awakenSkillDescription: '闇属性の全体攻撃＋敵全体にデバフ',
  },
];

// ===== レベルアップ時のステータス上昇テーブル =====
export const LEVEL_UP_STATS: Record<string, Partial<CharacterStats> & { hp: number; sp: number }> = {
  rei: { hp: 35, sp: 8, attack: 3, defense: 2, magicAttack: 2, magicDefense: 2, agility: 3 },
  kanade: { hp: 28, sp: 6, attack: 4, defense: 2, magicAttack: 1, magicDefense: 1, agility: 4 },
  salt: { hp: 22, sp: 12, attack: 1, defense: 1, magicAttack: 4, magicDefense: 3, agility: 2 },
  jin: { hp: 45, sp: 5, attack: 2, defense: 4, magicAttack: 1, magicDefense: 2, agility: 1 },
  misty: { hp: 25, sp: 9, attack: 3, defense: 1, magicAttack: 3, magicDefense: 2, agility: 4 },
};
