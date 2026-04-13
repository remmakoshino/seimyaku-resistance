// ===== 色定数 =====
export const COLORS = {
  // UIカラーパレット
  MAIN: 0x1B2838,
  SUB: 0xC0C0D0,
  ACCENT: 0x00E676,
  BG: 0x0D1117,
  TEXT: 0xFFFFFF,
  HP_DECREASE: 0xFF4444,
  HP_HEAL: 0x44FF44,
  SP_GAUGE: 0x00BCD4,
  ATB_GAUGE: 0xFFC107,
  AWAKEN_GAUGE: 0xFFD700,
  DANGER: 0xFF1744,
  CMD_WINDOW_BG: 0x0D1117,
  CMD_WINDOW_BORDER: 0x00E676,

  // キャラクターカラー
  REI: 0x3498DB,
  KANADE: 0xE74C3C,
  SALT: 0xBDC3C7,
  JIN: 0xF39C12,
  MISTY: 0x8E44AD,

  // 属性カラー
  FIRE: 0xFF4444,
  ICE: 0x87CEEB,
  THUNDER: 0xFFD700,
  WATER: 0x4488FF,
  LIGHT: 0xFFFFFF,
  DARK: 0x8844AA,
} as const;

export const COLORS_CSS = {
  MAIN: '#1B2838',
  SUB: '#C0C0D0',
  ACCENT: '#00E676',
  BG: '#0D1117',
  TEXT: '#FFFFFF',
  HP_DECREASE: '#FF4444',
  HP_HEAL: '#44FF44',
  SP_GAUGE: '#00BCD4',
  ATB_GAUGE: '#FFC107',
  AWAKEN_GAUGE: '#FFD700',
  DANGER: '#FF1744',
  CMD_WINDOW_BG: 'rgba(13, 17, 23, 0.85)',
  CMD_WINDOW_BORDER: '#00E676',
} as const;

// ===== ゲーム定数 =====
export const GAME = {
  // 基本解像度（ポートレート基準）
  WIDTH: 720,
  HEIGHT: 1280,
  // ランドスケープ
  LANDSCAPE_WIDTH: 1280,
  LANDSCAPE_HEIGHT: 720,
  // ATB
  ATB_BASE_SPEED: 0.8,
  ATB_AGILITY_FACTOR: 0.03,
  ATB_DEFENSE_BONUS: 1.5,
  ATB_MAX: 100,
  // 属性相性
  ELEMENT_WEAK_MULTIPLIER: 1.5,
  ELEMENT_RESIST_MULTIPLIER: 0.5,
  // 覚醒
  AWAKEN_GAUGE_MAX: 100,
  AWAKEN_DAMAGE_GAIN: 15,
  AWAKEN_ALLY_DOWN_GAIN: 30,
  // バトル
  DEFEND_DAMAGE_MULTIPLIER: 0.5,
  // EXP
  BASE_EXP_REQUIRED: 100,
  EXP_GROWTH_RATE: 1.2,
  // レベルキャップ
  MAX_LEVEL: 50,
  // セーフマージン
  SAFE_MARGIN: 0.05,
  // ボタン最小サイズ
  MIN_BUTTON_SIZE: 48,
  // フォント
  FONT_FAMILY: '"M PLUS Rounded 1c", sans-serif',
} as const;

// ===== 属性相性テーブル =====
export type ElementType = 'fire' | 'ice' | 'thunder' | 'water' | 'light' | 'dark' | 'none';

// weaknesses[攻撃属性] = [弱点属性の配列]
export const ELEMENT_WEAKNESS: Record<ElementType, ElementType[]> = {
  fire: ['ice'],
  ice: ['water'],        // 本来の相性は仕様に従う
  thunder: ['fire'],     // 仕様: 雷←火 (火は雷に弱い → 雷で火を攻撃すると弱点)
  water: ['thunder'],
  light: ['dark'],
  dark: ['light'],
  none: [],
};

// 弱点判定
export function getElementMultiplier(attackElement: ElementType, defenseElement: ElementType): number {
  if (attackElement === 'none' || defenseElement === 'none') return 1.0;
  // 攻撃属性が防御属性に対して有利
  if (ELEMENT_WEAKNESS[attackElement].includes(defenseElement)) {
    return GAME.ELEMENT_WEAK_MULTIPLIER;
  }
  // 攻撃属性が防御属性に対して不利
  if (ELEMENT_WEAKNESS[defenseElement].includes(attackElement)) {
    return GAME.ELEMENT_RESIST_MULTIPLIER;
  }
  return 1.0;
}

// ===== シーンキー =====
export const SCENES = {
  BOOT: 'BootScene',
  TITLE: 'TitleScene',
  CHARACTER_SELECT: 'CharacterSelectScene',
  EXPLORATION: 'ExplorationScene',
  BATTLE: 'BattleScene',
  RESULT: 'ResultScene',
  STORY: 'StoryScene',
  SEISHOUSEKI: 'SeishousekiScene',
} as const;
