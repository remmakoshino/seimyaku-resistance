import { Seishouseki, Skill } from '../characters/CharacterData';
import { ATTACK_SKILLS, RECOVERY_SKILLS, SUPPORT_SKILLS } from '../battle/SkillSystem';
import { ElementType } from '../utils/constants';

// ===== 星晶石カテゴリ別スキル割当 =====
const CATEGORY_SKILLS: Record<string, Skill[]> = {
  attack_fire: ATTACK_SKILLS.filter(s => s.element === 'fire'),
  attack_ice: ATTACK_SKILLS.filter(s => s.element === 'ice'),
  attack_thunder: ATTACK_SKILLS.filter(s => s.element === 'thunder'),
  attack_water: ATTACK_SKILLS.filter(s => s.element === 'water'),
  attack_light: ATTACK_SKILLS.filter(s => s.element === 'light'),
  attack_dark: ATTACK_SKILLS.filter(s => s.element === 'dark'),
  recovery: RECOVERY_SKILLS,
  support: SUPPORT_SKILLS,
};

// ===== 支援星晶石タイプ =====
export type SupportLinkType = 'globalize' | 'elementGrant' | 'elementResist' | 'absorb' | 'counter' | 'preemptive';

export interface SupportSeishouseki {
  id: string;
  name: string;
  linkType: SupportLinkType;
  element?: ElementType;
  description: string;
  color: string;
}

// ===== 連結穴スロット =====
export interface SeishousekiSlot {
  seishouseki: Seishouseki | null;
  linkedSlotIndex: number | null; // 連結先のスロットindex (-1 = 独立穴)
}

export interface SupportSlot {
  support: SupportSeishouseki | null;
  linkedSlotIndex: number; // 対応する通常スロットのindex
}

// ===== 装備のスロット構成 =====
export interface EquipmentSlots {
  // 武器: ○=○  ○  ○=○ (6穴: 0=1, 2, 3=4 ただし5穴のものもある)
  // 防具: ○=○  ○=○ (4穴: 0=1, 2=3)
  // 装飾: ○ (1穴: 0)
  normalSlots: (Seishouseki | null)[];
  supportSlots: (SupportSeishouseki | null)[];
  links: [number, number][]; // 連結ペア [normalIndex, supportIndex]
}

// ===== デフォルトの装備スロット構成 =====
export function createWeaponSlots(slotCount: number): EquipmentSlots {
  // 武器: 連結穴構成 ○=○ ○ ○=○ (3連結穴 + 1独立穴 = 5通常 + 2支援)
  const normalSlots: (Seishouseki | null)[] = Array(slotCount).fill(null);
  const supportSlots: (SupportSeishouseki | null)[] = [];
  const links: [number, number][] = [];

  if (slotCount >= 2) {
    supportSlots.push(null);
    links.push([0, 0]); // slot0とsupport0が連結
  }
  if (slotCount >= 4) {
    supportSlots.push(null);
    links.push([2, 1]); // slot2とsupport1が連結
  }

  return { normalSlots, supportSlots, links };
}

export function createArmorSlots(slotCount: number): EquipmentSlots {
  // 防具: ○=○ ○=○
  const normalSlots: (Seishouseki | null)[] = Array(slotCount).fill(null);
  const supportSlots: (SupportSeishouseki | null)[] = [];
  const links: [number, number][] = [];

  if (slotCount >= 2) {
    supportSlots.push(null);
    links.push([0, 0]);
  }
  if (slotCount >= 4) {
    supportSlots.push(null);
    links.push([2, 1]);
  }

  return { normalSlots, supportSlots, links };
}

export function createAccessorySlots(): EquipmentSlots {
  // 装飾: ○ (独立穴のみ)
  return { normalSlots: [null], supportSlots: [], links: [] };
}

// ===== 星晶石マスターデータ =====
export interface SeishousekiTemplate {
  id: string;
  name: string;
  category: Seishouseki['category'];
  element: ElementType;
  color: string;
  maxLevel: number;
  skillsPerLevel: Record<number, string[]>; // レベルごとに習得するスキル名
}

