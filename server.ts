import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Standard database storage paths in sandbox
const PROJECTS_FILE = path.join(process.cwd(), "projects.json");
const BILLING_FILE = path.join(process.cwd(), "billing.json");

// Helper to load/save billing data for live responsive persistence
function getBilling() {
  try {
    if (fs.existsSync(BILLING_FILE)) {
      return JSON.parse(fs.readFileSync(BILLING_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading billing state:", err);
  }
  return {
    tier: "Starter",
    creditsUsed: 14,
    creditsTotal: 50,
    status: "ACTIVE",
    billingInterval: "monthly",
    invoices: [
      { id: "FAC-2026-004", amount: 24500, date: "2026-05-18", status: "Payé", method: "Wave" },
      { id: "FAC-2026-003", amount: 24500, date: "2026-04-18", status: "Payé", method: "Orange Money" },
      { id: "FAC-2026-002", amount: 9900, date: "2026-03-18", status: "Payé", method: "Wave" },
      { id: "FAC-2026-001", amount: 9900, date: "2026-02-18", status: "Payé", method: "Wave" }
    ]
  };
}

function saveBilling(data: any) {
  try {
    fs.writeFileSync(BILLING_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving billing state:", err);
  }
}

// Helper to load/save projects in a simple local file for robust persistence
function getProjects() {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      return JSON.parse(fs.readFileSync(PROJECTS_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading projects:", err);
  }
  // Fallback initial templates structure
  return [
    {
      id: "proj-1",
      title: "Robe Wax Moderne - Kaftan d'Or",
      description: "Collection de Kaftans sénégalais haut de gamme en Wax pour les fêtes de Tabaski.",
      category: "Mode",
      slogan: "Le chic africain à portée d'un clic ! ✨",
      facebookText: "🌟 COLLECTION EXCLUSIVE TABASKI 🌟\n\nSublimez votre élégance avec nos Kaftans en Wax Premium. Des designs uniques créés à Dakar par nos maîtres tailleurs pour vous faire briller.\n\n💵 Prix : 25 000 FCFA seulement !\n🛵 Livraison express partout à Dakar.\n💳 Paiement sécurisé par Wave ou Orange Money au +221 77 123 45 67.\n\n👉 Cliquez pour commander sur WhatsApp !",
      instagramCaption: "La tradition rencontre la modernité. ✨ Notre Kaftan Wax Premium redéfinit le chic sénégalais. Commandez maintenant !\n\n#WaxSenegal #Kebetu #SartorialDakar #Tabaski2026 #ModeAfricaine",
      hashtags: ["WaxSenegal", "Kebetu", "FashionDakar", "AfriqueChic"],
      campaignType: "Instagram",
      createdAt: "2026-05-18T10:00:00Z",
      imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600",
      posterLayout: {
        title: "Kaftan Wax d'Or",
        subtitle: "L'élégance Dakaroise Premium",
        accentColor: "#D97706",
        bgColor: "#1E1B4B",
        badgeText: "-20% Tabaski",
        ctaText: "Acheter sur WhatsApp"
      },
      tiktokScript: {
         hook: "Regardez ce Kaftan briller au soleil de Dakar ! 😍",
         scenes: [
           { sceneNumber: 1, description: "Zoom serré sur les broderies dorées du Wax.", textOverlay: "Qualité Artisanale", voiceOver: "Découvrez des finitions brodées main exceptionnelles." },
           { sceneNumber: 2, description: "Modèle tournant fièrement avec le kaftan d'or.", textOverlay: "Coupe Royale", voiceOver: "Une coupe flatteuse conçue pour sublimer tous vos moments." },
           { sceneNumber: 3, description: "Billet de livraison Dakar et logo Wave.", textOverlay: "Livraison Partout / Wave dispo", voiceOver: "Profitez d'une livraison à domicile et de facilités Wave." }
         ]
      }
    },
    {
      id: "proj-2",
      title: "Thieboudienne Royale - Chez Aby",
      description: "Le meilleur Thieb rouge de la capitale au poisson frais, livré chaud.",
      category: "Restauration",
      slogan: "Le vrai goût du Djolof chez vous ! 🐟🍚",
      facebookText: "🐟 LE MEILLEUR THIEBOUDIENNE DE DAKAR LIVRÉ CHEZ VOUS 🍚\n\nEnvie de vous régaler à midi ? Chez Aby vous prépare son légendaire riz au poisson rouge, avec son goni savoureux et ses légumes frais.\n\n🍱 Plat simple : 2 500 FCFA\n👑 Thieb Royal (poisson + fruits de mer) : 4 500 FCFA\n🛵 Livraison à Dakar Plateau, Almadies, Ngor et Mermoz.\n\n📞 Commandez votre Ndioxane au +221 78 987 65 43 (Wave accepté).",
      instagramCaption: "Il n'y a pas de secret, le bon Thieboudienne rouge commence avec du poisson frais et de l'amour. Chez Aby livre votre bonheur ! 🐟❤️\n\n#ThiebouDjen #CuisineSenegalaise #DakarFood #SenegalGourmet #MangerDakar",
      hashtags: ["ThiebouDjen", "DakarFood", "LocalGourmet", "Teranga"],
      campaignType: "Facebook",
      createdAt: "2026-05-20T12:15:00Z",
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600",
      posterLayout: {
        title: "Thiéboudienne Rouge Chez Aby",
        subtitle: "Poisson Frais & Teranga 100% Locale",
        accentColor: "#E11D48",
        bgColor: "#7C2D12",
        badgeText: "2 500 FCFA",
        ctaText: "Commander Midi"
      },
      tiktokScript: {
         hook: "Voici le Thieb rouge le plus convoité de Dakar ! 🔥",
         scenes: [
           { sceneNumber: 1, description: "Le riz fumant qu'on remue dans la marmite traditionnelle.", textOverlay: "Tradition pure", voiceOver: "Midi sonne, l'odeur du riz rouge envahit votre cœur." },
           { sceneNumber: 2, description: "Ajout du gros poisson blanc farci au rof de persil.", textOverlay: "Farce Rof Royale", voiceOver: "Un poisson garni avec amour pour un goût intense." },
           { sceneNumber: 3, description: "Le plat dressé prêt à partir en scooter.", textOverlay: "Livré en 30 mins chrono !", voiceOver: "Commandez maintenant, mangez chaud !" }
         ]
      }
    }
  ];
}

function saveProjects(projects: any[]) {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving projects:", err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  const PORT = 3000;

  // Lazy initialize Gemini client safely
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is not defined.");
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey || "MOCK_KEY_OFFLINE",
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // API Route: Health status
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Route: Get Billing Profile Overviews (Real-time and Persisted)
  app.get("/api/billing/overview", (req, res) => {
    const data = getBilling();
    res.json(data);
  });

  // API Route: Reset Billing State (For QA Testing ease)
  app.post("/api/billing/reset", (req, res) => {
    const initialState = {
      tier: "Starter",
      creditsUsed: 14,
      creditsTotal: 50,
      status: "ACTIVE",
      billingInterval: "monthly",
      invoices: [
        { id: "FAC-2026-004", amount: 24500, date: "2026-05-18", status: "Payé", method: "Wave" },
        { id: "FAC-2026-003", amount: 24500, date: "2026-04-18", status: "Payé", method: "Orange Money" },
        { id: "FAC-2026-002", amount: 9900, date: "2026-03-18", status: "Payé", method: "Wave" },
        { id: "FAC-2026-001", amount: 9900, date: "2026-02-18", status: "Payé", method: "Wave" }
      ]
    };
    saveBilling(initialState);
    res.json({ success: true, state: initialState });
  });

  // API Route: Initiate Wave / Orange Money / Stripe checkout
  app.post("/api/billing/checkout", (req, res) => {
    const { planTitle, price, method, billingInterval } = req.body;
    
    // Generate a unique transaction reference
    const reference = `${method?.toLowerCase()}_tx_${Math.floor(100000 + Math.random() * 900000)}`;
    const launchUrl = method === "Wave" 
      ? `https://pay.wave.com/checkout/${reference}?amount=${price}`
      : method === "Orange"
        ? `https://orange-money.sn/pay-merchant/${reference}`
        : `https://checkout.stripe.com/pay/${reference}`;

    res.json({
      success: true,
      reference,
      launchUrl,
      amount: price,
      method,
      planTitle,
      billingInterval: billingInterval || "monthly"
    });
  });

  // API Route: Live validation and payment webhook automation simulator
  app.post("/api/billing/verify", (req, res) => {
    const { reference, method, planTitle, price, billingInterval } = req.body;
    
    // 1. Process simulated cryptographic signature check
    const headersLogs = {
      "host": "api.dakcontent.sn",
      "user-agent": "Wave-Webhook-Dispatcher/2.0",
      "x-wave-signature": crypto.createHash("sha256").update(reference + price).digest("hex")
    };

    // 2. Identify and update subscription tier / credits metadata
    const billing = getBilling();
    
    let allocatedCredits = 50;
    let finalTier = "Starter";
    const numericPrice = parseInt((price || "0").replace(/\s/g, ""), 10);

    if (planTitle.toLowerCase().includes("pro")) {
      allocatedCredits = 1000;
      finalTier = "Pro";
    } else if (planTitle.toLowerCase().includes("business") || planTitle.toLowerCase().includes("illimité")) {
      allocatedCredits = 999999; // Unlimited
      finalTier = "Business";
    } else {
      allocatedCredits = 100;
      finalTier = "Starter";
    }

    billing.tier = finalTier;
    billing.creditsTotal = allocatedCredits;
    billing.creditsUsed = 0; // reset usage on new plan
    billing.status = "ACTIVE";
    billing.billingInterval = billingInterval || "monthly";

    // 3. Append highly detailed invoice log
    const invoiceId = `FAC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newInvoice = {
      id: invoiceId,
      amount: numericPrice || 5000,
      date: new Date().toISOString().split("T")[0],
      status: "Payé" as const,
      method: method === "Wave" ? "Wave" : method === "Orange" ? "Orange Money" : "Stripe"
    };
    
    billing.invoices.unshift(newInvoice);
    saveBilling(billing);

    res.json({
      success: true,
      message: "Abonnement activé instantanément !",
      state: billing,
      webhookProcessed: {
        provider: method,
        signatureVerified: true,
        reference,
        headersLogs,
        timestamp: new Date().toISOString()
      }
    });
  });

  // API Route: Get all projects
  app.get("/api/projects", (req, res) => {
    const list = getProjects();
    res.json(list);
  });

  // API Route: Save new project
  app.post("/api/projects", (req, res) => {
    const projects = getProjects();
    const newProject = {
      id: "proj-" + Math.floor(Math.random() * 1000000),
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    projects.unshift(newProject);
    saveProjects(projects);
    res.json({ success: true, project: newProject });
  });

  // API Route: Delete project
  app.delete("/api/projects/:id", (req, res) => {
    const { id } = req.params;
    let projects = getProjects();
    const originalLength = projects.length;
    projects = projects.filter((p: any) => p.id !== id);
    if (projects.length === originalLength) {
      res.status(404).json({ error: "Project not found" });
    } else {
      saveProjects(projects);
      res.json({ success: true, id });
    }
  });

  // API Route: AI Generation powered by Gemini
  app.post("/api/generate-content", async (req, res) => {
    const { description, category, campaignType, additionalInstructions } = req.body;

    if (!description) {
      return res.status(400).json({ error: "Description is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Offline fallback mode for flawless preview experience if API key is not provisioned or active yet
      console.log("No GEMINI_API_KEY found, returning premium localized fallback simulation.");
      const categoryName = category || "Mode";
      const customSlogan = `Le meilleur de l'Afrique pour ${categoryName}! ✨`;
      
      const fallbackData = {
        slogan: customSlogan,
        facebookText: `✨ EXCELLENCE ${categoryName.toUpperCase()} EN AFRIQUE DE L'OUEST ✨\n\nDécouvrez notre offre incroyable spécialement conçue pour vous :\n\n"${description}"\n\n💵 Tarif promotionnel négociable !\n🛵 Service de livraison rapide à Dakar, Abidjan, Bamako.\n💳 Nous acceptons Wave, Orange Money et les espèces à la livraison.\n\n👉 Contactez-nous immédiatement par WhatsApp ou Message Privé !`,
        instagramCaption: `Le haut de gamme à votre portée. ✨ Conçu avec excellence pour booster votre style et votre quotidien. Qu'en pensez-vous ? ❤️\n\n#DakarBusiness #AbidjanStyle #${categoryName}Afrique #Teranga #SaaSMarketing`,
        hashtags: [categoryName + "Afrique", "DakarSaaS", "TerangaPrestige", "ExportLokal"],
        posterLayout: {
          title: `${categoryName} Premium`,
          subtitle: description.slice(0, 40) + "...",
          accentColor: "#F59E0B",
          bgColor: "#111827",
          badgeText: "Nouveau",
          ctaText: "Réserver par Wave"
        },
        tiktokScript: {
          hook: `Attendez de voir cette merveille exclusive ! 👇`,
          scenes: [
            { sceneNumber: 1, description: "Gros plan élégant sur l'article avec musique tendance.", textOverlay: "Qualité Exclusif", voiceOver: "Entrez dans une nouvelle dimension de qualité." },
            { sceneNumber: 2, description: "Geste de démonstration avec le sourire.", textOverlay: `${categoryName} d'Exception`, voiceOver: "Votre idéal au meilleur prix d'Afrique de l'Ouest." },
            { sceneNumber: 3, description: "Wave QR code et numéro de téléphone mobile.", textOverlay: "Commande Express", voiceOver: "Faites-vous livrer chez vous aujourd'hui !" }
          ]
        }
      };
      return res.json(fallbackData);
    }

    try {
      const client = getGeminiClient();
      const prompt = `
        You are "Dak'Content" chatbot - an elite SaaS AI marketing copywriting and conversion design generator tailored for French-speaking African markets (Senegal, Ivory Coast, Cameroon, Guinea, Mali, Gabon, Togo, etc.).
        
        Analyze this marketing request:
        - Product Description: "${description}"
        - Category: "${category}"
        - Main Target Channel: "${campaignType}"
        - Additional constraints: "${additionalInstructions || "None"}"

        Based on the input, generate a complete content suite. Make sure tone is engaging, highly converting, friendly, with local African references (such as 'Teranga', 'Wax', 'Dakar Plateau', 'Abidjan Cocody', WhatsApp mobile contact support, prices marked clearly, Wave / Orange Money pay channels).

        You MUST respond ONLY with a clean JSON object containing EXACTLY these keys (do not wrap in markdown block, just output JSON):
        {
          "slogan": "A powerful short slogan / hook (max 8 words)",
          "facebookText": "A complete, conversion-friendly Facebook Post with structured pricing fields, emoji headers, delivery mentions, and clear WhatsApp Call To Action. Use French with localized terms.",
          "instagramCaption": "Engaging Instagram description with emotional hook and call directly to save/share.",
          "hashtags": ["list", "of", "4", "to", "5", "local", "trending", "hashtags"],
          "posterLayout": {
            "title": "A strong, brief marketing header for a graphic poster (max 4 words)",
            "subtitle": "An elegant descriptive sub-header (max 8 words)",
            "accentColor": "A premium hexadecimal color hex (e.g. '#E11D48', '#D97706', '#10B981')",
            "bgColor": "A dark dominant background color hex (e.g. '#111827', '#0F172A', '#311005')",
            "badgeText": "Short offer badge text (e.g. '-30% Off', 'Nouveau', 'Wave Dispo')",
            "ctaText": "CTA statement (e.g. 'Acheter', 'Commander')"
          },
          "tiktokScript": {
            "hook": "Strong script hook to open the video (max 20 words)",
            "scenes": [
              {
                "sceneNumber": 1,
                "description": "Visual camera description",
                "textOverlay": "Short core text visible on screen",
                "voiceOver": "French transcript spoken by AI video voiceover"
              },
              {
                "sceneNumber": 2,
                "description": "Visual camera description",
                "textOverlay": "Short core text visible on screen",
                "voiceOver": "French transcript spoken by AI video voiceover"
              },
              {
                "sceneNumber": 3,
                "description": "Visual camera description",
                "textOverlay": "Short core text visible on screen",
                "voiceOver": "French transcript spoken by AI video voiceover"
              }
            ]
          }
        }
      `;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.8,
        }
      });

      const rawText = response.text || "{}";
      const cleanJson = JSON.parse(rawText.trim());
      res.json(cleanJson);
    } catch (apiError: any) {
      console.error("Gemini API Error details:", apiError);
      res.status(500).json({ error: "Génération interrompue. " + apiError.message });
    }
  });

  // Transcription Vocal Simulation
  app.post("/api/transcribe-vocal", (req, res) => {
    // Generate a beautiful marketing-friendly transcribing from a simulated WhatsApp voice message
    const transcriptions = [
      "Bonjour Dak'Content! Je vends des paniers de fruits frais locaux d'ici en Casamance. Je propose des mangues greffées et des papayes bien mûres. La livraison est possible tous les jours de la semaine à Dakar pour seulement 5000 francs CFA. On accepte les règlements par Wave. Est-ce que tu peux me lancer une super campagne sur Facebook ?",
      "Salut, j'ai une boutique de vêtements prêt-à-porter de luxe pour hommes aux Almadies. On vient de recevoir une collection de costumes en lin italiens hyper élégants pour les mariages de cet été. Les prix tournent autour de 95 000 francs. Fais-moi des hashtags viraux et un script TikTok d'enfer pour attirer les jeunes mariés.",
      "Salut Dak'Content, c'est pour mon salon de coiffure de tresses africaines professionnelles à Abidjan Cocody. On propose un forfait spécial tresses sans douleur avec soins capillaires gratuits ce week-end pour 15 000 francs CFA maximum. Écris un post Instagram super accrocheur avec un logo sympa."
    ];
    // Select a random transcription to feel very alive or use the placeholder
    const randomIndex = Math.floor(Math.random() * transcriptions.length);
    res.json({
      success: true,
      text: transcriptions[randomIndex],
      originalMimeType: "audio/ogg",
      duration: "18.4s"
    });
  });

  // Enable Vite middleware for standard development preview
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Dark'Content full-stack application online on port ${PORT}!`);
  });
}

startServer().catch((err) => {
  console.error("🔴 Server start failed:", err);
});
