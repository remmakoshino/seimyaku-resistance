import Phaser from 'phaser';

// キャラクター描画ユーティリティ — Canvas 2D API でアニメ風JRPGキャラを生成

export interface CharacterSpriteConfig {
  id: string;
  hairColor: string;
  hairStyle: 'medium' | 'ponytail' | 'long' | 'short' | 'asymmetric';
  eyeColor: string;
  skinColor: string;
  outfitPrimary: string;
  outfitSecondary: string;
  weaponType: 'sword' | 'fist' | 'staff' | 'shieldgun' | 'daggers';
  scale: number; // 1 = battle (5頭身), 0.6 = field (3頭身)
  accentColor: string;
}

export const CHARACTER_CONFIGS: Record<string, CharacterSpriteConfig> = {
  rei: {
    id: 'rei',
    hairColor: '#6BA3D6',
    hairStyle: 'medium',
    eyeColor: '#3498DB',
    skinColor: '#FFE0BD',
    outfitPrimary: '#1a1a2e',
    outfitSecondary: '#3498DB',
    weaponType: 'sword',
    scale: 1,
    accentColor: '#3498DB',
  },
  kanade: {
    id: 'kanade',
    hairColor: '#8B0000',
    hairStyle: 'ponytail',
    eyeColor: '#D4A574',
    skinColor: '#FFE0BD',
    outfitPrimary: '#2d0a0a',
    outfitSecondary: '#E74C3C',
    weaponType: 'fist',
    scale: 1,
    accentColor: '#E74C3C',
  },
  salt: {
    id: 'salt',
    hairColor: '#E8E8F0',
    hairStyle: 'long',
    eyeColor: '#ADD8E6',
    skinColor: '#FFF0E0',
    outfitPrimary: '#FFFFFF',
    outfitSecondary: '#C0C0D0',
    weaponType: 'staff',
    scale: 1,
    accentColor: '#BDC3C7',
  },
  jin: {
    id: 'jin',
    hairColor: '#1a1a1a',
    hairStyle: 'short',
    eyeColor: '#DAA520',
    skinColor: '#DEB887',
    outfitPrimary: '#2F4F4F',
    outfitSecondary: '#F39C12',
    weaponType: 'shieldgun',
    scale: 1,
    accentColor: '#F39C12',
  },
  misty: {
    id: 'misty',
    hairColor: '#4B0082',
    hairStyle: 'asymmetric',
    eyeColor: '#9370DB',
    skinColor: '#FFF5EE',
    outfitPrimary: '#0a0a0a',
    outfitSecondary: '#8E44AD',
    weaponType: 'daggers',
    scale: 1,
    accentColor: '#8E44AD',
  },
};

export class SpriteGenerator {
  static generateCharacterTexture(
    scene: Phaser.Scene,
    config: CharacterSpriteConfig,
    width: number,
    height: number,
    textureKey: string,
  ): void {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, width, height);

    const scale = config.scale;
    const centerX = width / 2;

    // 5頭身キャラ描画
    const headSize = height * 0.18 * scale;
    const bodyHeight = height * 0.35 * scale;
    const legHeight = height * 0.25 * scale;
    const headY = height * 0.15;

    // === 足 ===
    const legY = headY + headSize + bodyHeight;
    ctx.fillStyle = config.outfitPrimary;
    // 左足
    ctx.fillRect(centerX - headSize * 0.4, legY, headSize * 0.3, legHeight);
    // 右足
    ctx.fillRect(centerX + headSize * 0.1, legY, headSize * 0.3, legHeight);
    // ブーツ
    ctx.fillStyle = '#333333';
    ctx.fillRect(centerX - headSize * 0.45, legY + legHeight * 0.75, headSize * 0.35, legHeight * 0.25);
    ctx.fillRect(centerX + headSize * 0.05, legY + legHeight * 0.75, headSize * 0.35, legHeight * 0.25);

    // === 体 ===
    const bodyY = headY + headSize;
    ctx.fillStyle = config.outfitPrimary;
    ctx.beginPath();
    ctx.roundRect(centerX - headSize * 0.55, bodyY, headSize * 1.1, bodyHeight, 4);
    ctx.fill();

