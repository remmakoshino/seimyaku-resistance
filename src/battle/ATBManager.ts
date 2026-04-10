import { GAME } from '../utils/constants';

export interface ATBUnit {
  id: string;
  agility: number;
  atbGauge: number;
  isReady: boolean;
  isDefending: boolean;
  speedMultiplier: number;
  isAlive: boolean;
}

export class ATBManager {
  private units: ATBUnit[] = [];
  private paused = false;

  addUnit(id: string, agility: number): void {
    this.units.push({
      id,
      agility,
      atbGauge: 0,
      isReady: false,
      isDefending: false,
      speedMultiplier: 1.0,
      isAlive: true,
    });
  }

  removeUnit(id: string): void {
    this.units = this.units.filter(u => u.id !== id);
  }

  getUnit(id: string): ATBUnit | undefined {
    return this.units.find(u => u.id === id);
  }

  getAllUnits(): ATBUnit[] {
    return this.units;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  isPaused(): boolean {
    return this.paused;
  }

  update(delta: number): ATBUnit | null {
    if (this.paused) return null;

    let readyUnit: ATBUnit | null = null;

    for (const unit of this.units) {
      if (!unit.isAlive || unit.isReady) continue;

      const speed = GAME.ATB_BASE_SPEED + (unit.agility * GAME.ATB_AGILITY_FACTOR);
      const defenseBonus = unit.isDefending ? GAME.ATB_DEFENSE_BONUS : 1.0;
      const increment = speed * defenseBonus * unit.speedMultiplier * (delta / 16.67);

      unit.atbGauge = Math.min(unit.atbGauge + increment, GAME.ATB_MAX);

      if (unit.atbGauge >= GAME.ATB_MAX) {
        unit.isReady = true;
        if (!readyUnit) {
          readyUnit = unit;
        }
      }
    }

    return readyUnit;
  }

  resetGauge(id: string): void {
    const unit = this.getUnit(id);
    if (unit) {
      unit.atbGauge = 0;
      unit.isReady = false;
      unit.isDefending = false;
    }
  }

  setDefending(id: string, defending: boolean): void {
    const unit = this.getUnit(id);
    if (unit) {
      unit.isDefending = defending;
    }
  }

  setAlive(id: string, alive: boolean): void {
    const unit = this.getUnit(id);
    if (unit) {
      unit.isAlive = alive;
      if (!alive) {
        unit.atbGauge = 0;
        unit.isReady = false;
      }
    }
  }

  setSpeedMultiplier(id: string, multiplier: number): void {
    const unit = this.getUnit(id);
    if (unit) {
      unit.speedMultiplier = multiplier;
    }
  }

  reset(): void {
    this.units = [];
    this.paused = false;
  }
}
