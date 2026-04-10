import Phaser from 'phaser';

// 敵キャラクターをCanvas APIで描画するジェネレーター

export type EnemyCategory = 'mechanical' | 'mutant' | 'mercenary' | 'starbeast' | 'boss';

export class EnemyGenerator {
  static generateEnemyTexture(
    scene: Phaser.Scene,
    category: EnemyCategory,
    enemyId: string,
    width: number,
    height: number,
  ): void {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);

    switch (category) {
      case 'mechanical':
        EnemyGenerator.drawMechanical(ctx, width, height, enemyId);
        break;
      case 'mutant':
        EnemyGenerator.drawMutant(ctx, width, height, enemyId);
        break;
      case 'mercenary':
        EnemyGenerator.drawMercenary(ctx, width, height, enemyId);
        break;
      case 'starbeast':
        EnemyGenerator.drawStarBeast(ctx, width, height, enemyId);
        break;
      case 'boss':
        EnemyGenerator.drawBoss(ctx, width, height, enemyId);
        break;
    }

    const textureKey = `enemy_${enemyId}`;
    if (scene.textures.exists(textureKey)) {
      scene.textures.remove(textureKey);
    }
    scene.textures.addCanvas(textureKey, canvas);
  }

  private static drawMechanical(ctx: CanvasRenderingContext2D, w: number, h: number, id: string): void {
    const cx = w / 2;
    const cy = h / 2;

    // ボディ
    ctx.fillStyle = '#707080';
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.3, cy - h * 0.25, w * 0.6, h * 0.5, 8);
    ctx.fill();

    // メタリックハイライト
    const grad = ctx.createLinearGradient(cx - w * 0.3, cy - h * 0.25, cx + w * 0.3, cy + h * 0.25);
    grad.addColorStop(0, 'rgba(200,200,210,0.3)');
    grad.addColorStop(0.5, 'rgba(100,100,110,0.1)');
    grad.addColorStop(1, 'rgba(60,60,70,0.3)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.3, cy - h * 0.25, w * 0.6, h * 0.5, 8);
    ctx.fill();

    // クロノスロゴ（六角形）
    ctx.fillStyle = '#CC3333';
    ctx.beginPath();
    const logoSize = w * 0.08;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + logoSize * Math.cos(angle);
      const y = cy - h * 0.05 + logoSize * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // 赤い単眼
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(cx, cy - h * 0.18, w * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF6666';
    ctx.beginPath();
    ctx.arc(cx - w * 0.015, cy - h * 0.19, w * 0.02, 0, Math.PI * 2);
    ctx.fill();

    // 赤アクセントライン
    ctx.strokeStyle = '#CC3333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.28, cy - h * 0.1);
    ctx.lineTo(cx + w * 0.28, cy - h * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.28, cy + h * 0.1);
    ctx.lineTo(cx + w * 0.28, cy + h * 0.1);
    ctx.stroke();

    // 脚部
    if (id === 'guardRobot') {
      ctx.fillStyle = '#555565';
      ctx.fillRect(cx - w * 0.2, cy + h * 0.25, w * 0.12, h * 0.2);
      ctx.fillRect(cx + w * 0.08, cy + h * 0.25, w * 0.12, h * 0.2);
      // 足
      ctx.fillRect(cx - w * 0.25, cy + h * 0.42, w * 0.2, h * 0.06);
      ctx.fillRect(cx + w * 0.05, cy + h * 0.42, w * 0.2, h * 0.06);
    } else {
      // ドローン: ホバーユニット
      ctx.fillStyle = '#555565';
      ctx.fillRect(cx - w * 0.35, cy + h * 0.2, w * 0.15, h * 0.04);
      ctx.fillRect(cx + w * 0.2, cy + h * 0.2, w * 0.15, h * 0.04);
      // プロペラ風
      ctx.strokeStyle = '#88889940';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx - w * 0.28, cy + h * 0.24, w * 0.12, h * 0.02, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx + w * 0.28, cy + h * 0.24, w * 0.12, h * 0.02, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private static drawMutant(ctx: CanvasRenderingContext2D, w: number, h: number, _id: string): void {
    const cx = w / 2;
    const cy = h / 2;

    // 有機的フォルム
    ctx.fillStyle = '#4A5A3A';
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.35, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 鱗模様
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const r = w * 0.2;
      ctx.fillStyle = '#3A4A2A';
      ctx.beginPath();
      ctx.ellipse(cx + r * Math.cos(angle), cy + r * Math.sin(angle), w * 0.06, h * 0.05, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    // 星脈エネルギーの光漏れ
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.35);
    glow.addColorStop(0, 'rgba(0, 230, 118, 0.15)');
    glow.addColorStop(0.7, 'rgba(0, 200, 100, 0.05)');
    glow.addColorStop(1, 'rgba(0, 150, 80, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.38, h * 0.33, 0, 0, Math.PI * 2);
    ctx.fill();

    // 複眼
    ctx.fillStyle = '#FFDD00';
    ctx.beginPath();
    ctx.arc(cx - w * 0.1, cy - h * 0.12, w * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + w * 0.08, cy - h * 0.1, w * 0.035, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - w * 0.02, cy - h * 0.15, w * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // 瞳孔
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx - w * 0.1, cy - h * 0.12, w * 0.015, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + w * 0.08, cy - h * 0.1, w * 0.012, 0, Math.PI * 2);
    ctx.fill();

    // 牙
    ctx.fillStyle = '#EEEECC';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.06, cy + h * 0.05);
    ctx.lineTo(cx - w * 0.04, cy + h * 0.15);
    ctx.lineTo(cx - w * 0.02, cy + h * 0.05);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.02, cy + h * 0.05);
    ctx.lineTo(cx + w * 0.04, cy + h * 0.15);
    ctx.lineTo(cx + w * 0.06, cy + h * 0.05);
    ctx.fill();
  }

  private static drawMercenary(ctx: CanvasRenderingContext2D, w: number, h: number, _id: string): void {
    const cx = w / 2;
    const headY = h * 0.15;
    const headSize = h * 0.15;

    // 頭部
    ctx.fillStyle = '#DEB887';
    ctx.beginPath();
    ctx.ellipse(cx, headY + headSize * 0.5, headSize * 0.4, headSize * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ヘルメット
    ctx.fillStyle = '#2F4F4F';
    ctx.beginPath();
    ctx.ellipse(cx, headY + headSize * 0.3, headSize * 0.45, headSize * 0.4, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // バイザー
    ctx.fillStyle = '#FF444488';
    ctx.fillRect(cx - headSize * 0.35, headY + headSize * 0.3, headSize * 0.7, headSize * 0.15);

    // 体
    ctx.fillStyle = '#2F4F4F';
    const bodyY = headY + headSize;
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.2, bodyY, w * 0.4, h * 0.35, 4);
    ctx.fill();

    // アーマープレート
    ctx.fillStyle = '#3A5F5F';
    ctx.fillRect(cx - w * 0.18, bodyY + h * 0.05, w * 0.36, h * 0.04);
    ctx.fillRect(cx - w * 0.18, bodyY + h * 0.15, w * 0.36, h * 0.04);

    // 腕
    ctx.fillStyle = '#2F4F4F';
    ctx.fillRect(cx - w * 0.3, bodyY + h * 0.02, w * 0.1, h * 0.25);
    ctx.fillRect(cx + w * 0.2, bodyY + h * 0.02, w * 0.1, h * 0.25);

    // 武器（ライフル）
    ctx.fillStyle = '#333333';
    ctx.fillRect(cx + w * 0.22, bodyY + h * 0.2, w * 0.25, h * 0.03);
    ctx.fillRect(cx + w * 0.42, bodyY + h * 0.17, w * 0.03, h * 0.08);

    // 足
    ctx.fillStyle = '#2F4F4F';
    ctx.fillRect(cx - w * 0.15, bodyY + h * 0.35, w * 0.1, h * 0.2);
    ctx.fillRect(cx + w * 0.05, bodyY + h * 0.35, w * 0.1, h * 0.2);
    ctx.fillStyle = '#222222';
    ctx.fillRect(cx - w * 0.17, bodyY + h * 0.5, w * 0.14, h * 0.06);
    ctx.fillRect(cx + w * 0.03, bodyY + h * 0.5, w * 0.14, h * 0.06);
  }

  private static drawStarBeast(ctx: CanvasRenderingContext2D, w: number, h: number, _id: string): void {
    const cx = w / 2;
    const cy = h / 2;

    // 星脈獣の体
    ctx.fillStyle = '#2A3A6A';
    ctx.beginPath();
    ctx.ellipse(cx, cy + h * 0.05, w * 0.35, h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 星脈の光パターン
    ctx.strokeStyle = '#00E67688';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + w * 0.3 * Math.cos(angle), cy + h * 0.2 * Math.sin(angle));
      ctx.stroke();
    }

    // 光るオーラ
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.4);
    glow.addColorStop(0, 'rgba(0, 230, 118, 0.2)');
    glow.addColorStop(1, 'rgba(0, 230, 118, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.4, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 角
    ctx.fillStyle = '#AABBDD';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.1, cy - h * 0.2);
    ctx.lineTo(cx - w * 0.15, cy - h * 0.4);
    ctx.lineTo(cx - w * 0.05, cy - h * 0.22);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.1, cy - h * 0.2);
    ctx.lineTo(cx + w * 0.15, cy - h * 0.4);
    ctx.lineTo(cx + w * 0.05, cy - h * 0.22);
    ctx.fill();

    // 目
    ctx.fillStyle = '#00FFAA';
    ctx.beginPath();
    ctx.ellipse(cx - w * 0.1, cy - h * 0.08, w * 0.05, h * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + w * 0.1, cy - h * 0.08, w * 0.05, h * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();

    // 尾
    ctx.strokeStyle = '#2A3A6A';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.3, cy + h * 0.05);
    ctx.quadraticCurveTo(cx + w * 0.45, cy - h * 0.1, cx + w * 0.4, cy - h * 0.25);
    ctx.stroke();
    // 尾先の光
    ctx.fillStyle = '#00E676';
    ctx.beginPath();
    ctx.arc(cx + w * 0.4, cy - h * 0.25, w * 0.03, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawBoss(ctx: CanvasRenderingContext2D, w: number, h: number, id: string): void {
    const cx = w / 2;

    // ボスは人型で描画
    const headSize = h * 0.14;
    const headY = h * 0.08;
    const bodyY = headY + headSize;
    const bodyH = h * 0.35;
    const legH = h * 0.25;

    // ボスごとの色設定
    const bossColors: Record<string, { primary: string; secondary: string; aura: string; skin: string; hair: string }> = {
      gares: { primary: '#8B0000', secondary: '#FF4444', aura: '#FF440044', skin: '#D2691E', hair: '#333333' },
      selene: { primary: '#1a1a3e', secondary: '#87CEEB', aura: '#87CEEB44', skin: '#FFF0F5', hair: '#C0E0FF' },
      olga: { primary: '#2d2d00', secondary: '#FFD700', aura: '#FFD70044', skin: '#DEB887', hair: '#FFD700' },
      boris: { primary: '#00002d', secondary: '#4488FF', aura: '#4488FF44', skin: '#DEB887', hair: '#00008B' },
      xenon: { primary: '#333333', secondary: '#FFFFFF', aura: '#FFFFFF33', skin: '#FFE0BD', hair: '#C0C0C0' },
      valthor: { primary: '#1a0033', secondary: '#8E44AD', aura: '#8E44AD44', skin: '#D4A574', hair: '#2d0033' },
      valthorFinal: { primary: '#0a001a', secondary: '#00E676', aura: '#00E67644', skin: '#9370DB', hair: '#00FF88' },
    };

    const colors = bossColors[id] ?? bossColors['gares'];

    // オーラ
    const auraGrad = ctx.createRadialGradient(cx, h * 0.4, 0, cx, h * 0.4, h * 0.45);
    auraGrad.addColorStop(0, colors.aura);
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.fillRect(0, 0, w, h);

    // 足
    ctx.fillStyle = colors.primary;
    ctx.fillRect(cx - headSize * 0.4, bodyY + bodyH, headSize * 0.3, legH);
    ctx.fillRect(cx + headSize * 0.1, bodyY + bodyH, headSize * 0.3, legH);
    ctx.fillStyle = '#222';
    ctx.fillRect(cx - headSize * 0.45, bodyY + bodyH + legH * 0.8, headSize * 0.35, legH * 0.2);
    ctx.fillRect(cx + headSize * 0.05, bodyY + bodyH + legH * 0.8, headSize * 0.35, legH * 0.2);

    // 体
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.roundRect(cx - headSize * 0.6, bodyY, headSize * 1.2, bodyH, 6);
    ctx.fill();
    // ディテール
    ctx.fillStyle = colors.secondary;
    ctx.fillRect(cx - 2, bodyY, 4, bodyH * 0.6);
    ctx.fillRect(cx - headSize * 0.55, bodyY + bodyH * 0.35, headSize * 1.1, 3);

    // 腕
    ctx.fillStyle = colors.primary;
    ctx.fillRect(cx - headSize * 0.9, bodyY + headSize * 0.1, headSize * 0.28, bodyH * 0.7);
    ctx.fillRect(cx + headSize * 0.62, bodyY + headSize * 0.1, headSize * 0.28, bodyH * 0.7);

    // 頭部
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.ellipse(cx, headY + headSize * 0.5, headSize * 0.45, headSize * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 髪
    ctx.fillStyle = colors.hair;
    ctx.beginPath();
    ctx.ellipse(cx, headY + headSize * 0.35, headSize * 0.52, headSize * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    // 前髪
    ctx.beginPath();
    ctx.moveTo(cx - headSize * 0.45, headY + headSize * 0.35);
    ctx.quadraticCurveTo(cx, headY - headSize * 0.1, cx + headSize * 0.45, headY + headSize * 0.35);
    ctx.lineTo(cx + headSize * 0.35, headY + headSize * 0.25);
    ctx.quadraticCurveTo(cx, headY + headSize * 0.1, cx - headSize * 0.35, headY + headSize * 0.25);
    ctx.fill();

    // 目
    for (const side of [-1, 1]) {
      const ex = cx + side * headSize * 0.18;
      const ey = headY + headSize * 0.42;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(ex, ey, headSize * 0.1, headSize * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.secondary;
      ctx.beginPath();
      ctx.ellipse(ex, ey, headSize * 0.07, headSize * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(ex, ey, headSize * 0.03, 0, Math.PI * 2);
      ctx.fill();
    }

    // 最終形態: エネルギー翼
    if (id === 'valthorFinal') {
      ctx.strokeStyle = '#00E676';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00E676';
      for (let i = 0; i < 3; i++) {
        const wingAngle = -0.5 + i * 0.3;
        // 左翼
        ctx.beginPath();
        ctx.moveTo(cx - headSize * 0.5, bodyY + headSize * 0.2);
        ctx.quadraticCurveTo(
          cx - w * 0.3 - i * 10, bodyY - h * 0.1 - i * 15,
          cx - w * 0.15, bodyY - h * 0.05,
        );
        ctx.stroke();
        // 右翼
        ctx.beginPath();
        ctx.moveTo(cx + headSize * 0.5, bodyY + headSize * 0.2);
        ctx.quadraticCurveTo(
          cx + w * 0.3 + i * 10, bodyY - h * 0.1 - i * 15,
          cx + w * 0.15, bodyY - h * 0.05,
        );
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // 体中の光線
      ctx.strokeStyle = '#00E67666';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const y = bodyY + (bodyH / 6) * i;
        ctx.beginPath();
        ctx.moveTo(cx - headSize * 0.5, y);
        ctx.lineTo(cx + headSize * 0.5, y);
        ctx.stroke();
      }
    }
  }
}
