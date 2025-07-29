
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Smile, Meh, Frown, Wand2, ArrowRight, UserPlus, Trash2, Copy, Users, Crown, Bot, PencilRuler } from "lucide-react";
import { useRouter } from 'next/navigation';

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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createGameInFirestore } from "@/lib/firebase";
import type { Player } from '@/lib/types';


const aiFormSchema = z.object({
  category: z.string().min(2, {
    message: "Die Kategorie muss mindestens 2 Zeichen lang sein.",
  }),
  difficulty: z.enum(["easy", "medium", "hard"], {
    required_error: "Du musst einen Schwierigkeitsgrad auswählen.",
  }),
  model: z.enum(["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-1.0-pro"]),
});

const debugFormSchema = z.object({
    imposterWord: z.string().min(2, {
        message: "Das Imposter-Wort muss mindestens 2 Zeichen haben.",
    }),
    hint: z.string().optional(),
});


const difficultyOptions = [
  { value: "easy", label: "Leicht", icon: Smile },
  { value: "medium", label: "Mittel", icon: Meh },
  { value: "hard", label: "Schwer", icon: Frown },
] as const;

const modelOptions = [
    { value: "gemini-1.5-flash-latest", label: "Gemini 1.5 Flash (Schnell)" },
    { value: "gemini-1.5-pro-latest", label: "Gemini 1.5 Pro (Stark)" },
    { value: "gemini-1.0-pro", label: "Gemini 1.0 Pro (Stabil)" },
] as const;

