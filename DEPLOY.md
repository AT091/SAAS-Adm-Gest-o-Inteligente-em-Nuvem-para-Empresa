# Guia de publicacao

## Antes de subir

1. Revise `app-config.js` e deixe apenas chaves publicas.
2. Confira se `.env` nao existe no commit. Use `.env.example` como modelo.
3. Rode o app localmente e valide as telas principais.
4. Faca o commit inicial.

```bash
git init
git add .
git commit -m "Primeira versao do FocusFlow OS"
```

## GitHub

1. Crie um repositorio no GitHub.
2. Conecte este projeto ao repositorio remoto.

```bash
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

## GitHub Pages

1. Entre no repositorio no GitHub.
2. Va em `Settings > Pages`.
3. Em `Build and deployment`, escolha `Deploy from a branch`.
4. Selecione a branch `main` e a pasta `/root`.
5. Salve e aguarde a URL publicada.

## Netlify

1. Crie um novo site no Netlify.
2. Conecte o repositorio do GitHub.
3. Deixe o build command vazio.
4. Use `/` como publish directory.

## Vercel

1. Importe o repositorio do GitHub.
2. Use as configuracoes padrao de projeto estatico.
3. Clique em deploy.

## Notas de producao

- Configure Supabase em `app-config.js` somente com URL e anon key.
- Configure links de checkout ou `stripeCheckoutEndpoint`.
- Nunca exponha `STRIPE_SECRET_KEY` em arquivos de frontend.
- Use backend ou serverless function para webhooks e validacao de assinaturas.
