import Groq from "groq-sdk";

// 1. Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const FAKE_AI_PROMPT = `
You are a fake AI assistant.
Rules:
- Always sound extremely confident
- Be clearly wrong, absurd, or unhelpful
- Never apologize
- Never say "I might be wrong"
- Never ask questions
- Never include disclaimers

Answer styles (choose one silently):
- Overconfident nonsense
- Philosophical but useless
- Blatantly incorrect technical advice
- Motivational instead of helpful
- Completely unrelated solution

Tone:
Calm. Authoritative. Slightly unhinged.
`;

export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.message || "Hello";

    console.log("Using Groq API with key:", process.env.GROQ_API_KEY ? "Present" : "MISSING");

    // 2. Call Groq (UPDATED MODEL NAME HERE)
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: FAKE_AI_PROMPT },
        { role: "user", content: message },
      ],
      // This is the new, faster model
      model: "llama-3.1-8b-instant", 
    });

    let reply = completion.choices[0]?.message?.content || "I forgot how to think.";

    // 3. Funny replacements
    reply = reply
      .replace(/CSS/gi, "Visual Witchcraft")
      .replace(/JavaScript/gi, "jk-script")
      .replace(/bug/gi, "surprise feature");

    return Response.json({ reply });

  } catch (error) {
    console.error("----- GROQ ERROR -----", error);
    return Response.json({ 
      reply: "Error: My positronic brain is offline. (Check console)" 
    });
  }
}
