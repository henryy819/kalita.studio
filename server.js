// server.js (Light Theme + Custom Price Input, No 'Work' link/button, spinnerless inputs, no header price box)

require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4242;
const STUDIO_NAME = process.env.STUDIO_NAME || "Luna Design Studio";

function baseUrl(req) { return `${req.protocol}://${req.get("host")}`; }

app.post("/create-checkout-session", async (req, res) => {
  try {
    const amount = parseInt(req.body?.amount, 10);
    if (!amount || amount < 100) {
      return res.status(400).json({ error: "Invalid amount. Must be at least $1." });
    }

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", `${baseUrl(req)}/success`);
    params.append("cancel_url", `${baseUrl(req)}/cancel`);
    params.append("billing_address_collection", "auto");

    params.append("line_items[0][quantity]", "1");
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][unit_amount]", String(amount));
    params.append("line_items[0][price_data][product_data][name]", "Custom Design Payment");
    params.append("line_items[0][price_data][product_data][description]", "Customer-set price for design work.");

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Stripe error" });
    }
    return res.json({ url: data.url, id: data.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error creating checkout session" });
  }
});

app.get("/", (req, res) => {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${STUDIO_NAME} — Brand & Web Design</title>
  <meta name="description" content="${STUDIO_NAME} helps ambitious brands ship beautiful identities and websites." />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    html,body{height:100%;}
    body { font-family: Inter, ui-sans-serif, system-ui; }
    .glass { backdrop-filter: blur(10px); background: rgba(255,255,255,0.7); border:1px solid rgba(15,23,42,0.08); box-shadow: 0 10px 30px rgba(2,6,23,0.06); }
    .soft { box-shadow: 0 1px 0 rgba(2,6,23,.06), 0 10px 30px rgba(2,6,23,.06); }
    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    input[type=number] { -moz-appearance: textfield; }
  </style>
</head>
<body class="min-h-screen bg-white text-slate-900">
  <!-- Nav -->
  <header class="sticky top-0 z-40 bg-white/80 backdrop-blur">
    <nav class="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between border-b border-slate-200">
      <a href="#" class="font-bold tracking-tight text-lg">${STUDIO_NAME}</a>
      <div class="hidden md:flex gap-6 text-sm">
        <a href="#services" class="hover:opacity-70">Services</a>
        <a href="#contact" class="hover:opacity-70">Contact</a>
      </div>
    </nav>
  </header>

  <!-- Hero -->
  <section class="mx-auto max-w-6xl px-4 py-16 md:py-24">
    <div class="grid md:grid-cols-2 gap-10 items-center">
      <div>
        <h1 class="text-4xl md:text-5xl font-extrabold leading-tight">Design that moves your metrics.</h1>
        <p class="mt-4 text-slate-600 max-w-prose">Strategy-first branding and websites for founders who care about craft <em>and</em> conversion. We sprint, ship, and iterate with you.</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <input id="price-input" type="number" placeholder="Enter amount (USD)" class="px-4 py-3 border border-slate-300 rounded-xl w-48" />
          <button id="cta-pay-hero" class="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold soft">Pay Now</button>
        </div>
        <p class="mt-3 text-xs text-slate-500">Test mode ready. Use Stripe test card 4242 4242 4242 4242.</p>
      </div>
      <div class="relative">
        <div class="relative glass rounded-3xl p-6">
          <img alt="Showcase" src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1600&auto=format&fit=crop" class="rounded-2xl">
        </div>
      </div>
    </div>
  </section>

  <!-- Services -->
  <section id="services" class="mx-auto max-w-6xl px-4 py-12">
    <h2 class="text-2xl font-bold">Services</h2>
    <div class="mt-6 grid md:grid-cols-3 gap-6">
      ${[
        {t:"Brand Identity", d:"Logo, typography, color, and a crisp mini style guide."},
        {t:"Website Design", d:"High-converting marketing sites built for speed and clarity."},
        {t:"Art Direction", d:"Creative direction for photography and campaign visuals."},
      ].map(card=>`<div class='glass rounded-2xl p-5'>
          <h3 class='font-semibold'>${card.t}</h3>
          <p class='text-sm text-slate-600 mt-2'>${card.d}</p>
        </div>`).join("")}
    </div>
  </section>

  <!-- Contact -->
  <section id="contact" class="mx-auto max-w-6xl px-4 py-16">
    <div class="glass rounded-3xl p-8">
      <h2 class="text-2xl font-bold">Tell us about your project</h2>
      <form class="mt-6 grid gap-4 md:grid-cols-2">
        <input class="rounded-xl px-4 py-3 border border-slate-300" placeholder="Name" required>
        <input class="rounded-xl px-4 py-3 border border-slate-300" placeholder="Email" type="email" required>
        <input class="rounded-xl px-4 py-3 md:col-span-2 border border-slate-300" placeholder="Company / brand">
        <textarea class="rounded-xl px-4 py-3 md:col-span-2 border border-slate-300" rows="4" placeholder="What are you trying to achieve?" ></textarea>
        <div class="md:col-span-2 flex gap-3">
          <input id="price-input-contact" type="number" placeholder="Enter amount (USD)" class="px-4 py-3 border border-slate-300 rounded-xl w-48" />
          <button type="button" id="cta-pay-contact" class="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold soft">Pay Now</button>
        </div>
      </form>
    </div>
  </section>

  <footer class="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500">
    <p>© <span id="year"></span> ${STUDIO_NAME}. All rights reserved.</p>
  </footer>

  <script>
    document.getElementById('year').textContent = new Date().getFullYear();

    // Prevent mouse wheel from changing number inputs
    document.addEventListener('wheel', function(e){
      const active = document.activeElement;
      if (active && active.tagName === 'INPUT' && active.type === 'number') {
        e.preventDefault();
      }
    }, { passive: false });

    async function goCheckout(inputId){
      try {
        const val = document.getElementById(inputId)?.value;
        const amount = Math.round(parseFloat(val) * 100);
        if(!amount || amount < 100){
          alert('Enter a valid amount (at least $1)');
          return;
        }
        const res = await fetch('/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.error || 'Checkout failed');
        window.location = data.url;
      } catch (e) { alert(e.message || 'Error'); }
    }

    document.getElementById('cta-pay-hero').addEventListener('click', ()=> goCheckout('price-input'));
    document.getElementById('cta-pay-contact').addEventListener('click', ()=> goCheckout('price-input-contact'));
  </script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// Light success/cancel pages
app.get("/success", (req, res) => {
  res.send(`<!doctype html><html><head><meta charset='utf-8'/><meta name='viewport' content='width=device-width,initial-scale=1'/><script src='https://cdn.tailwindcss.com'></script></head><body class='min-h-screen bg-white text-slate-900 grid place-items-center p-6'><div class='max-w-lg text-center'><h1 class='text-3xl font-extrabold'>Payment successful 🎉</h1><p class='mt-2 text-slate-600'>Thanks for choosing ${STUDIO_NAME}. We'll email you within 24 hours to kick off.</p><a href='/' class='inline-block mt-6 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold'>Back to site</a></div></body></html>`);
});

app.get("/cancel", (req, res) => {
  res.send(`<!doctype html><html><head><meta charset='utf-8'/><meta name='viewport' content='width=device-width,initial-scale=1'/><script src='https://cdn.tailwindcss.com'></script></head><body class='min-h-screen bg-white text-slate-900 grid place-items-center p-6'><div class='max-w-lg text-center'><h1 class='text-3xl font-extrabold'>Checkout canceled</h1><p class='mt-2 text-slate-600'>No charge was made. You can try again or contact us.</p><a href='/' class='inline-block mt-6 px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50'>Back to site</a></div></body></html>`);
});

app.listen(PORT, () => {
  console.log(`\n${STUDIO_NAME} ready on http://localhost:${PORT}`);
});
