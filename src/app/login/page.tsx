import { login, signup } from './actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>
}) {
  const params = await searchParams;
  const isSignup = params.mode === 'signup';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg shadow-lg rotate-12 transition-transform hover:rotate-0 duration-300"></div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Casa Criativa</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Sistema de Gestão Integrado
          </CardDescription>
        </CardHeader>
        
        <form>
          {params?.error && (
            <div className="px-6 mb-4">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
                <strong className="font-bold">Erro: </strong>
                <span className="block sm:inline">{params.error === 'true' ? 'Ocorreu um erro ao tentar entrar ou criar a conta.' : params.error}</span>
              </div>
            </div>
          )}
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                className="h-11 bg-white/50 dark:bg-zinc-950/50 focus:bg-white dark:focus:bg-zinc-950 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-medium">Senha</Label>
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="h-11 bg-white/50 dark:bg-zinc-950/50 focus:bg-white dark:focus:bg-zinc-950 transition-colors"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3 pt-4">
            <Button 
              type="submit"
              formAction={isSignup ? signup : login} 
              className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
            >
              {isSignup ? 'Finalizar Cadastro' : 'Entrar no Sistema'}
            </Button>
            
            <Button 
              asChild
              variant="outline" 
              className="w-full h-11"
            >
              <Link href={isSignup ? '/login' : '/login?mode=signup'}>
                {isSignup ? 'Já tenho uma conta (Fazer Login)' : 'Criar uma nova conta'}
              </Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
