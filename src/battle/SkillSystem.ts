import { Skill } from '../characters/CharacterData';

// ===== 攻撃星術 =====
export const ATTACK_SKILLS: Skill[] = [
  { name: 'フレイムバレット', type: 'attack', element: 'fire', spCost: 8, power: 60, target: 'single', hitCount: 1, description: '単体火属性攻撃' },
  { name: 'ブレイズストーム', type: 'attack', element: 'fire', spCost: 22, power: 100, target: 'all', hitCount: 1, description: '全体火属性攻撃' },
  { name: 'フロストエッジ', type: 'attack', element: 'ice', spCost: 8, power: 60, target: 'single', hitCount: 1, description: '単体氷属性攻撃' },
  { name: 'ブリザードフィールド', type: 'attack', element: 'ice', spCost: 22, power: 100, target: 'all', hitCount: 1, description: '全体氷属性攻撃', effects: [{ type: 'spdDown', multiplier: 0.7, duration: 2 }] },
  { name: 'サンダーボルト', type: 'attack', element: 'thunder', spCost: 8, power: 60, target: 'single', hitCount: 1, description: '単体雷属性攻撃' },
  { name: 'ライトニングチェーン', type: 'attack', element: 'thunder', spCost: 22, power: 95, target: 'random', hitCount: 3, description: 'ランダム3回雷属性攻撃' },
  { name: 'アクアスラッシュ', type: 'attack', element: 'water', spCost: 8, power: 60, target: 'single', hitCount: 1, description: '単体水属性攻撃' },
  { name: 'タイダルウェーブ', type: 'attack', element: 'water', spCost: 22, power: 100, target: 'all', hitCount: 1, description: '全体水属性攻撃' },
  { name: 'ルミナスレイ', type: 'attack', element: 'light', spCost: 12, power: 80, target: 'single', hitCount: 1, description: '単体光属性攻撃', effects: [{ type: 'blind', multiplier: 0, duration: 0 }] },
  { name: 'シャドウバインド', type: 'attack', element: 'dark', spCost: 12, power: 80, target: 'single', hitCount: 1, description: '単体闇属性攻撃', effects: [{ type: 'spdDown', multiplier: 0.7, duration: 2 }] },
];

// ===== 回復星術 =====
export const RECOVERY_SKILLS: Skill[] = [
  { name: 'ヒールライト', type: 'recovery', element: 'none', spCost: 6, power: 60, target: 'single', hitCount: 1, description: '単体HP小回復' },
  { name: 'ヒールフィールド', type: 'recovery', element: 'none', spCost: 16, power: 100, target: 'all', hitCount: 1, description: '全体HP中回復' },
  { name: 'リヴァイブ', type: 'recovery', element: 'none', spCost: 20, power: 50, target: 'single', hitCount: 1, description: '戦闘不能の味方をHP50%で復活' },
  { name: 'クレンズ', type: 'recovery', element: 'none', spCost: 4, power: 0, target: 'single', hitCount: 1, description: '状態異常を1つ解除' },
  { name: 'リジェネレート', type: 'recovery', element: 'none', spCost: 10, power: 30, target: 'single', hitCount: 1, description: '3ターンの間HP自動回復', effects: [{ type: 'regen', multiplier: 0.1, duration: 3 }] },
];

// ===== 補助星術 =====
export const SUPPORT_SKILLS: Skill[] = [
  { name: 'パワーチャージ', type: 'support', element: 'none', spCost: 8, power: 0, target: 'single', hitCount: 1, description: '味方1人の攻撃力1.3倍（3ターン）', effects: [{ type: 'atkUp', multiplier: 1.3, duration: 3 }] },
  { name: 'シールドアップ', type: 'support', element: 'none', spCost: 8, power: 0, target: 'single', hitCount: 1, description: '味方1人の防御力1.3倍（3ターン）', effects: [{ type: 'defUp', multiplier: 1.3, duration: 3 }] },
  { name: 'ヘイスト', type: 'support', element: 'none', spCost: 10, power: 0, target: 'single', hitCount: 1, description: '味方1人のATB速度1.5倍（3ターン）', effects: [{ type: 'spdUp', multiplier: 1.5, duration: 3 }] },
  { name: 'ウィークネス', type: 'support', element: 'none', spCost: 10, power: 0, target: 'single', hitCount: 1, description: '敵1体の防御力0.7倍（3ターン）', effects: [{ type: 'defDown', multiplier: 0.7, duration: 3 }] },
  { name: 'スロウダウン', type: 'support', element: 'none', spCost: 10, power: 0, target: 'single', hitCount: 1, description: '敵1体のATB速度0.5倍（3ターン）', effects: [{ type: 'spdDown', multiplier: 0.5, duration: 3 }] },
];

// ===== バリア星術 =====
export const BARRIER_SKILLS: Skill[] = [
  {
    name: 'バリア', type: 'support', element: 'none', spCost: 12, power: 0,
    target: 'single', hitCount: 1, description: '味方1人に物理ダメージ半減バリア',
    effects: [{ type: 'barrier', multiplier: 0.5, duration: 5 }],
  },
  {
    name: 'マジックバリア', type: 'support', element: 'none', spCost: 12, power: 0,
    target: 'single', hitCount: 1, description: '味方1人に魔術ダメージ半減バリア',
    effects: [{ type: 'mbarrier', multiplier: 0.5, duration: 5 }],
  },
  {
    name: 'バリアフィールド', type: 'support', element: 'none', spCost: 30, power: 0,
    target: 'all', hitCount: 1, description: '味方全員にバリア+マジックバリア',
    effects: [{ type: 'barrier', multiplier: 0.5, duration: 4 }, { type: 'mbarrier', multiplier: 0.5, duration: 4 }],
  },
];

export const ALL_SKILLS = [...ATTACK_SKILLS, ...RECOVERY_SKILLS, ...SUPPORT_SKILLS, ...BARRIER_SKILLS];

export function getSkillByName(name: string): Skill | undefined {
  return ALL_SKILLS.find(s => s.name === name);
}
