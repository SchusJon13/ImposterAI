// src/lib/firebase.ts
'use server';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import type { Player, GameState } from '@/lib/types';

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "imposterai-5tsyj",
  "appId": "1:1095581593715:web:024b764fa976bab71e3a06",
  "storageBucket": "imposterai-5tsyj.firebasestorage.app",
  "apiKey": "AIzaSyDMdXTt6dzXW4bzBlTDqHr7vyFOBmmq_-0",
  "authDomain": "imposterai-5tsyj.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1095581593715"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

function generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}


export async function createGameInFirestore(
    players: Player[],
    gameMasterId: string,
    imposterWord: string,
    hint: string
): Promise<{ gameId: string; error: string | null }> {
    if (players.length < 2) {
        return { gameId: '', error: 'Es werden mindestens 2 Spieler benötigt.' };
    }

    const gameId = generateGameId();
    const imposterIndex = Math.floor(Math.random() * players.length);
    const imposterId = players[imposterIndex].id;
    const startingPlayerIndex = Math.floor(Math.random() * players.length);
    const startingPlayerId = players[startingPlayerIndex].id;

    const gameState: GameState = {
        imposterWord,
        hint: hint || '',
        imposterId,
        players: players.map(p => ({ id: p.id, name: p.name })),
        gameMasterId,
        startingPlayerId,
        isGameOver: false,
    };

    try {
        await setDoc(doc(db, "games", gameId), gameState);
        return { gameId, error: null };
    } catch (error) {
        console.error("Error creating game in Firestore:", error);
        const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler beim Erstellen des Spiels.";
        return { gameId: '', error: errorMessage };
    }
}

export async function getGameState(gameId: string): Promise<{ data: GameState | null, error: string | null }> {
    try {
        const docRef = doc(db, "games", gameId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { data: docSnap.data() as GameState, error: null };
        } else {
            return { data: null, error: "Spiel nicht gefunden." };
        }
    } catch (error) {
        console.error("Error fetching game state:", error);
        return { data: null, error: "Fehler beim Laden des Spiels." };
    }
}

export async function endGameInFirestore(gameId: string): Promise<{ success: boolean, error: string | null }> {
    try {
        const docRef = doc(db, "games", gameId);
        await updateDoc(docRef, { isGameOver: true });
        return { success: true, error: null };
    } catch (error) {
        console.error("Error ending game in Firestore:", error);
        return { success: false, error: "Fehler beim Beenden des Spiels." };
    }
}
