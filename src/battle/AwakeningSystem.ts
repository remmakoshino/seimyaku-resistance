import { Character, Skill } from '../characters/CharacterData';

// ===== 覚醒技テーブル（設計書10-8準拠） =====
// 各キャラ Lv1-4、基本/応用（B=基本, A=応用）

export interface AwakenTech {
  level: number;
  variant: 'basic' | 'advanced';
  name: string;
  description: string;
  power: number;
  target: 'all' | 'single' | 'self';
  extraEffect?: string;
}

export interface AwakenProgress {
  killCount: number;     // 討伐数（次レベル基本解放用）
  useCount: number[];    // Lv別使用回数 [lv1, lv2, lv3, lv4]
  unlockedTechs: string[]; // 解放済み技名リスト
}

// 覚醒技テーブル
const AWAKEN_TECH_TABLE: Record<string, AwakenTech[]> = {
  rei: [
    { level: 1, variant: 'basic', name: '蒼雷一閃', description: '全体雷属性の大ダメージ', power: 180, target: 'all' },
    { level: 1, variant: 'advanced', name: '雷光連刃', description: '単体に雷属性超大ダメージ×3回', power: 100, target: 'single', extraEffect: '3hit' },
    { level: 2, variant: 'basic', name: '迅雷飛翔斬', description: '全体に雷属性大ダメージ+速度低下', power: 200, target: 'all', extraEffect: 'spdDown' },
    { level: 2, variant: 'advanced', name: '紫電一閃・極', description: '単体に雷属性特大ダメージ', power: 350, target: 'single' },
    { level: 3, variant: 'basic', name: '星脈開放・雷帝', description: '全体雷属性超大ダメージ+ATBリセット', power: 280, target: 'all', extraEffect: 'atbReset' },
    { level: 3, variant: 'advanced', name: '天雷轟刃陣', description: '全体に無属性超大ダメージ', power: 320, target: 'all' },
    { level: 4, variant: 'basic', name: '煌雷・星脈断裂斬', description: '全体に雷+無属性の壊滅的ダメージ', power: 450, target: 'all' },
    { level: 4, variant: 'advanced', name: '星脈覚醒・終焉の雷光', description: '全体雷属性×究極ダメージ', power: 550, target: 'all' },
  ],
  kanade: [
    { level: 1, variant: 'basic', name: '紅蓮旋風脚', description: '全体火属性大ダメージ', power: 180, target: 'all' },
    { level: 1, variant: 'advanced', name: '烈火連撃', description: '単体に火属性超大ダメージ×5回', power: 60, target: 'single', extraEffect: '5hit' },
    { level: 2, variant: 'basic', name: '鳳凰飛翔蹴', description: '全体火属性大ダメージ+攻撃力上昇', power: 200, target: 'all', extraEffect: 'atkUp' },
    { level: 2, variant: 'advanced', name: '爆炎烈脚・乱舞', description: '単体火属性×7回ランダム', power: 50, target: 'single', extraEffect: '7hit' },
    { level: 3, variant: 'basic', name: '星脈開放・炎皇', description: '全体火属性超大ダメージ+全体攻撃力上昇', power: 280, target: 'all', extraEffect: 'partyAtkUp' },
    { level: 3, variant: 'advanced', name: '滅却の真紅蓮', description: '単体に火属性壊滅的ダメージ', power: 500, target: 'single' },
    { level: 4, variant: 'basic', name: '煌炎・星脈爆裂拳', description: '全体に火+無属性の壊滅的ダメージ', power: 450, target: 'all' },
    { level: 4, variant: 'advanced', name: '星脈覚醒・灼熱の終焉', description: '全体火属性×究極ダメージ', power: 550, target: 'all' },
  ],
  salt: [
    { level: 1, variant: 'basic', name: '永久凍土の鎮魂歌', description: '全体氷属性大ダメージ+速度低下', power: 180, target: 'all', extraEffect: 'spdDown' },
    { level: 1, variant: 'advanced', name: '絶対零度', description: '単体に氷属性超大ダメージ+凍結', power: 280, target: 'single', extraEffect: 'freeze' },
    { level: 2, variant: 'basic', name: '極光吹雪', description: '全体氷属性大ダメージ+魔防低下', power: 200, target: 'all', extraEffect: 'mdefDown' },
    { level: 2, variant: 'advanced', name: 'ダイヤモンドダスト', description: '全体に氷属性超大ダメージ', power: 300, target: 'all' },
    { level: 3, variant: 'basic', name: '星脈開放・氷晶帝', description: '全体氷属性超大ダメージ+全体魔攻上昇', power: 280, target: 'all', extraEffect: 'partyMatkUp' },
    { level: 3, variant: 'advanced', name: '凍獄・星晶輪舞', description: '全体氷属性壊滅的ダメージ', power: 400, target: 'all' },
    { level: 4, variant: 'basic', name: '煌氷・星脈凍結界', description: '全体氷+無属性の壊滅的ダメージ', power: 450, target: 'all' },
    { level: 4, variant: 'advanced', name: '星脈覚醒・永久氷獄', description: '全体氷属性×究極ダメージ', power: 550, target: 'all' },
  ],
  jin: [
    { level: 1, variant: 'basic', name: '黄金の加護', description: '全体バリア+光属性大ダメージ', power: 150, target: 'all', extraEffect: 'barrier' },
    { level: 1, variant: 'advanced', name: '鉄壁の光壁', description: '全体バリア+マジックバリア', power: 0, target: 'all', extraEffect: 'fullBarrier' },
    { level: 2, variant: 'basic', name: '聖光の砲撃', description: '全体光属性大ダメージ+全体防御上昇', power: 200, target: 'all', extraEffect: 'partyDefUp' },
    { level: 2, variant: 'advanced', name: '聖盾の堅守', description: '全体バリア+リジェネ', power: 0, target: 'all', extraEffect: 'barrierRegen' },
    { level: 3, variant: 'basic', name: '星脈開放・光盾帝', description: '全体光属性超大ダメージ+全体防御大幅上昇', power: 250, target: 'all', extraEffect: 'partyDefUp' },
    { level: 3, variant: 'advanced', name: '不壊の聖塔', description: '全体に全バリア+HP回復', power: 0, target: 'all', extraEffect: 'fullBarrierHeal' },
    { level: 4, variant: 'basic', name: '煌光・星脈聖壁砲', description: '全体光+無属性壊滅的ダメージ+バリア', power: 400, target: 'all', extraEffect: 'barrier' },
    { level: 4, variant: 'advanced', name: '星脈覚醒・光明の終焉', description: '全体光属性究極ダメージ+全バフ', power: 500, target: 'all', extraEffect: 'fullBuff' },
  ],
  misty: [
    { level: 1, variant: 'basic', name: '深淵の抱擁', description: '全体闇属性大ダメージ+全デバフ', power: 160, target: 'all', extraEffect: 'allDebuff' },
    { level: 1, variant: 'advanced', name: '闇討ち・千影', description: '単体に闇属性超大ダメージ×4回', power: 80, target: 'single', extraEffect: '4hit' },
    { level: 2, variant: 'basic', name: '漆黒の宴', description: '全体闇属性大ダメージ+毒', power: 200, target: 'all', extraEffect: 'poison' },
    { level: 2, variant: 'advanced', name: '影分身・幻影殺法', description: '単体闇属性×6回ランダム', power: 60, target: 'single', extraEffect: '6hit' },
    { level: 3, variant: 'basic', name: '星脈開放・暗影帝', description: '全体闇属性超大ダメージ+攻撃・防御大幅低下', power: 260, target: 'all', extraEffect: 'allDebuff' },
    { level: 3, variant: 'advanced', name: '虚無の深淵', description: '全体闇属性壊滅的ダメージ+即死判定', power: 380, target: 'all', extraEffect: 'instantDeath' },
    { level: 4, variant: 'basic', name: '煌闇・星脈暗殺術', description: '全体闇+無属性壊滅的ダメージ', power: 450, target: 'all' },
    { level: 4, variant: 'advanced', name: '星脈覚醒・暗黒の終焉', description: '全体闇属性究極ダメージ', power: 550, target: 'all' },
  ],
};

