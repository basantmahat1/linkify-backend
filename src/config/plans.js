// Single source of truth for plan pricing and limits.
// No real payment gateway is wired up yet — upgrading here just switches the
// `plan` field, which is what unlocks/limits features. Swap in Stripe by
// replacing the `/api/billing/upgrade` handler with a checkout session and
// only setting `plan` from a verified webhook.
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    maxLinks: 10,
    maxPages: 1,
    maxProducts: 3,
    branding: true,
    features: ["1 bio page", "10 links", "3 store products", "Basic templates", "Basic customization", "Basic analytics", "Platform branding"],
  },
  pro: {
    name: "Pro",
    price: 8, // USD/month, midpoint of $5–10
    maxLinks: Infinity,
    maxPages: 1,
    maxProducts: 25,
    branding: false,
    features: [
      "Unlimited links",
      "Premium templates",
      "Remove branding",
      "Advanced analytics",
      "Custom domain",
      "Link & product scheduling",
      "Email collection",
      "QR codes",
      "25 store products",
    ],
  },
  business: {
    name: "Business",
    price: 22, // USD/month, midpoint of $15–30
    maxLinks: Infinity,
    maxPages: Infinity,
    maxProducts: Infinity,
    branding: false,
    features: ["Multiple pages", "Team members", "Advanced analytics", "Unlimited products", "Booking", "Custom branding"],
  },
};

export function planLimits(planKey) {
  return PLANS[planKey] || PLANS.free;
}
