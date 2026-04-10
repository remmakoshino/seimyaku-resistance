import { ElementType, getElementMultiplier, GAME } from '../utils/constants';

export interface DamageResult {
  damage: number;
  elementMultiplier: number;
  isCritical: boolean;
  isWeak: boolean;
  isResist: boolean;
}

export function calculateDamage(
  attackerAttack: number,
  defenderDefense: number,
  skillPower: number,
  attackElement: ElementType,
  defenseElement: ElementType,
  isMagic: boolean,
  isDefending: boolean,
): DamageResult {
  // 基本ダメージ計算
  const baseDamage = (attackerAttack * skillPower) / (defenderDefense * 2 + 10);

  // 属性補正
  const elementMultiplier = getElementMultiplier(attackElement, defenseElement);

  // 防御補正
  const defendMultiplier = isDefending ? GAME.DEFEND_DAMAGE_MULTIPLIER : 1.0;

  // クリティカル判定（10%）
  const isCritical = Math.random() < 0.1;
  const critMultiplier = isCritical ? 1.5 : 1.0;

  // ランダム補正（0.9〜1.1）
  const randomFactor = 0.9 + Math.random() * 0.2;

  const finalDamage = Math.max(
    1,
    Math.floor(baseDamage * elementMultiplier * defendMultiplier * critMultiplier * randomFactor)
  );

  return {
    damage: finalDamage,
    elementMultiplier,
    isCritical,
    isWeak: elementMultiplier > 1.0,
    isResist: elementMultiplier < 1.0,
  };
}

export function calculateHealing(
  casterMagicAttack: number,
  skillPower: number,
): number {
  return Math.floor(casterMagicAttack * skillPower / 20);
}