    // 衣装ディテール
    ctx.fillStyle = config.outfitSecondary;
    // 襟/ライン
    ctx.fillRect(centerX - 2, bodyY, 4, bodyHeight * 0.8);
    // ベルト
    ctx.fillRect(centerX - headSize * 0.5, bodyY + bodyHeight * 0.7, headSize * 1.0, bodyHeight * 0.08);

    // === 腕 ===
    ctx.fillStyle = config.outfitPrimary;
    // 左腕
    ctx.fillRect(centerX - headSize * 0.8, bodyY + headSize * 0.1, headSize * 0.25, bodyHeight * 0.7);
    // 右腕
    ctx.fillRect(centerX + headSize * 0.55, bodyY + headSize * 0.1, headSize * 0.25, bodyHeight * 0.7);
    // 手
    ctx.fillStyle = config.skinColor;
    ctx.beginPath();
    ctx.arc(centerX - headSize * 0.68, bodyY + bodyHeight * 0.75, headSize * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + headSize * 0.68, bodyY + bodyHeight * 0.75, headSize * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // === 武器 ===
    SpriteGenerator.drawWeapon(ctx, config, centerX, bodyY, headSize, bodyHeight);

    // === 頭部 ===
    // 顔の輪郭
    ctx.fillStyle = config.skinColor;
    ctx.beginPath();
    ctx.ellipse(centerX, headY + headSize * 0.5, headSize * 0.45, headSize * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 髪（後ろ）
    SpriteGenerator.drawHairBack(ctx, config, centerX, headY, headSize);

    // 目
    SpriteGenerator.drawEyes(ctx, config, centerX, headY, headSize);

    // 口
    ctx.strokeStyle = '#CC9988';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, headY + headSize * 0.65, headSize * 0.08, 0.1, Math.PI - 0.1);
    ctx.stroke();

    // 髪（前）
    SpriteGenerator.drawHairFront(ctx, config, centerX, headY, headSize);

    // キャラクターカラーのオーラ（薄く）
    const grad = ctx.createRadialGradient(centerX, headY + headSize, 0, centerX, headY + headSize, height * 0.4);
    grad.addColorStop(0, config.accentColor + '15');
    grad.addColorStop(1, config.accentColor + '00');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // テクスチャ登録
    if (scene.textures.exists(textureKey)) {
      scene.textures.remove(textureKey);
    }
    scene.textures.addCanvas(textureKey, canvas);
  }

