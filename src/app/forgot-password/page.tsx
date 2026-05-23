import { resetPassword } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-2 text-center pb-8">
          <CardTitle className="text-3xl font-bold tracking-tight">Recuperar Senha</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Digite seu email para receber o link de redefinição.
          </CardDescription>
        </CardHeader>
        
        <form>
          {params?.error && (
            <div className="px-6 mb-4">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
                <strong className="font-bold">Erro: </strong>
                <span className="block sm:inline">{params.error}</span>
              </div>
            </div>
          )}
          {params?.message && (
            <div className="px-6 mb-4">
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-sm" role="alert">
                <span className="block sm:inline">{params.message}</span>
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
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3 pt-4">
            <Button 
              type="submit"
              formAction={resetPassword} 
              className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
            >
              Enviar link de recuperação
            </Button>
            <Button 
              asChild
              variant="outline" 
              className="w-full h-11"
            >
              <Link href="/login">Voltar para Login</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
