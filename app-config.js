// Configuracoes publicas do FocusFlow OS.
//
// Este arquivo pode ir para o GitHub porque deve conter apenas valores publicos:
// - Supabase URL
// - Supabase anon key
// - Stripe price IDs
// - links de checkout
//
// Nunca coloque STRIPE_SECRET_KEY, chaves privadas ou tokens de servidor aqui.
window.APP_CONFIG = {
  // URL do projeto Supabase. Exemplo: "https://seu-projeto.supabase.co"
  supabaseUrl: "",

  // Chave publica anon do Supabase. Ela e feita para uso no frontend.
  supabaseAnonKey: "",

  // Endpoint opcional do backend que cria sessoes Stripe Checkout.
  // Exemplo local: "http://localhost:4242/create-checkout-session"
  stripeCheckoutEndpoint: "",

  // IDs publicos dos precos criados no Stripe, usados pelo backend de checkout.
  stripePriceIds: {
    pro: "",
    business: ""
  },

  // Alternativa sem backend: cole aqui Stripe Payment Links, Hotmart ou Mercado Pago.
  checkoutLinks: {
    pro: "",
    business: ""
  }
};
