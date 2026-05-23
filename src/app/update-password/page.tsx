import { updatePassword } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-2 text-center pb-8">
          <CardTitle className="text-3xl font-bold tracking-tight">Nova Senha</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Digite sua nova senha de acesso.
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
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium">Nova Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                required
                className="h-11 bg-white/50 dark:bg-zinc-950/50 focus:bg-white dark:focus:bg-zinc-950 transition-colors"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3 pt-4">
            <Button 
              type="submit"
              formAction={updatePassword} 
              className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
            >
              Atualizar Senha
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
