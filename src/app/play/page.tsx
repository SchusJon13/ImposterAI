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
import { UserCheck, Eye } from 'lucide-react';

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

    const [playerIdInput, setPlayerIdInput] = useState('');
    const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    
    useEffect(() => {
        try {
            const word = searchParams.get('word') || '';
            const hintParam = searchParams.get('hint') || '';
            const imposterIdParam = searchParams.get('imposterId') || '';
            const playersParam = searchParams.get('players');
            
            if (!word || !imposterIdParam || !playersParam) {
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
    const role = isImposter ? "Imposter" : "Crewmate";
    const textToShow = isImposter ? hint : imposterWord;
    const roleDescription = isImposter
        ? "Du bist der Imposter! Dein Ziel ist es, nicht entlarvt zu werden. Benutze den Hinweis, um so zu tun, als wüsstest du das geheime Wort."
        : "Du bist ein Crewmate! Das geheime Wort ist unten angezeigt. Finde heraus, wer der Imposter ist.";

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
                            <p className="text-lg">Klicke hier, um deine Rolle aufzudecken.</p>
                            <Eye className="w-16 h-16 mt-4 opacity-80" />
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="w-full shadow-2xl overflow-hidden animate-in fade-in-0 duration-700">
                        <CardHeader className="text-center bg-accent/20 p-6">
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

    