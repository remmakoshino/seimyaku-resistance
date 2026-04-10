import Phaser from 'phaser';
import { SCENES, GAME, COLORS } from '../utils/constants';
import { SaveData } from '../systems/SaveSystem';
import { audioGenerator } from '../utils/AudioGenerator';

interface StoryScript {
  speaker: string;
  text: string;
  color?: string;
}

const CHAPTER_STORIES: Record<number, StoryScript[]> = {
  1: [
    { speaker: '', text: '惑星テラノヴァ — アークシティ地下水路', color: '#00E676' },
    { speaker: 'レイ', text: '……ここが第1脈動炉への侵入経路か。', color: '#3498DB' },
    { speaker: 'カナデ', text: 'うん。ルミナの情報によると、この先に脈動炉の制御室があるはず。', color: '#E74C3C' },
    { speaker: 'ジン', text: '警備は厳重だ。気を引き締めていくぞ。', color: '#F39C12' },
    { speaker: 'レイ', text: '……星脈を搾取し続けるクロノス社。この惑星を守るために、俺たちが動くしかない。', color: '#3498DB' },
    { speaker: 'カナデ', text: 'そうだよ！ 私たちルミナが、惑星の命を取り戻す！', color: '#E74C3C' },
    { speaker: '', text: '— 第1脈動炉破壊作戦、開始 —', color: '#FFD700' },
  ],
  2: [
    { speaker: '', text: '凍土の村エルドラ', color: '#00E676' },
    { speaker: 'レイ', text: '第1脈動炉は止めた。だが、まだ6基残っている。', color: '#3498DB' },
    { speaker: 'カナデ', text: 'この村に星脈の研究者がいるって聞いたんだけど……', color: '#E74C3C' },
    { speaker: 'ソルト', text: '……あなたたちがルミナのメンバーですか。私はソルト・グレイシア。', color: '#BDC3C7' },
    { speaker: 'ソルト', text: 'クロノス社の「オルビス計画」……。星脈を利用した恐ろしい計画が進行しています。', color: '#BDC3C7' },
    { speaker: 'レイ', text: 'オルビス計画……？', color: '#3498DB' },
    { speaker: 'ソルト', text: '詳しくは道中でお話しします。まずは、この地域の脈動炉を止めましょう。', color: '#BDC3C7' },
    { speaker: '', text: '— ソルト・グレイシアが仲間に加わった！ —', color: '#FFD700' },
    { speaker: '', text: '— 星晶石システムが解放された！ —', color: '#00E676' },
  ],
  3: [
    { speaker: '', text: '海上都市マリータ', color: '#00E676' },
    { speaker: 'ジン', text: 'ここがクロノスの海上研究都市か。豪華なもんだな。', color: '#F39C12' },
    { speaker: 'ミスティ', text: 'ふふ、いいところに来ましたね。私は情報屋のミスティ。', color: '#8E44AD' },
    { speaker: 'ミスティ', text: 'クロノス社の機密データ、見たくないですか？', color: '#8E44AD' },
    { speaker: 'カナデ', text: 'え、怪しすぎない……？', color: '#E74C3C' },
    { speaker: 'ミスティ', text: '怪しいのはお互い様でしょう？ レジスタンスさん。', color: '#8E44AD' },
    { speaker: 'レイ', text: '……情報は必要だ。ただし、裏切りは許さない。', color: '#3498DB' },
    { speaker: '', text: '— ミスティ・ノワールが仲間に加わった！ —', color: '#FFD700' },
    { speaker: '', text: '— 覚醒システムが解放された！ —', color: '#00E676' },
  ],
  4: [
    { speaker: '', text: '浮遊要塞ゼニス', color: '#00E676' },
    { speaker: 'レイ', text: '……この場所、見覚えがある。', color: '#3498DB' },
    { speaker: 'カナデ', text: 'レイ…… ここはステラガードの本拠地だよ。', color: '#E74C3C' },
    { speaker: 'レイ', text: '……俺は、ここにいたのか。思い出しかけている。', color: '#3498DB' },
    { speaker: 'ゼノン', text: 'よく戻ってきたな、レイ。いや——コードネーム「セイバー」。', color: '#CCCCCC' },
    { speaker: 'レイ', text: '……ゼノン隊長。', color: '#3498DB' },
    { speaker: 'ゼノン', text: 'お前はかつて最強のステラガードだった。そしてお前が破壊したものを……覚えているか？', color: '#CCCCCC' },
    { speaker: 'ミスティ', text: '（……計画通り。でも……）', color: '#8E44AD' },
    { speaker: '', text: '— レイの記憶が蘇りつつある…… —', color: '#FF4444' },
  ],
  5: [
    { speaker: '', text: '始原の大空洞 — 星脈の源', color: '#00E676' },
    { speaker: 'ソルト', text: 'ここが……星脈の始まりの場所。惑星テラノヴァの心臓です。', color: '#BDC3C7' },
    { speaker: 'ヴァルトール', text: 'フフフ……よく来た、ルミナの諸君。', color: '#8E44AD' },
    { speaker: 'ヴァルトール', text: 'オルビス計画は最終段階だ。私は星脈と融合し、神となる！', color: '#8E44AD' },
    { speaker: 'レイ', text: '……ヴァルトール。俺の記憶を奪い、仲間を利用し、星脈を蝕んだお前を、ここで止める。', color: '#3498DB' },
    { speaker: 'カナデ', text: '私たちは一人じゃない。仲間がいる！', color: '#E74C3C' },
    { speaker: 'ジン', text: '過去の罪は、ここで清算してやる！', color: '#F39C12' },
    { speaker: 'ソルト', text: '星脈の真の力、あなたには制御できません。', color: '#BDC3C7' },
    { speaker: 'ミスティ', text: '……私は、自分の意思で戦う。あなたの人形じゃない。', color: '#8E44AD' },
    { speaker: '', text: '— 最終決戦 —', color: '#FF0000' },
  ],
  6: [
    // エンディング
    { speaker: '', text: '———', color: '#FFFFFF' },
    { speaker: '', text: 'ヴァルトールは倒れ、オルビス計画は阻止された。', color: '#C0C0D0' },
    { speaker: '', text: '星脈は再び自由に惑星を巡り始めた。', color: '#00E676' },
    { speaker: '', text: '枯れた大地に緑が戻り、凍った海が溶け、空に星が瞬く。', color: '#00E676' },
    { speaker: 'レイ', text: '……星脈が、歌っているみたいだ。', color: '#3498DB' },
    { speaker: 'カナデ', text: 'うん。聞こえるよ。惑星テラノヴァの……命の歌が。', color: '#E74C3C' },
    { speaker: '', text: '— 数百年後 —', color: '#FFD700' },
    { speaker: '', text: '惑星テラノヴァは豊かな生命に満ち、人々は星脈と共に生きていた。', color: '#C0C0D0' },
    { speaker: '', text: 'かつてのレジスタンスの物語は、伝説として語り継がれている。', color: '#C0C0D0' },
    { speaker: '', text: '— 星脈の抵抗者たちの物語は、ここに幕を閉じる —', color: '#00E676' },
    { speaker: '', text: '星脈のレジスタンス — FIN', color: '#FFD700' },
  ],
};

