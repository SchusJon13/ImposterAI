import { ImposterForm } from '@/components/imposter-form';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-extrabold font-headline text-primary tracking-tight lg:text-6xl">
            ImposterAI
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-lg mx-auto">
            Gib mir eine Kategorie und einen Schwierigkeitsgrad, und ich finde das perfekte Imposter-Wort für dein Spiel.
          </p>
        </header>
        <ImposterForm />
      </div>
    </main>
  );
}
