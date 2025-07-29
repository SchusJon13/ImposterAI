
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Smile, Meh, Frown, Wand2 } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getImposterWordAction } from "@/app/actions";
import type { GenerateImposterWordOutput } from "@/ai/flows/generate-imposter-word";

const formSchema = z.object({
  category: z.string().min(2, {
    message: "Category must be at least 2 characters.",
  }),
  difficulty: z.enum(["easy", "medium", "hard"], {
    required_error: "You need to select a difficulty level.",
  }),
});

const difficultyOptions = [
  { value: "easy", label: "Easy", icon: Smile },
  { value: "medium", label: "Medium", icon: Meh },
  { value: "hard", label: "Hard", icon: Frown },
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
        title: "Something went wrong",
        description: error,
      });
    } else if (data) {
      setResult(data);
    }
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
                    <FormLabel className="text-lg">Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Animals, Technology, History" {...field} className="text-base"/>
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
                    <FormLabel className="text-lg">Difficulty</FormLabel>
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
                Generate Word
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {result && (
        <div className="mt-10 animate-in fade-in-0 slide-in-from-bottom-5 duration-500">
           <Card className="w-full max-w-2xl mx-auto shadow-2xl overflow-hidden">
                <CardHeader className="text-center bg-primary/10 p-6">
                    <CardTitle className="text-2xl font-bold font-headline text-accent">
                        Here is your word!
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-8">
                    <p className="text-6xl font-extrabold text-primary tracking-wider uppercase drop-shadow-sm">
                        {result.imposterWord}
                    </p>
                </CardContent>
                {result.hint && (
                    <>
                        <Separator />
                        <CardFooter className="flex-col items-start gap-2 p-6 bg-muted/50">
                            <h3 className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Hint</h3>
                            <p className="text-base text-foreground/80 italic">
                                {result.hint}
                            </p>
                        </CardFooter>
                    </>
                )}
            </Card>
        </div>
      )}
    </>
  );
}