export class StoryScene extends Phaser.Scene {
  private saveData!: SaveData;
  private chapter = 1;
  private scripts: StoryScript[] = [];
  private currentLine = 0;
  private isEnding = false;

  constructor() {
    super({ key: SCENES.STORY });
  }

  init(data: { chapter: number; saveData: SaveData; isEnding?: boolean }): void {
    this.chapter = data.chapter;
    this.saveData = data.saveData;
    this.isEnding = data.isEnding ?? false;
    this.scripts = CHAPTER_STORIES[this.chapter] ?? [];
    this.currentLine = 0;
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    this.cameras.main.setBackgroundColor(COLORS.BG);

    if (this.scripts.length === 0) {
      this.scene.start(SCENES.EXPLORATION, { saveData: this.saveData });
      return;
    }

    // 背景演出
    const bg = this.add.graphics();
    const shimmer = this.add.graphics();

    // 星脈パーティクル
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      shimmer.fillStyle(0x00E676, Math.random() * 0.3);
      shimmer.fillCircle(x, y, Math.random() * 2 + 1);
    }

    // テキストエリア
    this.showLine(width, height);

    // タップで次の行
    this.input.on('pointerdown', () => {
      this.currentLine++;
      if (this.currentLine >= this.scripts.length) {
        this.onStoryComplete();
      } else {
        this.showLine(width, height);
      }
    });
  }

  private showLine(w: number, h: number): void {
    // 前のテキストを削除
    this.children.getAll().filter(c => c.getData('storyText')).forEach(c => c.destroy());

    const script = this.scripts[this.currentLine];
    if (!script) return;

    // スピーカー名
    if (script.speaker) {
      const speakerText = this.add.text(w * 0.1, h * 0.4, script.speaker, {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: `${Math.floor(w * 0.04)}px`,
        color: script.color ?? '#FFFFFF',
        fontStyle: 'bold',
      }).setData('storyText', true);
    }

    // 本文
    const textY = script.speaker ? h * 0.48 : h * 0.45;
    const mainText = this.add.text(w * 0.1, textY, script.text, {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(w * 0.038)}px`,
      color: script.speaker ? '#FFFFFF' : (script.color ?? '#C0C0D0'),
      wordWrap: { width: w * 0.8 },
      lineSpacing: 8,
    }).setData('storyText', true);

    // 進行インジケーター
    const indicator = this.add.text(w * 0.9, h * 0.9, '▼', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: '20px',
      color: '#00E676',
    }).setOrigin(0.5).setData('storyText', true);

    this.tweens.add({
      targets: indicator,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // ページカウント
    this.add.text(w / 2, h * 0.95, `${this.currentLine + 1} / ${this.scripts.length}`, {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: '14px',
      color: '#555577',
    }).setOrigin(0.5).setData('storyText', true);
  }

  private onStoryComplete(): void {
    if (this.isEnding) {
      // エンディング → タイトルへ
      this.time.delayedCall(1000, () => {
        this.scene.start(SCENES.TITLE);
      });
    } else {
      // 探索フェーズへ
      // チャプター2でソルト加入、チャプター3でミスティ加入
      if (this.chapter === 2 && !this.saveData.party.includes('salt')) {
        // ソルトが加入可能に
      }
      if (this.chapter === 3 && !this.saveData.party.includes('misty')) {
        // ミスティが加入可能に
      }
      this.scene.start(SCENES.EXPLORATION, { saveData: this.saveData });
    }
  }
}
