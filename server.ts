import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API Route for AI Transcription Summarization
  app.post("/api/summarize", async (req, res) => {
    try {
      const { transcription } = req.body;
      if (!transcription || typeof transcription !== "string" || !transcription.trim()) {
        return res.status(400).json({ error: "Transcription content is required." });
      }
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
      }
      
      // Lazy load GoogleGenAI as required by the dependency guidelines
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are an expert executive assistant. Summarize the following meeting or relationship transcription in a structured format:
1. One-sentence high-level overview.
2. Short bulleted list of 2-4 key takeaways/insights (personal details, preferences, context).
3. Short bulleted list of actionable next steps/action items (if any).

Keep the output brief, professional, and formatted in clean markdown.

Transcription:
${transcription}`,
      });
      
      const summary = response.text || "No summary could be generated.";
      res.json({ summary });
    } catch (error: any) {
      console.error("Error generating AI summary:", error);
      res.status(500).json({ error: error.message || "An error occurred during summarization." });
    }
  });

  // --- Push Notification & Relationship Maintenance Reminder API ---
  const {
    getVapidPublicKey,
    addSubscription,
    removeSubscription,
    syncReminders,
    snoozeReminder,
    sendPushToAll,
    processDueReminders,
    startReminderScheduler,
    getEngineStats,
    updateNotificationSettings
  } = await import("./server/notificationEngine.js");

  // Get VAPID Public Key for client subscription
  app.get("/api/notifications/vapid-public-key", (req, res) => {
    try {
      const publicKey = getVapidPublicKey();
      res.json({ publicKey });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve VAPID key" });
    }
  });

  // Register / update a Web Push subscription
  app.post("/api/notifications/subscribe", (req, res) => {
    try {
      const { subscription } = req.body;
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: "Invalid subscription payload" });
      }

      const result = addSubscription({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        createdAt: new Date().toISOString(),
        userAgent: req.headers["user-agent"]
      });

      res.json({ success: true, total: result.total });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Subscription failed" });
    }
  });

  // Unsubscribe endpoint
  app.post("/api/notifications/unsubscribe", (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint is required" });
      }
      removeSubscription(endpoint);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Sync contacts relationship maintenance reminders to server scheduler
  app.post("/api/notifications/sync-reminders", (req, res) => {
    try {
      const { reminders } = req.body;
      if (!Array.isArray(reminders)) {
        return res.status(400).json({ error: "Reminders array expected" });
      }
      const result = syncReminders(reminders);
      res.json({ success: true, count: result.count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Send an immediate test Web Push notification to all active devices
  app.post("/api/notifications/test", async (req, res) => {
    try {
      const { title, body } = req.body || {};
      const result = await sendPushToAll({
        title: title || "🔔 Rolodox Test Push Notification",
        body: body || "Your device is successfully linked! You will receive automated relationship follow-up reminders.",
      });
      res.json({ success: true, sent: result.sent, failed: result.failed });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Snooze a contact's maintenance reminder
  app.post("/api/notifications/snooze", (req, res) => {
    try {
      const { contactId, hours = 24 } = req.body;
      if (!contactId) {
        return res.status(400).json({ error: "ContactId is required" });
      }
      const result = snoozeReminder(Number(contactId), Number(hours));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get current notification engine status & settings
  app.get("/api/notifications/status", (req, res) => {
    try {
      const stats = getEngineStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update notification settings
  app.post("/api/notifications/settings", (req, res) => {
    try {
      const { settings } = req.body;
      if (!settings) {
        return res.status(400).json({ error: "Settings payload required" });
      }
      const updated = updateNotificationSettings(settings);
      res.json({ success: true, settings: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Force check due reminders
  app.post("/api/notifications/check-now", async (req, res) => {
    try {
      await processDueReminders();
      res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Start background reminder scheduler
  startReminderScheduler();

  // Vite middleware for development vs static build for production
  const isProduction = process.env.NODE_ENV === "production" || 
    (typeof __filename !== "undefined" && __filename.includes("dist")) || 
    Boolean(process.argv[1] && process.argv[1].includes("dist"));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
