// src/app/play/page.tsx
"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

function PlayPageContent() {
    const searchParams = useSearchParams();
    const imposterWord = searchParams.get('word') || '';
    const hint = searchParams.get('hint') || '';

    const [isImposter, setIsImposter] = useState<boolean | null>(null);
    const [isCardFlipped, setIsCardFlipped] = useState(false);

    useEffect(() => {
        // Simple logic: 25% chance of being the imposter.
        // In a real game, this would be handled by a game state management system.
        setIsImposter(Math.random() < 0.25);
    }, []);

    const handleFlipCard = () => {
        setIsCardFlipped(true);
    };

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
                            <CardTitle className="text-3xl font-bold">Bereit?</CardTitle>
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
                                    <h3 className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Hinweis</h3>
                                    <p className="text-2xl font-bold text-foreground/90 italic">
                                        {textToShow}
                                    </p>
                                </>
                            )}
                            {!isImposter && (
                                <>
                                    <Separator className="my-4"/>
                                    <h3 className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Das Wort</h3>
                                    <p className="text-5xl font-extrabold text-primary tracking-wider uppercase drop-shadow-sm">
                                        {textToShow}
                                    </p>
                                </>
                            )}

                        </CardContent>
                         <CardFooter className="p-4 bg-muted/50">
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
