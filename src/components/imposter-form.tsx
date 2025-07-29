
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Smile, Meh, Frown, Wand2, ArrowRight } from "lucide-react";
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getImposterWordAction } from "@/app/actions";
import type { GenerateImposterWordOutput } from "@/ai/flows/generate-imposter-word";

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

export function ImposterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateImposterWordOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      difficulty: "medium",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);

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
    }
  }

  const handleStartOver = () => {
    setResult(null);
    form.reset();
  };

  if (result) {
    const gameUrl = `/play?word=${encodeURIComponent(result.imposterWord || '')}&hint=${encodeURIComponent(result.hint || '')}`;
    return (
      <div className="mt-10 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 text-center">
         <Card className="w-full max-w-2xl mx-auto shadow-2xl overflow-hidden">
              <CardHeader className="text-center bg-primary/10 p-6">
                  <CardTitle className="text-2xl font-bold font-headline text-accent">
                      Spiel erstellt!
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                  <p className="text-lg text-foreground">Dein Wort ist: <span className="font-bold text-primary">{result.imposterWord}</span></p>
                  <p className="text-muted-foreground">Teile diesen Link mit den anderen Spielern:</p>
                  <div className="flex items-center space-x-2">
                    <Input value={`${window.location.origin}${gameUrl}`} readOnly className="text-center"/>
                    <Button onClick={() => navigator.clipboard.writeText(`${window.location.origin}${gameUrl}`)}>Kopieren</Button>
                  </div>
              </CardContent>
              <CardFooter className="flex-col gap-4 p-6 bg-muted/50">
                <Link href={gameUrl} passHref>
                  <Button asChild className="w-full">
                    <a>
                      Zum Spiel beitreten <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
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
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Kategorie</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. Tiere, Technologie, Geschichte" {...field} className="text-base"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-lg">Schwierigkeitsgrad</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                      >
                        {difficultyOptions.map((option) => (
                           <FormItem key={option.value}>
                             <FormControl>
                               <RadioGroupItem value={option.value} id={option.value} className="sr-only peer" />
                             </FormControl>
                             <Label
                              htmlFor={option.value}
                              className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                            >
                               <option.icon className="mb-3 h-7 w-7" />
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

              <Button type="submit" disabled={isLoading} className="w-full text-lg py-6">
                {isLoading ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-6 w-6" />
                )}
                Wort generieren
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
