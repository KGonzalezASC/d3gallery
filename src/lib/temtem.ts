export interface Temtem {
    dexNumber: number;
    name: string;
    TYPE1: string; // Primary type
    TYPE2?: string; // Optional secondary type
    hp: number;
    sta: number;
    spd: number;
    atk: number;
    def: number;
    spatk: number;
    spdef: number;
    total: number;
    weaknessCount: number;
    resistanceCount: number;
    tier: string;
    holdTechniqueTotal: number;
}

export const types = [
    "Neutral",
    "Fire",
    "Water",
    "Nature",
    "Electric",
    "Earth",
    "Mental",
    "Wind",
    "Digital",
    "Melee",
    "Crystal",
    "Toxic",
];