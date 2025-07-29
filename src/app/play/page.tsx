
// src/app/play/page.tsx
"use client";

import { Suspense } from 'react';
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
import { UserCheck, Eye, Crown, Play, Swords } from 'lucide-react';

interface Player {
    id: string;
    name: string;
}

function PlayPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const [imposterWord, setImposterWord] = useState('');
    const [hint, setHint] = useState('');
    const [imposterId, setImposterId] = useState('');
    const [players, setPlayers] = useState<Player[]>([]);
    const [gameMasterId, setGameMasterId] = useState('');
    const [startingPlayerId, setStartingPlayerId] = useState('');
    const [isGameOver, setIsGameOver] = useState(false);

    const [playerIdInput, setPlayerIdInput] = useState('');
    const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    
    useEffect(() => {
        try {
            const word = searchParams.get('word') || '';
            const hintParam = searchParams.get('hint') || '';
            const imposterIdParam = searchParams.get('imposterId') || '';
            const playersParam = searchParams.get('players');
            const gameMasterIdParam = searchParams.get('gameMasterId') || '';
            const startingPlayerIdParam = searchParams.get('startingPlayerId') || '';
            const gameOverParam = searchParams.get('gameOver') === 'true';

            if (!word || !imposterIdParam || !playersParam || !gameMasterIdParam || !startingPlayerIdParam) {
                toast({
                    variant: 'destructive',
                    title: 'Fehler',
                    description: 'Spiel-URL ist unvollständig. Bitte starte ein neues Spiel.',
                });
                router.push('/');
                return;
            }

            setImposterWord(word);
            setHint(hintParam);
            setImposterId(imposterIdParam);
            setPlayers(JSON.parse(playersParam));
            setGameMasterId(gameMasterIdParam);
            setStartingPlayerId(startingPlayerIdParam);
            setIsGameOver(gameOverParam);

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Fehler',
                description: 'Spiel-Daten konnten nicht geladen werden. Bitte starte ein neues Spiel.',
            });
            router.push('/');
        }
    }, [searchParams, router, toast]);

    const handleIdSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const foundPlayer = players.find(p => p.id.toLowerCase() === playerIdInput.toLowerCase());
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
        const params = new URLSearchParams(searchParams.toString());
        params.set('gameOver', 'true');
        router.push(`/play?${params.toString()}`);
    };

    if (!currentPlayer) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
                <Card className="w-full max-w-sm">
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
    
    const isImposter = currentPlayer.id === imposterId;
    const isGameMaster = currentPlayer.id === gameMasterId;
    const isStartingPlayer = currentPlayer.id === startingPlayerId;

    const role = isImposter ? "Imposter" : "Crewmate";
    const textToShow = isImposter ? hint : imposterWord;
    const roleDescription = isImposter
        ? "Du bist der Imposter! Dein Ziel ist es, nicht entlarvt zu werden. Benutze den Hinweis, um so zu tun, als wüsstest du das geheime Wort."
        : "Du bist ein Crewmate! Das geheime Wort ist unten angezeigt. Finde heraus, wer der Imposter ist.";

    if (isGameOver) {
        const imposterPlayer = players.find(p => p.id === imposterId);
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
                <Card className="w-full max-w-md text-center animate-in fade-in-0 duration-700">
                    <CardHeader>
                        <CardTitle className="text-3xl">Das Spiel ist vorbei!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>Der Imposter war <span className="font-bold text-destructive">{imposterPlayer?.name || 'Unbekannt'}</span>.</p>
                        <div>
                            <p className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Das geheime Wort war</p>
                            <p className="text-4xl font-extrabold text-primary tracking-wider uppercase drop-shadow-sm break-words">
                                {imposterWord}
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                        <Link href="/" passHref className="w-full">
                            <Button className="w-full">Neues Spiel starten</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </main>
        )
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
            <div className="w-full max-w-md mx-auto">
                {!isCardFlipped ? (
                    <Card
                        className="w-full h-80 bg-primary text-primary-foreground flex flex-col items-center justify-center text-center p-6 cursor-pointer transform transition-transform duration-500 hover:scale-105"
                        onClick={handleFlipCard}
                    >
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold">Hallo, {currentPlayer.name}!</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-center items-center gap-4">
                                {isGameMaster && <Crown className="w-8 h-8 text-amber-300" title="Spielleiter" />}
                                {isStartingPlayer && <Play className="w-8 h-8 text-green-300" title="Startspieler" />}
                            </div>
                            <p className="text-lg mt-4">Klicke hier, um deine Rolle aufzudecken.</p>
                            <Eye className="w-16 h-16 mt-4 opacity-80" />
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="w-full shadow-2xl overflow-hidden animate-in fade-in-0 duration-700">
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
                        <CardContent className="text-center p-8 min-h-[12rem] flex flex-col justify-center">
                            <p className="text-muted-foreground mb-4">{roleDescription}</p>
                            
                            {isImposter && hint && (
                                <>
                                    <Separator className="my-4"/>
                                    <h3 className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Dein Hinweis</h3>
                                    <p className="text-2xl font-bold text-foreground/90 italic">
                                        {textToShow}
                                    </p>
                                </>
                            )}
                            {!isImposter && (
                                <>
                                    <Separator className="my-4"/>
                                    <h3 className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Das geheime Wort</h3>
                                    <p className="text-4xl font-extrabold text-primary tracking-wider uppercase drop-shadow-sm break-words">
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
                            <Link href="/" passHref className="w-full">
                                <Button variant="outline" className="w-full">
                                    Neues Spiel
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </main>
    );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div>Laden...</div>}>
      <PlayPageContent />
    </Suspense>
  )
}