export const SEISHOUSEKI_TEMPLATES: SeishousekiTemplate[] = [
  // 攻撃星晶
  {
    id: 'fire_seishouseki', name: '炎の星晶石', category: 'attack', element: 'fire', color: '#FF4444', maxLevel: 5,
    skillsPerLevel: { 1: ['フレイムバレット'], 3: ['ブレイズストーム'] },
  },
  {
    id: 'ice_seishouseki', name: '氷の星晶石', category: 'attack', element: 'ice', color: '#87CEEB', maxLevel: 5,
    skillsPerLevel: { 1: ['フロストエッジ'], 3: ['ブリザードフィールド'] },
  },
  {
    id: 'thunder_seishouseki', name: '雷の星晶石', category: 'attack', element: 'thunder', color: '#FFD700', maxLevel: 5,
    skillsPerLevel: { 1: ['サンダーボルト'], 3: ['ライトニングチェーン'] },
  },
  {
    id: 'water_seishouseki', name: '水の星晶石', category: 'attack', element: 'water', color: '#4488FF', maxLevel: 5,
    skillsPerLevel: { 1: ['アクアスラッシュ'], 3: ['タイダルウェーブ'] },
  },
  {
    id: 'light_seishouseki', name: '光の星晶石', category: 'attack', element: 'light', color: '#FFFFCC', maxLevel: 5,
    skillsPerLevel: { 1: ['ルミナスレイ'] },
  },
  {
    id: 'dark_seishouseki', name: '闇の星晶石', category: 'attack', element: 'dark', color: '#AA55DD', maxLevel: 5,
    skillsPerLevel: { 1: ['シャドウバインド'] },
  },
  // 回復星晶
  {
    id: 'heal_seishouseki', name: '回復の星晶石', category: 'recovery', element: 'none', color: '#44FF88', maxLevel: 5,
    skillsPerLevel: { 1: ['ヒールライト'], 2: ['クレンズ'], 3: ['ヒールフィールド'], 4: ['リジェネレート'], 5: ['リヴァイブ'] },
  },
  // 補助星晶
  {
    id: 'support_seishouseki', name: '補助の星晶石', category: 'support', element: 'none', color: '#FFCC44', maxLevel: 5,
    skillsPerLevel: { 1: ['パワーチャージ'], 2: ['シールドアップ'], 3: ['ヘイスト'], 4: ['ウィークネス'], 5: ['スロウダウン'] },
  },
  // バリア星晶
  {
    id: 'barrier_seishouseki', name: '障壁の星晶石', category: 'support', element: 'none', color: '#88AAFF', maxLevel: 3,
    skillsPerLevel: { 1: ['バリア'], 2: ['マジックバリア'], 3: ['バリアフィールド'] },
  },
];

// ===== 支援星晶石マスターデータ =====
export const SUPPORT_SEISHOUSEKI_TEMPLATES: SupportSeishouseki[] = [
  { id: 'globalize', name: '全域化', linkType: 'globalize', description: '連結した星術の対象が全体化', color: '#88FF88' },
  { id: 'element_grant', name: '属性付与', linkType: 'elementGrant', description: '連結した星晶石の属性を通常攻撃に付加', color: '#FF8888' },
  { id: 'element_resist', name: '属性耐性', linkType: 'elementResist', description: '連結した星晶石の属性ダメージを軽減', color: '#8888FF' },
  { id: 'absorb', name: '吸収化', linkType: 'absorb', description: '連結した攻撃星術にHP吸収効果を付与', color: '#FF88FF' },
  { id: 'counter', name: '反撃連動', linkType: 'counter', description: '被ダメージ時に自動で連結星術を発動', color: '#FFAA44' },
  { id: 'preemptive', name: '先制連動', linkType: 'preemptive', description: '戦闘開始時に自動で連結星術を発動', color: '#44FFAA' },
];

// ===== 星晶石インスタンス生成 =====
let seishousekiIdCounter = 0;

export function createSeishouseki(templateId: string): Seishouseki | null {
  const template = SEISHOUSEKI_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;

  const id = `${templateId}_${Date.now()}_${seishousekiIdCounter++}`;
  const initialSkills = getSkillsForLevel(template, 1);

  return {
    id,
    name: template.name,
    category: template.category,
    level: 1,
    maxLevel: template.maxLevel,
    smp: 0,
    smpToNext: getSmpRequired(1),
    skills: initialSkills,
    color: template.color,
  };
}