export function ImposterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGameReady, setIsGameReady] = useState(false);
  const [createdGameId, setCreatedGameId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [gameMasterId, setGameMasterId] = useState<string | null>(null);

  const generateId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  useEffect(() => {
    try {
      const savedPlayers = localStorage.getItem('imposter-players');
      const playersList = savedPlayers ? JSON.parse(savedPlayers) : [];

      let gmId = localStorage.getItem('imposter-gameMasterId');
      if (!gmId) {
        gmId = generateId();
        localStorage.setItem('imposter-gameMasterId', gmId);
      }
      setGameMasterId(gmId);
      
      const gameMasterPlayer = playersList.find((p: Player) => p.id === gmId);
      if (!gameMasterPlayer) {
          const gmPlayer: Player = { id: gmId, name: 'Spielleiter' };
          const updatedPlayers = [gmPlayer, ...playersList.filter((p: Player) => p.id !== gmId)];
          setPlayers(updatedPlayers);
          localStorage.setItem('imposter-players', JSON.stringify(updatedPlayers));
      } else {
        setPlayers(playersList);
      }

    } catch (e) {
      console.error("Could not load from localStorage", e);
    }
  }, []);

  const aiForm = useForm<z.infer<typeof aiFormSchema>>({
    resolver: zodResolver(aiFormSchema),
    defaultValues: {
      category: "",
      difficulty: "medium",
      model: "gemini-1.5-flash-latest",
    },
  });

  const debugForm = useForm<z.infer<typeof debugFormSchema>>({
      resolver: zodResolver(debugFormSchema),
      defaultValues: {
          imposterWord: "",
          hint: "",
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
  
  const startGame = async (word: string, hint?: string) => {
    setIsLoading(true);
    if (!gameMasterId || players.length < 2) {
        toast({
            variant: "destructive",
            title: "Nicht genügend Spieler",
            description: "Du benötigst mindestens 2 Spieler (inkl. Spielleiter), um ein Spiel zu starten.",
        });
        setIsLoading(false);
        return;
    }
    
    const { gameId, error } = await createGameInFirestore(players, gameMasterId, word, hint || '');

    setIsLoading(false);

    if (error) {
        toast({
            variant: "destructive",
            title: "Fehler beim Erstellen des Spiels",
            description: error,
        });
    } else {
        setCreatedGameId(gameId);
        setIsGameReady(true);
    }
  };

  async function onAiSubmit(values: z.infer<typeof aiFormSchema>) {
    setIsLoading(true);
    const { data, error } = await getImposterWordAction(values);
    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Etwas ist schief gelaufen",
        description: error,
      });
    } else if (data) {
      await startGame(data.imposterWord, data.hint);
    }
  }

  async function onDebugSubmit(values: z.infer<typeof debugFormSchema>) {
      await startGame(values.imposterWord, values.hint);
  }
  
  const handleStartOver = () => {
    setIsGameReady(false);
    setCreatedGameId(null);
    aiForm.reset();
    debugForm.reset();
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${type} kopiert!`,
      description: `Der Text wurde in deine Zwischenablage kopiert.`,
    });
  }

  if (isGameReady && createdGameId) {
    const gameUrl = `/play?gameId=${createdGameId}`;

    return (
      <div className="mt-10 animate-in fade-in-0 slide-in-from-bottom-5 duration-500">
         <Card className="w-full max-w-2xl mx-auto shadow-2xl overflow-hidden">
              <CardHeader className="text-center bg-primary/10 p-6">
                  <CardTitle className="text-2xl font-bold font-headline text-accent">
                      Spiel erstellt! (ID: {createdGameId})
                  </CardTitle>
                   <CardDescription>Das Spiel ist bereit. Teilt die Spieler-IDs und den Link.</CardDescription>
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
                <Button className="w-full" size="lg" onClick={() => router.push(gameUrl)}>
                    Zum Spiel beitreten <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
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
        <Card className="md:col-span-2">
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
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => handleRemovePlayer(player.id)} disabled={player.id === gameMasterId}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Game Settings Card */}
        <Card className="md:col-span-2">
          <Tabs defaultValue="ai" className="w-full">
              <CardHeader>
                  <CardTitle>Spieleinstellungen</CardTitle>
                  <CardDescription>Wähle, ob die KI das Wort generieren soll oder ob du es manuell eingibst.</CardDescription>
                  <TabsList className="grid w-full grid-cols-2 mt-4">
                      <TabsTrigger value="ai"><Bot className="mr-2"/> KI-Generierung</TabsTrigger>
                      <TabsTrigger value="debug"><PencilRuler className="mr-2"/> Manuell / Debug</TabsTrigger>
                  </TabsList>
              </CardHeader>
              <TabsContent value="ai">
                  <CardContent>
                      <Form {...aiForm}>
                        <form onSubmit={aiForm.handleSubmit(onAiSubmit)} className="space-y-6">
                          <FormField
                            control={aiForm.control}
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
                            control={aiForm.control}
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
                          
                          <FormField
                            control={aiForm.control}
                            name="model"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2"><Bot /> KI-Modell</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Wähle ein KI-Modell" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {modelOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                        </form>
                      </Form>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={aiForm.handleSubmit(onAiSubmit)} disabled={isLoading} className="w-full" size="lg">
                        {isLoading ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <Wand2 className="mr-2 h-5 w-5" />
                        )}
                        Wort generieren & Spiel starten
                      </Button>
                  </CardFooter>
              </TabsContent>
              <TabsContent value="debug">
                   <CardContent>
                      <Form {...debugForm}>
                        <form onSubmit={debugForm.handleSubmit(onDebugSubmit)} className="space-y-6">
                            <FormField
                                control={debugForm.control}
                                name="imposterWord"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Geheimes Wort</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Das Wort, das alle Crewmates sehen" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={debugForm.control}
                                name="hint"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Hinweis für den Imposter (optional)</FormLabel>
                                    <FormControl>
                                    <Textarea placeholder="Ein Hilfswort oder eine Phrase für den Imposter" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </form>
                       </Form>
                   </CardContent>
                   <CardFooter>
                        <Button onClick={debugForm.handleSubmit(onDebugSubmit)} disabled={isLoading} className="w-full" size="lg">
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                            Manuelles Spiel starten
                        </Button>
                   </CardFooter>
              </TabsContent>
          </Tabs>
        </Card>
      </div>
    </>
  );
}
