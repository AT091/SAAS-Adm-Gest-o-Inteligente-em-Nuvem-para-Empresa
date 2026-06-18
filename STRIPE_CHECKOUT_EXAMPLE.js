// Exemplo Node.js/Express para criar uma sessao segura do Stripe Checkout.
// Nao coloque STRIPE_SECRET_KEY no frontend.
//
// npm install express cors stripe
// STRIPE_SECRET_KEY=sk_live_xxx node STRIPE_CHECKOUT_EXAMPLE.js

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({ origin: true }));
app.use(express.json());

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { priceId, userId, email, successUrl, cancelUrl } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "priceId is required" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      client_reference_id: userId || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        app: "focusflow-os",
        userId: userId || "anonymous"
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(4242, () => {
  console.log("Stripe checkout server running on http://localhost:4242");
});