function getSkillsForLevel(template: SeishousekiTemplate, level: number): Skill[] {
  const skills: Skill[] = [];
  for (let lv = 1; lv <= level; lv++) {
    const names = template.skillsPerLevel[lv];
    if (names) {
      for (const name of names) {
        const allSkills = [...ATTACK_SKILLS, ...RECOVERY_SKILLS, ...SUPPORT_SKILLS, ...BARRIER_SKILLS];
        const skill = allSkills.find(s => s.name === name);
        if (skill) skills.push(skill);
      }
    }
  }
  return skills;
}

function getSmpRequired(level: number): number {
  return Math.floor(50 * Math.pow(1.5, level - 1));
}

// ===== バリア星術 =====
export const BARRIER_SKILLS: Skill[] = [
  {
    name: 'バリア', type: 'support', element: 'none', spCost: 12, power: 0,
    target: 'single', hitCount: 1, description: '味方1人に物理ダメージ半減バリア（時間制限付き）',
    effects: [{ type: 'barrier', multiplier: 0.5, duration: 5 }],
  },
  {
    name: 'マジックバリア', type: 'support', element: 'none', spCost: 12, power: 0,
    target: 'single', hitCount: 1, description: '味方1人に魔術ダメージ半減バリア（時間制限付き）',
    effects: [{ type: 'mbarrier', multiplier: 0.5, duration: 5 }],
  },
  {
    name: 'バリアフィールド', type: 'support', element: 'none', spCost: 30, power: 0,
    target: 'all', hitCount: 1, description: '味方全員にバリア+マジックバリア',
    effects: [{ type: 'barrier', multiplier: 0.5, duration: 4 }, { type: 'mbarrier', multiplier: 0.5, duration: 4 }],
  },
];

// ===== 星晶石レベルアップ =====
export function addSmpToSeishouseki(seishouseki: Seishouseki, amount: number): { leveled: boolean; duplicated: boolean } {
  const template = SEISHOUSEKI_TEMPLATES.find(t => seishouseki.name === t.name);
  if (!template) return { leveled: false, duplicated: false };

  seishouseki.smp += amount;
  let leveled = false;
  let duplicated = false;

  while (seishouseki.smp >= seishouseki.smpToNext && seishouseki.level < seishouseki.maxLevel) {
    seishouseki.smp -= seishouseki.smpToNext;
    seishouseki.level++;
    seishouseki.smpToNext = getSmpRequired(seishouseki.level);
    seishouseki.skills = getSkillsForLevel(template, seishouseki.level);
    leveled = true;
  }

  // MAX到達時に増殖
  if (seishouseki.level >= seishouseki.maxLevel && seishouseki.smp >= seishouseki.smpToNext) {
    duplicated = true;
  }

  return { leveled, duplicated };
}

// ===== 連結効果の判定 =====
export interface LinkEffect {
  type: SupportLinkType;
  element?: ElementType;
  linkedSkills: Skill[];
}

export function getLinkEffects(slots: EquipmentSlots): LinkEffect[] {
  const effects: LinkEffect[] = [];

  for (const [normalIdx, supportIdx] of slots.links) {
    const normal = slots.normalSlots[normalIdx];
    const support = slots.supportSlots[supportIdx];
    if (!normal || !support) continue;

    const template = SEISHOUSEKI_TEMPLATES.find(t => t.name === normal.name);
    effects.push({
      type: support.linkType,
      element: template?.element,
      linkedSkills: normal.skills,
    });
  }

  return effects;
}

// ===== キャラの装備星晶石から使用可能なスキル一覧を取得 =====
export function getAvailableSkillsFromSeishouseki(seishousekiList: Seishouseki[]): Skill[] {
  const skills: Skill[] = [];
  const seen = new Set<string>();

  for (const s of seishousekiList) {
    for (const skill of s.skills) {
      if (!seen.has(skill.name)) {
        seen.add(skill.name);
        skills.push(skill);
      }
    }
  }

  return skills;
}
