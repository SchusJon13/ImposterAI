
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Smile, Meh, Frown, Wand2, ArrowRight, UserPlus, Trash2, Copy, Users, Crown } from "lucide-react";
import Link from 'next/link';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getImposterWordAction } from "@/app/actions";
import type { GenerateImposterWordOutput } from "@/ai/flows/generate-imposter-word";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  category: z.string().min(2, {
    message: "Die Kategorie muss mindestens 2 Zeichen lang sein.",
  }),
  difficulty: z.enum(["easy", "medium", "hard"], {
    required_error: "Du musst einen Schwierigkeitsgrad auswählen.",
  }),
});

const difficultyOptions = [
  { value: "easy", label: "Leicht", icon: Smile },
  { value: "medium", label: "Mittel", icon: Meh },
  { value: "hard", label: "Schwer", icon: Frown },
] as const;

interface Player {
  id: string;
  name: string;
}

export function ImposterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateImposterWordOutput | null>(null);
  const { toast } = useToast();

  const [players, setPlayers] = useState<Player[]>([]);
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [imposterId, setImposterId] = useState<string | null>(null);
  const [gameMasterId, setGameMasterId] = useState<string | null>(null);

  const generateId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  useEffect(() => {
    try {
      const savedPlayers = localStorage.getItem('imposter-players');
      if (savedPlayers) {
        setPlayers(JSON.parse(savedPlayers));
      }
      
      let gmId = localStorage.getItem('imposter-gameMasterId');
      if (!gmId) {
        gmId = generateId();
        localStorage.setItem('imposter-gameMasterId', gmId);
      }
      setGameMasterId(gmId);
      
      // Add the Game Master to the players list if not already there
      const playersList = savedPlayers ? JSON.parse(savedPlayers) : [];
      const gameMasterPlayer = playersList.find((p: Player) => p.id === gmId);
      if (!gameMasterPlayer) {
          const gmPlayer: Player = { id: gmId, name: 'Spielleiter' };
          const updatedPlayers = [gmPlayer, ...playersList.filter((p: Player) => p.id !== gmId)];
          setPlayers(updatedPlayers);
          localStorage.setItem('imposter-players', JSON.stringify(updatedPlayers));
      }

    } catch (e) {
      console.error("Could not load from localStorage", e);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      difficulty: "medium",
    },
  });

  const handleAddPlayer = () => {
    if (playerNameInput.trim() === "") return;
    
    let player = players.find(p => p.name.toLowerCase() === playerNameInput.trim().toLowerCase());
    
    if (!player) {
      player = { name: playerNameInput.trim(), id: generateId() };
      const updatedPlayers = [...players, player];
      setPlayers(updatedPlayers);
      localStorage.setItem('imposter-players', JSON.stringify(updatedPlayers));
    }
    
    setPlayerNameInput("");
  };

  const handleRemovePlayer = (id: string) => {
    if (id === gameMasterId) {
      toast({
        variant: "destructive",
        title: "Spielleiter kann nicht entfernt werden.",
        description: "Du bist der Spielleiter dieser Runde.",
      });
      return;
    }
    const updatedPlayers = players.filter(p => p.id !== id);
    setPlayers(updatedPlayers);
    localStorage.setItem('imposter-players', JSON.stringify(updatedPlayers));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (players.length < 2) {
      toast({
        variant: "destructive",
        title: "Nicht genügend Spieler",
        description: "Du benötigst mindestens 2 Spieler, um ein Spiel zu starten.",
      });
      return;
    }
    setIsLoading(true);
    setResult(null);
    setImposterId(null);

    const { data, error } = await getImposterWordAction(values);

    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Etwas ist schief gelaufen",
        description: error,
      });
    } else if (data) {
      setResult(data);
      // Select a random imposter
      const randomPlayerIndex = Math.floor(Math.random() * players.length);
      setImposterId(players[randomPlayerIndex].id);
    }
  }
  
  const handleStartOver = () => {
    setResult(null);
    setImposterId(null);
    form.reset();
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${type} kopiert!`,
      description: `Der Text wurde in deine Zwischenablage kopiert.`,
    });
  }

  if (result && imposterId && gameMasterId) {
    const startingPlayerIndex = Math.floor(Math.random() * players.length);
    const startingPlayerId = players[startingPlayerIndex].id;

    const gameUrlParams = new URLSearchParams({
      word: result.imposterWord || '',
      hint: result.hint || '',
      imposterId: imposterId,
      players: JSON.stringify(players.map(p => ({ id: p.id, name: p.name }))),
      gameMasterId: gameMasterId,
      startingPlayerId: startingPlayerId,
    });
    const gameUrl = `/play?${gameUrlParams.toString()}`;

    return (
      <div className="mt-10 animate-in fade-in-0 slide-in-from-bottom-5 duration-500">
         <Card className="w-full max-w-2xl mx-auto shadow-2xl overflow-hidden">
              <CardHeader className="text-center bg-primary/10 p-6">
                  <CardTitle className="text-2xl font-bold font-headline text-accent">
                      Spiel erstellt!
                  </CardTitle>
                   <CardDescription>Das Spiel ist bereit. Teilt die IDs und den Link.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                  <p className="text-lg font-semibold text-foreground">1. Spieler-IDs teilen</p>
                  <div className="space-y-2 rounded-md border p-2 max-h-48 overflow-y-auto">
                    {players.map(player => (
                        <div key={player.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <span className="font-medium">{player.name} {player.id === gameMasterId && <Crown className="inline-block w-4 h-4 ml-1 text-amber-500" />}</span>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-mono text-base">{player.id}</Badge>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard(player.id, 'ID')}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                  </div>

                  <p className="text-lg font-semibold text-foreground pt-4">2. Link teilen</p>
                  <p className="text-muted-foreground">Jeder Spieler muss seine ID auf der Spielseite eingeben.</p>
                  <div className="flex items-center space-x-2">
                    <Input value={`${window.location.origin}${gameUrl}`} readOnly className="text-sm"/>
                    <Button onClick={() => copyToClipboard(`${window.location.origin}${gameUrl}`, 'Link')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
              </CardContent>
              <CardFooter className="flex-col gap-4 p-6 bg-muted/50">
                <Link href={gameUrl} passHref className="w-full">
                  <Button className="w-full" size="lg">
                    Zum Spiel beitreten <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleStartOver} className="w-full">
                  Neues Spiel starten
                </Button>
              </CardFooter>
          </Card>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Player Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users /> Mitspieler</CardTitle>
            <CardDescription>Du bist der Spielleiter (gekennzeichnet mit einer Krone). Füge weitere Spieler hinzu oder entferne sie.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Input 
                placeholder="Name des Spielers" 
                value={playerNameInput}
                onChange={(e) => setPlayerNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
              />
              <Button onClick={handleAddPlayer}><UserPlus /></Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {players.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Noch keine Spieler hinzugefügt.</p>}
              {players.map(player => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md animate-in fade-in-0">
                  <div>
                    <p className="font-medium">{player.name} {player.id === gameMasterId && <Crown className="inline-block w-4 h-4 ml-1 text-amber-500" />}</p>
                    <p className="text-xs font-mono text-muted-foreground">{player.id}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => handleRemovePlayer(player.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Game Settings Card */}
        <Card>
          <CardHeader>
              <CardTitle>Spieleinstellungen</CardTitle>
              <CardDescription>Wähle eine Kategorie und einen Schwierigkeitsgrad.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategorie</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Tiere, Berufe, Länder" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Schwierigkeitsgrad</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-3 gap-2"
                        >
                          {difficultyOptions.map((option) => (
                            <FormItem key={option.value}>
                              <FormControl>
                                <RadioGroupItem value={option.value} id={option.value} className="sr-only peer" />
                              </FormControl>
                              <Label
                                htmlFor={option.value}
                                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                              >
                                <option.icon className="mb-2 h-6 w-6" />
                                {option.label}
                              </Label>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
           <CardFooter>
             <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading} className="w-full" size="lg">
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-5 w-5" />
                )}
                Wort generieren & Spiel starten
              </Button>
           </CardFooter>
        </Card>
      </div>
    </>
  );
}