  private static drawWeapon(
    ctx: CanvasRenderingContext2D,
    config: CharacterSpriteConfig,
    cx: number,
    bodyY: number,
    headSize: number,
    bodyHeight: number,
  ): void {
    switch (config.weaponType) {
      case 'sword':
        // 背中の剣
        ctx.save();
        ctx.translate(cx + headSize * 0.6, bodyY - headSize * 0.2);
        ctx.rotate(0.3);
        ctx.fillStyle = '#A0A0B0';
        ctx.fillRect(-3, 0, 6, headSize * 1.8);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-6, headSize * 1.7, 12, 8);
        ctx.fillStyle = '#4A3728';
        ctx.fillRect(-4, headSize * 1.78, 8, headSize * 0.4);
        ctx.restore();
        break;
      case 'fist':
        // グローブ
        ctx.fillStyle = '#CC3333';
        ctx.beginPath();
        ctx.arc(cx - headSize * 0.68, bodyY + bodyHeight * 0.75, headSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + headSize * 0.68, bodyY + bodyHeight * 0.75, headSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'staff':
        // 杖
        ctx.save();
        ctx.translate(cx + headSize * 0.75, bodyY);
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(-2, -headSize * 0.5, 4, headSize * 2.5);
        // 杖の先端のクリスタル
        ctx.fillStyle = '#ADD8E6';
        ctx.beginPath();
        ctx.moveTo(0, -headSize * 0.5);
        ctx.lineTo(-8, -headSize * 0.7);
        ctx.lineTo(0, -headSize * 0.9);
        ctx.lineTo(8, -headSize * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FFFFFF44';
        ctx.beginPath();
        ctx.arc(0, -headSize * 0.7, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      case 'shieldgun':
        // 大盾（右腕）
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.roundRect(cx + headSize * 0.5, bodyY + headSize * 0.05, headSize * 0.55, bodyHeight * 0.8, 4);
        ctx.fill();
        ctx.fillStyle = config.outfitSecondary;
        ctx.fillRect(cx + headSize * 0.6, bodyY + bodyHeight * 0.15, headSize * 0.35, bodyHeight * 0.5);
        // 銃（左手）
        ctx.fillStyle = '#333333';
        ctx.fillRect(cx - headSize * 0.95, bodyY + bodyHeight * 0.6, headSize * 0.4, 6);
        ctx.fillRect(cx - headSize * 0.75, bodyY + bodyHeight * 0.5, 6, bodyHeight * 0.15);
        break;
      case 'daggers':
        // 双短剣
        ctx.save();
        ctx.fillStyle = '#C0C0D0';
        // 左
        ctx.translate(cx - headSize * 0.7, bodyY + bodyHeight * 0.7);
        ctx.rotate(-0.5);
        ctx.fillRect(-2, -headSize * 0.4, 4, headSize * 0.6);
        ctx.fillStyle = '#4B0082';
        ctx.fillRect(-4, 0, 8, 4);
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#C0C0D0';
        // 右
        ctx.translate(cx + headSize * 0.7, bodyY + bodyHeight * 0.7);
        ctx.rotate(0.5);
        ctx.fillRect(-2, -headSize * 0.4, 4, headSize * 0.6);
        ctx.fillStyle = '#4B0082';
        ctx.fillRect(-4, 0, 8, 4);
        ctx.restore();
        break;
    }
  }

  private static drawEyes(
    ctx: CanvasRenderingContext2D,
    config: CharacterSpriteConfig,
    cx: number,
    headY: number,
    headSize: number,
  ): void {
    const eyeY = headY + headSize * 0.4;
    const eyeSpacing = headSize * 0.2;
    const eyeW = headSize * 0.14;
    const eyeH = headSize * 0.18;

    for (const side of [-1, 1]) {
      const ex = cx + side * eyeSpacing;

      // 白目
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();

      // 虹彩グラデーション
      const irisGrad = ctx.createRadialGradient(ex, eyeY, 0, ex, eyeY, eyeW * 0.8);
      irisGrad.addColorStop(0, config.eyeColor);
      irisGrad.addColorStop(1, SpriteGenerator.darkenColor(config.eyeColor, 0.4));
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW * 0.75, eyeH * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // 瞳孔
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY + 1, eyeW * 0.3, eyeH * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // ハイライト
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex - eyeW * 0.2, eyeY - eyeH * 0.2, eyeW * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + eyeW * 0.15, eyeY + eyeH * 0.15, eyeW * 0.1, 0, Math.PI * 2);
      ctx.fill();

      // まつ毛/眉
      ctx.strokeStyle = SpriteGenerator.darkenColor(config.hairColor, 0.3);
      ctx.lineWidth = 2;
      // 上まぶた
      ctx.beginPath();
      ctx.ellipse(ex, eyeY - eyeH * 0.1, eyeW * 1.1, eyeH * 0.5, 0, Math.PI + 0.3, -0.3);
      ctx.stroke();
    }

    // 眉毛
    ctx.strokeStyle = SpriteGenerator.darkenColor(config.hairColor, 0.3);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - eyeSpacing - eyeW, headY + headSize * 0.28);
    ctx.quadraticCurveTo(cx - eyeSpacing, headY + headSize * 0.24, cx - eyeSpacing + eyeW, headY + headSize * 0.28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + eyeSpacing - eyeW, headY + headSize * 0.28);
    ctx.quadraticCurveTo(cx + eyeSpacing, headY + headSize * 0.24, cx + eyeSpacing + eyeW, headY + headSize * 0.28);
    ctx.stroke();
  }