// 解放条件
const KILL_THRESHOLDS: Record<number, number> = {
  2: 30,   // Lv2基本: 討伐30体
  3: 80,   // Lv3基本: 討伐80体
};

const USE_THRESHOLDS: Record<number, number> = {
  1: 10,   // Lv1応用: Lv1を10回使用
  2: 15,   // Lv2応用: Lv2を15回使用
  3: 20,   // Lv3応用: Lv3を20回使用
};

// ===== デフォルトの覚醒進行状態 =====
export function createDefaultAwakenProgress(): AwakenProgress {
  return {
    killCount: 0,
    useCount: [0, 0, 0, 0],
    unlockedTechs: [],
  };
}

// ===== 利用可能な覚醒技一覧 =====
export function getAvailableAwakenTechs(charId: string, progress: AwakenProgress, awakenLevel: number): AwakenTech[] {
  const table = AWAKEN_TECH_TABLE[charId];
  if (!table) return [];

  return table.filter(tech => {
    if (tech.level > awakenLevel) return false;
    // Lv1基本は最初から解放
    if (tech.level === 1 && tech.variant === 'basic') return true;
    return progress.unlockedTechs.includes(tech.name);
  });
}

// ===== 討伐時の解放チェック =====
export function checkKillUnlock(charId: string, progress: AwakenProgress): string[] {
  const table = AWAKEN_TECH_TABLE[charId];
  if (!table) return [];

  const newUnlocks: string[] = [];

  for (const [levelStr, threshold] of Object.entries(KILL_THRESHOLDS)) {
    const level = parseInt(levelStr, 10);
    const tech = table.find(t => t.level === level && t.variant === 'basic');
    if (tech && !progress.unlockedTechs.includes(tech.name) && progress.killCount >= threshold) {
      progress.unlockedTechs.push(tech.name);
      newUnlocks.push(tech.name);
    }
  }

  return newUnlocks;
}

