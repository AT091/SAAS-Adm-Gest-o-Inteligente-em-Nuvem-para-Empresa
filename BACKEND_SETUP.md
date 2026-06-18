# FocusFlow OS - Backend, Auth e Monetizacao

Este projeto continua funcionando offline com `localStorage`, mas ja esta preparado para Supabase Auth, persistencia em nuvem e checkout Premium.

## 1. Supabase

Preencha `app-config.js`:

```js
window.APP_CONFIG = {
  supabaseUrl: "https://SEU-PROJETO.supabase.co",
  supabaseAnonKey: "SUA_ANON_KEY_PUBLICA",
  checkoutLinks: {
    pro: "https://buy.stripe.com/SEU_LINK_PRO",
    business: "https://buy.stripe.com/SEU_LINK_BUSINESS"
  }
};
```

No Supabase, crie uma tabela:

```sql
create table public.workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '[]'::jsonb,
  sessions integer not null default 0,
  focus_minutes integer not null default 0,
  selected_preset integer not null default 25,
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

create policy "Users can read own workspace"
on public.workspaces for select
using (auth.uid() = user_id);

create policy "Users can insert own workspace"
on public.workspaces for insert
with check (auth.uid() = user_id);

create policy "Users can update own workspace"
on public.workspaces for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

Depois ative os providers Google e Apple em Authentication > Providers.

## 2. Pagamentos

### Opcao A: Stripe Checkout com backend

Use o arquivo `STRIPE_CHECKOUT_EXAMPLE.js` como base para criar sessoes Stripe Checkout no servidor.

No `app-config.js`:

```js
window.APP_CONFIG = {
  supabaseUrl: "https://SEU-PROJETO.supabase.co",
  supabaseAnonKey: "SUA_ANON_KEY_PUBLICA",
  stripeCheckoutEndpoint: "http://localhost:4242/create-checkout-session",
  stripePriceIds: {
    pro: "price_SEU_PRICE_ID_PRO",
    business: "price_SEU_PRICE_ID_BUSINESS"
  },
  checkoutLinks: {
    pro: "",
    business: ""
  }
};
```

Em producao:

1. Crie produtos e precos recorrentes no Stripe.
2. Use o `priceId` no frontend.
3. Mantenha `STRIPE_SECRET_KEY` apenas no backend.
4. Configure webhooks do Stripe para confirmar pagamentos.
5. Salve o plano ativo do usuario em uma tabela `subscriptions`.

### Opcao B: Payment Links

- Stripe Payment Link
- Hotmart checkout link
- Mercado Pago link de pagamento

Coloque os links em `checkoutLinks.pro` e `checkoutLinks.business`.

Para producao real com Stripe Billing, webhooks e controle de assinatura, use um backend Node.js/Serverless para receber eventos e gravar o status Premium no banco.

## 3. Permissoes Free vs Pro no frontend

O `script.js` ja possui uma camada de permissao:

- Free: ate 5 prioridades, sem exportacao, sem importacao e sem sync cloud.
- Pro: tarefas ilimitadas, exportacao, importacao e sync cloud.

Importante: bloqueio no frontend melhora UX, mas nao substitui seguranca. Em producao, valide o plano tambem no backend e nas policies do banco.
