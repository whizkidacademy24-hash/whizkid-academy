import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import session from 'express-session';
import Stripe from 'stripe';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change_this_secret';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' }) : null;
const __dirname = path.resolve();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 3 }
}));

app.get('/course', (req, res, next) => {
  if (req.session?.paid) {
    return res.sendFile(path.join(__dirname, 'public', 'course.html'));
  }
  return res.redirect('/?access=denied');
});

app.post('/create-checkout-session', async (req, res) => {
  const { planName, planPrice, planNote, fullName, email, phone, experience } = req.body;

  req.session.user = { fullName, email, phone, experience };
  req.session.plan = planName;

  if (!stripe) {
    req.session.paid = true;
    return res.redirect('/success');
  }

  const amount = parseInt((planPrice || '').replace(/[^0-9]/g, ''), 10) * 100;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'php',
            product_data: {
              name: planName,
              description: planNote,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/success`,
      cancel_url: `${req.protocol}://${req.get('host')}/?canceled=1`,
      metadata: {
        planName,
        planNote,
        email,
        fullName,
      },
    });
    return res.redirect(303, session.url);
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).send('Unable to create checkout session.');
  }
});

app.get('/success', (req, res) => {
  req.session.paid = true;
  return res.redirect('/course');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`WhizKid Trader Academy app listening on http://localhost:${PORT}`);
});
