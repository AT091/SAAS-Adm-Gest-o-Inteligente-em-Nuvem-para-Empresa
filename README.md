# FocusFlow OS

FocusFlow OS e um workspace SaaS de produtividade feito com HTML, CSS e JavaScript puro. O app inclui pipeline de prioridades, timer de foco, analytics, command palette, persistencia local, suporte opcional a Supabase e preparacao para Stripe Checkout.

## Recursos

- Dashboard responsivo com visual SaaS.
- Pipeline de tarefas com busca, filtros e prioridades.
- Timer de foco com presets de 25, 45 e 60 minutos.
- Analytics de entrega, backlog, risco e tempo focado.
- Command palette com atalho de teclado.
- Persistencia local via `localStorage`.
- Importacao e exportacao de workspace em JSON.
- Autenticacao e sincronizacao em nuvem opcionais com Supabase.
- Integracao opcional com Stripe Checkout para planos Pro.
- Manifest PWA e service worker.

## Estrutura do projeto

```text
.
|-- index.html                  # Estrutura da interface principal
|-- styles.css                  # Estilos e responsividade
|-- script.js                   # Regras de interface, tarefas, timer e sync
|-- app-config.js               # Configuracoes publicas do app
|-- manifest.json               # Manifest PWA
|-- sw.js                       # Service worker
|-- icon.svg                    # Icone do app
|-- BACKEND_SETUP.md            # Guia de Supabase, Auth e pagamentos
|-- STRIPE_CHECKOUT_EXAMPLE.js  # Exemplo de backend para Stripe Checkout
|-- DEPLOY.md                   # Guia rapido de publicacao
|-- .env.example                # Exemplo de variaveis de ambiente do backend
|-- .gitignore                  # Arquivos que nao devem ir para o GitHub
|-- LICENSE                     # Licenca MIT
`-- package.json                # Scripts e dependencias opcionais
```

## Como rodar localmente

Voce pode abrir `index.html` diretamente no navegador. Para testar PWA/service worker com servidor local, use:

```bash
npm install
npm run dev
```

Depois acesse:

```text
http://localhost:5173
```

## Configuracao

As configuracoes publicas ficam em `app-config.js`. Deixe vazio para usar apenas a versao local/offline.

```js
window.APP_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  stripeCheckoutEndpoint: "",
  stripePriceIds: {
    pro: "",
    business: ""
  },
  checkoutLinks: {
    pro: "",
    business: ""
  }
};
```

Importante: nao coloque `STRIPE_SECRET_KEY`, tokens privados ou senhas em arquivos de frontend. Segredos devem ficar somente em variaveis de ambiente no backend.

## Backend e pagamentos

Consulte [BACKEND_SETUP.md](BACKEND_SETUP.md) para configurar Supabase, tabela `workspaces`, autenticacao e opcoes de checkout.

O arquivo [STRIPE_CHECKOUT_EXAMPLE.js](STRIPE_CHECKOUT_EXAMPLE.js) e apenas um exemplo de backend Node.js/Express. Ele usa `STRIPE_SECRET_KEY` pelo ambiente do servidor e nao deve ser copiado para o frontend.

## Publicar no GitHub

```bash
git init
git add .
git commit -m "Primeira versao do FocusFlow OS"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

Depois, para publicar no GitHub Pages, abra o repositorio no GitHub e va em `Settings > Pages`. Selecione a branch `main` e a pasta `/root`.

## Licenca

MIT
