
// src/app/play/page.tsx
"use client";

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserCheck, Eye, Crown, Play, Swords, ShieldQuestion } from 'lucide-react';

interface Player {
    id: string;
    name: string;
}

interface GameState {
    imposterWord: string;
    hint: string;
    imposterId: string;
    players: Player[];
    gameMasterId: string;
    startingPlayerId: string;
    isGameOver: boolean;
}

function PlayPageContent() {
    const router = useRouter();
    const { toast } = useToast();

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerIdInput, setPlayerIdInput] = useState('');
    const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    
    useEffect(() => {
        try {
            const storedGameState = localStorage.getItem('imposter-game-state');
            if (!storedGameState) {
                 toast({
                    variant: 'destructive',
                    title: 'Fehler',
                    description: 'Kein aktives Spiel gefunden. Bitte starte ein neues Spiel von der Hauptseite.',
                });
                router.push('/');
                return;
            }
            const parsedState: GameState = JSON.parse(storedGameState);
            setGameState(parsedState);

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Fehler',
                description: 'Spiel-Daten konnten nicht geladen werden. Bitte starte ein neues Spiel.',
            });
            router.push('/');
        }
    }, [router, toast]);

    const handleIdSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!gameState) return;
        const foundPlayer = gameState.players.find(p => p.id.toLowerCase() === playerIdInput.toLowerCase());
        if (foundPlayer) {
            setCurrentPlayer(foundPlayer);
        } else {
            toast({
                variant: "destructive",
                title: "Ungültige ID",
                description: "Spieler-ID nicht gefunden. Überprüfe deine Eingabe.",
            });
        }
    };

    const handleFlipCard = () => {
        setIsCardFlipped(true);
    };
    
    const handleEndGame = () => {
        if (!gameState) return;
        const updatedGameState = { ...gameState, isGameOver: true };
        setGameState(updatedGameState);
        localStorage.setItem('imposter-game-state', JSON.stringify(updatedGameState));
    };

    const handleNewGame = () => {
        localStorage.removeItem('imposter-game-state');
        router.push('/');
    };

    if (!gameState) {
        return (
             <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
                <Card className="w-full max-w-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl">Lade Spiel...</CardTitle>
                    </CardHeader>
                </Card>
            </main>
        )
    }

    if (!currentPlayer) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
                <Card className="w-full max-w-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl">Wer bist du?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleIdSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="playerId">Deine Spieler-ID</Label>
                                <Input
                                    id="playerId"
                                    value={playerIdInput}
                                    onChange={(e) => setPlayerIdInput(e.target.value)}
                                    placeholder="6-stellige ID"
                                    maxLength={6}
                                    className="text-center text-lg tracking-widest"
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
                        className="w-full h-96 rounded-2xl bg-primary text-primary-foreground flex flex-col items-center justify-between p-6 cursor-pointer shadow-2xl border-4 border-primary-foreground/20 transition-transform duration-500 hover:scale-105 hover:shadow-2xl"
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
                            <Button variant="secondary" onClick={() => { setCurrentPlayer(null); setIsCardFlipped(false); setPlayerIdInput(''); }}>
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
    // Suspense is not strictly needed here anymore since we are not using searchParams for initial state,
    // but it's good practice to keep it for potential future async operations on page load.
    <Suspense fallback={<div>Laden...</div>}>
      <PlayPageContent />
    </Suspense>
  )
}
