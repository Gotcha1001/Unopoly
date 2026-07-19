export const LIFE_EVENTS = [
  // ── Big windfalls ──────────────────────────────────────────────────
  { id: "life_lottery", label: "Lottery Win", amount: 10000 },
  { id: "life_inheritance", label: "Family Inheritance", amount: 6000 },
  { id: "life_bonus", label: "Work Bonus", amount: 1500 },
  { id: "life_promotion", label: "Promotion Raise", amount: 2000 },
  { id: "life_severance", label: "Severance Package", amount: 3000 },
  { id: "life_taxrefund", label: "Tax Refund", amount: 900 },
  { id: "life_stockdividend", label: "Stock Dividend", amount: 700 },
  { id: "life_sidehustle", label: "Side Hustle Payout", amount: 600 },

  // ── Modest gifts ───────────────────────────────────────────────────
  { id: "life_gift", label: "Birthday Gift", amount: 500 },
  { id: "life_weddinggift", label: "Wedding Gift", amount: 400 },
  { id: "life_holidaybonus", label: "Holiday Bonus", amount: 350 },
  { id: "life_refund", label: "Insurance Refund", amount: 300 },
  { id: "life_garagesale", label: "Garage Sale Haul", amount: 250 },
  { id: "life_cashback", label: "Cashback Windfall", amount: 200 },

  // ── Everyday bills ─────────────────────────────────────────────────
  { id: "life_carrepair", label: "Car Breakdown", amount: -400 },
  { id: "life_applianceRepair", label: "Appliance Repair", amount: -350 },
  { id: "life_petbill", label: "Emergency Vet Bill", amount: -450 },
  { id: "life_phonebill", label: "Phone Replacement", amount: -300 },
  { id: "life_homeinsurance", label: "Home Insurance Premium", amount: -500 },
  { id: "life_utilities", label: "Surprise Utility Bill", amount: -250 },
  { id: "life_movingcosts", label: "Moving Costs", amount: -600 },

  // ── Bigger hits ────────────────────────────────────────────────────
  { id: "life_medical", label: "Medical Bill", amount: -800 },
  { id: "life_dentalsurgery", label: "Dental Surgery", amount: -900 },
  { id: "life_tax", label: "Tax Bill", amount: -1200 },
  { id: "life_rent", label: "Rent Due", amount: -1000 },
  { id: "life_studentloan", label: "Student Loan Payment", amount: -1100 },
  { id: "life_roofrepair", label: "Roof Repair", amount: -1400 },
  { id: "life_legalfees", label: "Legal Fees", amount: -1000 },

  // ── Small annoyances ───────────────────────────────────────────────
  { id: "life_fine", label: "Parking Fine", amount: -150 },
  { id: "life_speedingfine", label: "Speeding Fine", amount: -200 },
  { id: "life_latefee", label: "Late Payment Fee", amount: -80 },
  {
    id: "life_subscriptioncreep",
    label: "Forgotten Subscriptions",
    amount: -100,
  },
] as const;
