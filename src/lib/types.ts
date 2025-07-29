// src/lib/types.ts

export interface Player {
    id: string;
    name: string;
}

export interface GameState {
    imposterWord: string;
    hint: string;
    imposterId: string;
    players: Player[];
    gameMasterId: string;
    startingPlayerId: string;
    isGameOver: boolean;
}