  private static drawHairBack(
    ctx: CanvasRenderingContext2D,
    config: CharacterSpriteConfig,
    cx: number,
    headY: number,
    headSize: number,
  ): void {
    ctx.fillStyle = config.hairColor;

    switch (config.hairStyle) {
      case 'medium':
        // レイ: ミディアム、首まで
        ctx.beginPath();
        ctx.ellipse(cx, headY + headSize * 0.35, headSize * 0.55, headSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        // サイドの髪
        ctx.fillRect(cx - headSize * 0.52, headY + headSize * 0.5, headSize * 0.15, headSize * 0.5);
        ctx.fillRect(cx + headSize * 0.37, headY + headSize * 0.5, headSize * 0.15, headSize * 0.5);
        break;
      case 'ponytail':
        // カナデ: ポニーテール
        ctx.beginPath();
        ctx.ellipse(cx, headY + headSize * 0.3, headSize * 0.5, headSize * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        // ポニテ
        ctx.beginPath();
        ctx.moveTo(cx + headSize * 0.1, headY + headSize * 0.1);
        ctx.quadraticCurveTo(cx + headSize * 0.7, headY, cx + headSize * 0.5, headY + headSize * 1.2);
        ctx.quadraticCurveTo(cx + headSize * 0.3, headY + headSize * 1.0, cx + headSize * 0.1, headY + headSize * 0.3);
        ctx.fill();
        break;
      case 'long':
        // ソルト: ロング三つ編み
        ctx.beginPath();
        ctx.ellipse(cx, headY + headSize * 0.35, headSize * 0.55, headSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        // 長い髪（左サイド三つ編み）
        ctx.beginPath();
        ctx.moveTo(cx - headSize * 0.4, headY + headSize * 0.6);
        for (let i = 0; i < 6; i++) {
          const y = headY + headSize * 0.7 + i * headSize * 0.15;
          const x = cx - headSize * 0.4 + (i % 2 === 0 ? -5 : 5);
          ctx.quadraticCurveTo(x, y, cx - headSize * 0.4, y + headSize * 0.08);
        }
        ctx.lineTo(cx - headSize * 0.35, headY + headSize * 0.6);
        ctx.fill();
        break;
      case 'short':
        // ジン: 短髪
        ctx.beginPath();
        ctx.ellipse(cx, headY + headSize * 0.3, headSize * 0.5, headSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'asymmetric':
        // ミスティ: アシンメトリーボブ
        ctx.beginPath();
        ctx.ellipse(cx, headY + headSize * 0.35, headSize * 0.52, headSize * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();
        // 左側が長い
        ctx.fillRect(cx - headSize * 0.52, headY + headSize * 0.5, headSize * 0.2, headSize * 0.7);
        break;
    }
  }

  private static drawHairFront(
    ctx: CanvasRenderingContext2D,
    config: CharacterSpriteConfig,
    cx: number,
    headY: number,
    headSize: number,
  ): void {
    ctx.fillStyle = config.hairColor;

    switch (config.hairStyle) {
      case 'medium':
        // 前髪（片目にかかる）
        ctx.beginPath();
        ctx.moveTo(cx - headSize * 0.45, headY + headSize * 0.15);
        ctx.quadraticCurveTo(cx - headSize * 0.3, headY - headSize * 0.15, cx + headSize * 0.1, headY + headSize * 0.05);
        ctx.quadraticCurveTo(cx + headSize * 0.3, headY + headSize * 0.1, cx + headSize * 0.15, headY + headSize * 0.45);
        ctx.lineTo(cx + headSize * 0.05, headY + headSize * 0.35);
        ctx.quadraticCurveTo(cx, headY + headSize * 0.15, cx - headSize * 0.3, headY + headSize * 0.2);
        ctx.fill();
        break;
      case 'ponytail':
        // 前髪（ぱっつん + サイド短い房）
        ctx.beginPath();
        ctx.moveTo(cx - headSize * 0.45, headY + headSize * 0.35);
        ctx.lineTo(cx - headSize * 0.4, headY + headSize * 0.05);
        ctx.quadraticCurveTo(cx, headY - headSize * 0.1, cx + headSize * 0.4, headY + headSize * 0.05);
        ctx.lineTo(cx + headSize * 0.45, headY + headSize * 0.35);
        ctx.lineTo(cx + headSize * 0.35, headY + headSize * 0.3);
        ctx.lineTo(cx, headY + headSize * 0.2);
        ctx.lineTo(cx - headSize * 0.35, headY + headSize * 0.3);
        ctx.fill();
        break;
      case 'long':
        // 前髪（サイドに流れる）
        ctx.beginPath();
        ctx.moveTo(cx - headSize * 0.45, headY + headSize * 0.35);
        ctx.quadraticCurveTo(cx - headSize * 0.2, headY - headSize * 0.1, cx + headSize * 0.1, headY + headSize * 0.1);
        ctx.quadraticCurveTo(cx + headSize * 0.3, headY + headSize * 0.05, cx + headSize * 0.4, headY + headSize * 0.25);
        ctx.lineTo(cx + headSize * 0.3, headY + headSize * 0.2);
        ctx.quadraticCurveTo(cx, headY + headSize * 0.1, cx - headSize * 0.35, headY + headSize * 0.3);
        ctx.fill();
        break;
      case 'short':
        // 前髪（短く上に）
        ctx.beginPath();
        ctx.moveTo(cx - headSize * 0.35, headY + headSize * 0.2);
        ctx.quadraticCurveTo(cx - headSize * 0.1, headY - headSize * 0.05, cx + headSize * 0.2, headY + headSize * 0.1);
        ctx.quadraticCurveTo(cx + headSize * 0.35, headY + headSize * 0.15, cx + headSize * 0.35, headY + headSize * 0.2);
        ctx.lineTo(cx + headSize * 0.25, headY + headSize * 0.18);
        ctx.quadraticCurveTo(cx, headY + headSize * 0.08, cx - headSize * 0.25, headY + headSize * 0.18);
        ctx.fill();
        break;
      case 'asymmetric':
        // 前髪（左が長い、右が短い）
        ctx.beginPath();
        ctx.moveTo(cx - headSize * 0.5, headY + headSize * 0.5);
        ctx.quadraticCurveTo(cx - headSize * 0.3, headY - headSize * 0.05, cx + headSize * 0.1, headY + headSize * 0.1);
        ctx.lineTo(cx + headSize * 0.35, headY + headSize * 0.25);
        ctx.lineTo(cx + headSize * 0.25, headY + headSize * 0.2);
        ctx.quadraticCurveTo(cx, headY + headSize * 0.12, cx - headSize * 0.35, headY + headSize * 0.4);
        ctx.fill();
        break;
    }
  }

  static darkenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * (1 - factor))}, ${Math.floor(g * (1 - factor))}, ${Math.floor(b * (1 - factor))})`;
  }

  static lightenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.min(255, Math.floor(r + (255 - r) * factor))}, ${Math.min(255, Math.floor(g + (255 - g) * factor))}, ${Math.min(255, Math.floor(b + (255 - b) * factor))})`;
  }

  /**
   * 歩行スプライトシート生成（4フレーム横並び）
   * frame 0: 立ち
   * frame 1: 左足前
   * frame 2: 立ち
   * frame 3: 右足前
   */
  static generateWalkFrames(
    scene: Phaser.Scene,
    config: CharacterSpriteConfig,
    frameW: number,
    frameH: number,
    textureKey: string,
  ): void {
    const totalFrames = 4;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * totalFrames;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;

    const legOffsets = [0, -1, 0, 1]; // 足の開き（-1:左前, 0:直立, 1:右前）
    const bodyBob = [0, -1, 0, -1]; // 歩行時の上下揺れ

    for (let frame = 0; frame < totalFrames; frame++) {
      const offsetX = frame * frameW;
      const legOffset = legOffsets[frame];
      const bob = bodyBob[frame];

      ctx.save();
      ctx.translate(offsetX, 0);
      ctx.clearRect(0, 0, frameW, frameH);

      const scale = config.scale;
      const centerX = frameW / 2;

      const headSize = frameH * 0.18 * scale;
      const bodyHeight = frameH * 0.35 * scale;
      const legHeight = frameH * 0.25 * scale;
      const headY = frameH * 0.15 + bob;

      // === 足（歩行アニメーション付き） ===
      const legY = headY + headSize + bodyHeight;
      const legStride = headSize * 0.3; // 歩幅
      ctx.fillStyle = config.outfitPrimary;

      // 左足
      const leftLegX = centerX - headSize * 0.4 + legOffset * legStride;
      ctx.fillRect(leftLegX, legY, headSize * 0.3, legHeight);
      // 右足
      const rightLegX = centerX + headSize * 0.1 - legOffset * legStride;
      ctx.fillRect(rightLegX, legY, headSize * 0.3, legHeight);
      // ブーツ
      ctx.fillStyle = '#333333';
      ctx.fillRect(leftLegX - headSize * 0.05, legY + legHeight * 0.75, headSize * 0.35, legHeight * 0.25);
      ctx.fillRect(rightLegX - headSize * 0.05, legY + legHeight * 0.75, headSize * 0.35, legHeight * 0.25);

      // === 体 ===
      const bodyY = headY + headSize;
      ctx.fillStyle = config.outfitPrimary;
      ctx.beginPath();
      ctx.roundRect(centerX - headSize * 0.55, bodyY, headSize * 1.1, bodyHeight, 4);
      ctx.fill();
      ctx.fillStyle = config.outfitSecondary;
      ctx.fillRect(centerX - 2, bodyY, 4, bodyHeight * 0.8);
      ctx.fillRect(centerX - headSize * 0.5, bodyY + bodyHeight * 0.7, headSize * 1.0, bodyHeight * 0.08);

      // === 腕（歩行揺れ） ===
      const armSwing = legOffset * headSize * 0.15;
      ctx.fillStyle = config.outfitPrimary;
      ctx.fillRect(centerX - headSize * 0.8, bodyY + headSize * 0.1 - armSwing, headSize * 0.25, bodyHeight * 0.7);
      ctx.fillRect(centerX + headSize * 0.55, bodyY + headSize * 0.1 + armSwing, headSize * 0.25, bodyHeight * 0.7);
      // 手
      ctx.fillStyle = config.skinColor;
      ctx.beginPath();
      ctx.arc(centerX - headSize * 0.68, bodyY + bodyHeight * 0.75 - armSwing, headSize * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + headSize * 0.68, bodyY + bodyHeight * 0.75 + armSwing, headSize * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // === 頭部 ===
      ctx.fillStyle = config.skinColor;
      ctx.beginPath();
      ctx.ellipse(centerX, headY + headSize * 0.5, headSize * 0.45, headSize * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      SpriteGenerator.drawHairBack(ctx, config, centerX, headY, headSize);
      SpriteGenerator.drawEyes(ctx, config, centerX, headY, headSize);
      // 口
      ctx.strokeStyle = '#CC9988';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, headY + headSize * 0.65, headSize * 0.08, 0.1, Math.PI - 0.1);
      ctx.stroke();
      SpriteGenerator.drawHairFront(ctx, config, centerX, headY, headSize);

      ctx.restore();
    }

    // 各フレームを個別Canvas テクスチャとして登録（同期的に使用可能）
    for (let frame = 0; frame < totalFrames; frame++) {
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = frameW;
      frameCanvas.height = frameH;
      const fctx = frameCanvas.getContext('2d')!;
      fctx.drawImage(canvas, frame * frameW, 0, frameW, frameH, 0, 0, frameW, frameH);

      const frameKey = `${textureKey}_f${frame}`;
      if (scene.textures.exists(frameKey)) {
        scene.textures.remove(frameKey);
      }
      scene.textures.addCanvas(frameKey, frameCanvas);
    }
  }
}