// ===== 使用時の応用技解放チェック =====
export function checkUseUnlock(charId: string, progress: AwakenProgress, usedTechLevel: number): string[] {
  const table = AWAKEN_TECH_TABLE[charId];
  if (!table) return [];

  const newUnlocks: string[] = [];
  const threshold = USE_THRESHOLDS[usedTechLevel];
  if (!threshold) return [];

  const advancedTech = table.find(t => t.level === usedTechLevel && t.variant === 'advanced');
  if (advancedTech && !progress.unlockedTechs.includes(advancedTech.name) &&
      progress.useCount[usedTechLevel - 1] >= threshold) {
    progress.unlockedTechs.push(advancedTech.name);
    newUnlocks.push(advancedTech.name);
  }

  return newUnlocks;
}

// ===== 覚醒珠によるLv4解放 =====
export function unlockLevel4(charId: string, progress: AwakenProgress): boolean {
  const table = AWAKEN_TECH_TABLE[charId];
  if (!table) return false;

  const lv4Basic = table.find(t => t.level === 4 && t.variant === 'basic');
  if (lv4Basic && !progress.unlockedTechs.includes(lv4Basic.name)) {
    progress.unlockedTechs.push(lv4Basic.name);
    return true;
  }
  return false;
}

// ===== 覚醒技のデータ取得 =====
export function getAwakenTech(charId: string, techName: string): AwakenTech | undefined {
  return AWAKEN_TECH_TABLE[charId]?.find(t => t.name === techName);
}

// ===== 覚醒技のパワー計算 =====
export function getAwakenPower(charId: string, awakenLevel: number, techName?: string): number {
  const table = AWAKEN_TECH_TABLE[charId];
  if (!table) return 150 + awakenLevel * 30; // fallback

  if (techName) {
    const tech = table.find(t => t.name === techName);
    if (tech) return tech.power;
  }

  // デフォルト: そのレベルの基本技
  const defaultTech = table.find(t => t.level === awakenLevel && t.variant === 'basic');
  return defaultTech?.power ?? 150 + awakenLevel * 30;
}
