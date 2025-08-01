// src/app/play/page.tsx
"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { getApp, getApps, initializeApp } from 'firebase/app';

import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Eye, Crown, Play, Swords, ShieldQuestion, Loader2 } from 'lucide-react';
import type { Player, GameState } from '@/lib/types';
import { endGameInFirestore } from '@/lib/firebase';

// This is a simplified client-side config.
// The full config with server-side functions is in @/lib/firebase.ts
const firebaseConfig = {
  "projectId": "imposterai-5tsyj",
  "appId": "1:1095581593715:web:024b764fa976bab71e3a06",
  "storageBucket": "imposterai-5tsyj.firebasestorage.app",
  "apiKey": "AIzaSyDMdXTt6dzXW4bzBlTDqHr7vyFOBmmq_-0",
  "authDomain": "imposterai-5tsyj.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1095581593715"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

function PlayPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerIdInput, setPlayerIdInput] = useState('');
    const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const gameId = searchParams.get('gameId');

    useEffect(() => {
        if (!gameId) {
            setError('Keine Spiel-ID in der URL gefunden. Bitte benutze den Link vom Spielleiter.');
            setLoading(false);
            return;
        }

        const gameDocRef = doc(db, 'games', gameId);

        // Use onSnapshot for real-time updates!
        const unsubscribe = onSnapshot(gameDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setGameState(docSnap.data() as GameState);
                setError(null);
            } else {
                setError('Spiel nicht gefunden. Überprüfe die Spiel-ID oder starte ein neues Spiel.');
                setGameState(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Firebase onSnapshot error:", err);
            setError('Fehler beim Verbinden mit dem Spiel. Bitte versuche es später erneut.');
            setLoading(false);
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, [gameId]);


    const handleIdSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!gameState) return;
        
        // Find player by case-insensitive matching
        const foundPlayer = gameState.players.find(p => p.id.toLowerCase() === playerIdInput.trim().toLowerCase());
        
        if (foundPlayer) {
            setCurrentPlayer(foundPlayer);
            // Store player ID locally so they don't have to log in again if they refresh
            localStorage.setItem(`imposter-last-player-${gameId}`, foundPlayer.id);
        } else {
            toast({
                variant: "destructive",
                title: "Ungültige ID",
                description: "Spieler-ID nicht gefunden. Überprüfe deine Eingabe.",
            });
        }
    };
    
    // Attempt to auto-login the player if they were here before
    useEffect(() => {
        if (gameState && gameId) {
            const lastPlayerId = localStorage.getItem(`imposter-last-player-${gameId}`);
            if (lastPlayerId) {
                const foundPlayer = gameState.players.find(p => p.id === lastPlayerId);
                if (foundPlayer) {
                    setCurrentPlayer(foundPlayer);
                }
            }
        }
    }, [gameState, gameId]);


    const handleFlipCard = () => {
        setIsCardFlipped(true);
    };
    
    const handleEndGame = async () => {
        if (!gameId) return;
        const { success, error } = await endGameInFirestore(gameId);
        if (!success) {
            toast({
                variant: 'destructive',
                title: 'Fehler',
                description: error || 'Das Spiel konnte nicht beendet werden.',
            });
        }
        // No need to manually update state, onSnapshot will handle it.
    };

    const handleNewGame = () => {
        if (gameId) {
            localStorage.removeItem(`imposter-last-player-${gameId}`);
        }
        router.push('/');
    };

    if (loading) {
        return (
             <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
                <Card className="w-full max-w-sm shadow-xl text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl">Lade Spiel...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    </CardContent>
                </Card>
            </main>
        )
    }

    if (error) {
         return (
             <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
                <Card className="w-full max-w-sm shadow-xl text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl text-destructive">Fehler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={() => router.push('/')}>Zurück zur Startseite</Button>
                    </CardFooter>
                </Card>
            </main>
        )
    }

    if (!currentPlayer || !gameState) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
                <Card className="w-full max-w-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl">Wer bist du?</CardTitle>
                         <CardDescription className="text-center pt-2">Gib deine 6-stellige Spieler-ID ein, die du vom Spielleiter bekommen hast.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleIdSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="playerId">Deine Spieler-ID</Label>
                                <Input
                                    id="playerId"
                                    value={playerIdInput}
                                    onChange={(e) => setPlayerIdInput(e.target.value)}
                                    placeholder="z.B. AB12CD"
                                    maxLength={6}
                                    className="text-center text-lg tracking-widest font-mono"
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                <UserCheck className="mr-2" /> Bestätigen
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        );
    }
    
    const isImposter = currentPlayer.id === gameState.imposterId;
    const isGameMaster = currentPlayer.id === gameState.gameMasterId;
    const isStartingPlayer = currentPlayer.id === gameState.startingPlayerId;

    const role = isImposter ? "Imposter" : "Crewmate";
    const textToShow = isImposter ? gameState.hint : gameState.imposterWord;
    const roleDescription = isImposter
        ? "Du bist der Imposter! Dein Ziel ist es, nicht entlarvt zu werden. Benutze den Hinweis, um so zu tun, als wüsstest du das geheime Wort."
        : "Du bist ein Crewmate! Das geheime Wort ist unten angezeigt. Finde heraus, wer der Imposter ist.";

    if (gameState.isGameOver) {
        const imposterPlayer = gameState.players.find(p => p.id === gameState.imposterId);
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
                <Card className="w-full max-w-md text-center animate-in fade-in-0 duration-700 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-3xl">Das Spiel ist vorbei!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>Der Imposter war <span className="font-bold text-destructive">{imposterPlayer?.name || 'Unbekannt'}</span>.</p>
                        <div>
                            <p className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Das geheime Wort war</p>
                            <p className="text-4xl font-extrabold text-primary tracking-wider uppercase drop-shadow-sm break-words">
                                {gameState.imposterWord}
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                         <Button className="w-full" onClick={handleNewGame}>Neues Spiel starten</Button>
                    </CardFooter>
                </Card>
            </main>
        )
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
            <div className="w-full max-w-md mx-auto" style={{ perspective: '1000px' }}>
                {!isCardFlipped ? (
                    <Card
                        className="w-full h-96 rounded-2xl bg-primary text-primary-foreground flex flex-col items-center justify-between p-6 cursor-pointer shadow-2xl border-4 border-primary-foreground/20 transition-transform duration-500 hover:scale-105"
                        onClick={handleFlipCard}
                    >
                        <div className="w-full flex justify-start"><ShieldQuestion className="w-10 h-10 opacity-70" /></div>
                        
                        <div className="text-center">
                            <CardTitle className="text-3xl font-bold">Hallo, {currentPlayer.name}!</CardTitle>
                            <p className="text-lg mt-2 opacity-90">Klicke, um deine Rolle aufzudecken</p>
                            <div className="flex justify-center items-center gap-4 mt-4">
                                {isGameMaster && <Crown className="w-8 h-8 text-amber-300" title="Spielleiter" />}
                                {isStartingPlayer && <Play className="w-8 h-8 text-green-300" title="Startspieler" />}
                            </div>
                        </div>

                        <div className="w-full flex justify-end"><ShieldQuestion className="w-10 h-10 opacity-70 transform -scale-x-100" /></div>
                    </Card>
                ) : (
                    <Card className="w-full shadow-2xl overflow-hidden animate-in fade-in-0 duration-700 rounded-2xl border-4 border-primary-foreground/20">
                        <CardHeader className="text-center bg-accent/20 p-6">
                             <div className="flex justify-center items-center gap-4 mb-2">
                                {isGameMaster && <Crown className="w-6 h-6 text-amber-500" title="Spielleiter" />}
                                {isStartingPlayer && <Play className="w-6 h-6 text-green-500" title="Startspieler"/>}
                            </div>
                            <p className="text-sm font-bold tracking-wider uppercase text-accent">Deine Rolle</p>
                            <CardTitle className={`text-4xl font-extrabold ${isImposter ? 'text-destructive' : 'text-primary'}`}>
                                {role}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center p-8 min-h-[14rem] flex flex-col justify-center">
                            <p className="text-muted-foreground mb-4">{roleDescription}</p>
                            
                            {isImposter && gameState.hint && (
                                <>
                                    <Separator className="my-4"/>
                                    <h3 className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Dein Hilfswort</h3>
                                    <p className="text-3xl font-bold text-foreground/90 italic tracking-wide">
                                        {textToShow}
                                    </p>
                                </>
                            )}
                            {!isImposter && (
                                <>
                                    <Separator className="my-4"/>
                                    <h3 className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Das geheime Wort</h3>
                                    <p className="text-5xl font-extrabold text-primary tracking-wider uppercase drop-shadow-sm break-words">
                                        {textToShow}
                                    </p>
                                </>
                            )}

                        </CardContent>
                         <CardFooter className="flex flex-col gap-4 p-4 bg-muted/50">
                            {isGameMaster && (
                                <Button variant="destructive" onClick={handleEndGame} className="w-full">
                                    <Swords className="mr-2" /> Spiel beenden & Wort aufdecken
                                </Button>
                            )}
                             <Button variant="secondary" onClick={() => { setCurrentPlayer(null); setIsCardFlipped(false); setPlayerIdInput(''); if (gameId) localStorage.removeItem(`imposter-last-player-${gameId}`); }}>
                                Anderer Spieler
                            </Button>
                            <Button variant="outline" onClick={handleNewGame} className="w-full">
                                Neues Spiel
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </main>
    );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></main>}>
      <PlayPageContent />
    </Suspense>
  )
}

    