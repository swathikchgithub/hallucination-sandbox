import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Mock Database for the Grounding (RAG) simulation
const KNOWLEDGE_BASE: Record<string, string> = {
  "jupiter moons": "As of 2026, Jupiter has 95 officially recognized moons.",
  "acme pricing": "Acme Enterprise plan costs $150/user/month. The Pro plan is $49/user/month.",
};

/**
 * Smarter keyword matching engine.
 * Splits database keys (e.g., "jupiter moons" -> ["jupiter", "moons"])
 * and ensures every keyword is present anywhere inside the user's query.
 */
const findContext = (query: string): string | null => {
  const normalizedQuery = query.toLowerCase();
  
  for (const [key, val] of Object.entries(KNOWLEDGE_BASE)) {
    const keyWords = key.split(' ');
    const matchAll = keyWords.every(word => normalizedQuery.includes(word));
    if (matchAll) {
      return val;
    }
  }
  return null;
};

export async function POST(req: Request) {
  // 1. Safety Check: Prevent global crashes if key is missing
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { 
        error: "Missing OpenAI API Key. Please add 'OPENAI_API_KEY' to your .env.local file (locally) or your environment variables (in production)." 
      }, 
      { status: 500 }
    );
  }

  // 2. Initialize client safely inside the request context
  const openai = new OpenAI({ apiKey });

  try {
    const { question, mitigationMode } = await req.json();

    // ==========================================
    // 1. VANILLA MODE (High temperature, no context)
    // ==========================================
    if (mitigationMode === 'vanilla') {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 1.2, // Higher temperature to highlight creative hallucination
        messages: [{ role: 'user', content: question }],
      });
      return NextResponse.json({ output: response.choices[0].message.content });
    }

    // ==========================================
    // 2. GROUNDED MODE (Smarter RAG Context Match)
    // ==========================================
    if (mitigationMode === 'grounding') {
      const matchedContext = findContext(question);
      const context = matchedContext || "No specific context found.";

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.1, // Low temperature for factual, deterministic accuracy
        messages: [
          { 
            role: 'system', 
            content: `You are a strict factual assistant. Answer the user's question ONLY using the verified context provided below. If the answer cannot be found in the context, say "I do not have enough verified information to answer this." Do not extrapolate.\n\nContext: ${context}` 
          },
          { role: 'user', content: question }
        ],
      });
      return NextResponse.json({ 
        output: response.choices[0].message.content, 
        contextUsed: context 
      });
    }

    // ==========================================
    // 3. CHAIN-OF-VERIFICATION (CoVe Self-Correction)
    // ==========================================
    if (mitigationMode === 'cove') {
      // Step 1: Draft a quick baseline answer
      const draftResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: `Give a brief, factual answer to: ${question}` }],
      });
      const draft = draftResponse.choices[0].message.content;

      // Step 2: Formulate self-audit questions checking the draft's claims
      const verificationPrompt = `Based on this draft answer: "${draft}", list 2 explicit verification questions that check the key factual assertions in the draft. Format as a simple list.`;
      const verifyQuestions = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: verificationPrompt }],
      });

      // Step 3: Rewrite and self-edit based on those validations
      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: "You are a self-correcting facts editor." },
          { role: 'user', content: `Original Question: ${question}\nDraft Answer: ${draft}\nFact Check Questions:\n${verifyQuestions.choices[0].message.content}\n\nRewrite the Draft Answer to ensure absolute accuracy. If any point is unverified, remove it or clarify the uncertainty.` }
        ],
      });

      return NextResponse.json({ 
        output: finalResponse.choices[0].message.content,
        steps: { 
          draft, 
          verifications: verifyQuestions.choices[0].message.content 
        }
      });
    }

    // ==========================================
    // 4. POST-GENERATION GUARDRAILS
    // ==========================================
    if (mitigationMode === 'guardrail') {
      // Step 1: Generate response freely
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: question }],
      });
      const rawOutput = response.choices[0].message.content || "";

      // Step 2: Pass output through an auditing guardrail before serving
      const guardrailResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `Analyze the provided text. Does it contain absolute claims, made-up statistics, or unverified claims about "${question}"? If yes, edit the response to be conservative and safe. If it is already fully safe, return it as-is.` 
          },
          { role: 'user', content: rawOutput }
        ],
      });

      return NextResponse.json({ 
        output: guardrailResponse.choices[0].message.content, 
        wasGuarded: true, 
        originalOutput: rawOutput 
      });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}