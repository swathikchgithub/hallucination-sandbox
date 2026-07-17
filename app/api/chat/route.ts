import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const KNOWLEDGE_BASE: Record<string, string> = {
  "jupiter moons": "As of 2026, Jupiter has 95 officially recognized moons.",
  "acme pricing": "Acme Enterprise plan costs $150/user/month. The Pro plan is $49/user/month.",
};

const findContext = (query: string): string | null => {
  const normalizedQuery = query.toLowerCase();
  for (const [key, val] of Object.entries(KNOWLEDGE_BASE)) {
    const keyWords = key.split(' ');
    const matchAll = keyWords.every(word => normalizedQuery.includes(word));
    if (matchAll) return val;
  }
  return null;
};

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OpenAI API Key. Please add 'OPENAI_API_KEY' to your .env.local file." }, 
      { status: 500 }
    );
  }

  const openai = new OpenAI({ apiKey });

  try {
    const { question, mitigationMode } = await req.json();

    // 1. VANILLA MODE (High temperature, creative, raw model memory)
    if (mitigationMode === 'vanilla') {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 1.2,
        messages: [{ role: 'user', content: question }],
      });
      return NextResponse.json({ output: response.choices[0].message.content });
    }

    // 2. GROUNDED MODE (RAG with Top-P & Low Temp Constraints)
    if (mitigationMode === 'grounding') {
      const matchedContext = findContext(question);
      const context = matchedContext || "No specific context found.";

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.1, // Near-deterministic
        top_p: 0.1,       // Only consider top 10% probability tokens (Mechanism #4)
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

    // 3. CHAIN-OF-VERIFICATION (CoVe)
    if (mitigationMode === 'cove') {
      const draftResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: `Give a brief, factual answer to: ${question}` }],
      });
      const draft = draftResponse.choices[0].message.content;

      const verificationPrompt = `Based on this draft answer: "${draft}", list 2 explicit verification questions that check the key factual assertions in the draft. Format as a simple list.`;
      const verifyQuestions = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: verificationPrompt }],
      });

      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: "You are a self-correcting facts editor." },
          { role: 'user', content: `Original Question: ${question}\nDraft Answer: ${draft}\nFact Check Questions:\n${verifyQuestions.choices[0].message.content}\n\nRewrite the Draft Answer to ensure absolute accuracy. If any point is unverified, remove it or clarify the uncertainty.` }
        ],
      });

      return NextResponse.json({ 
        output: finalResponse.choices[0].message.content,
        steps: { draft, verifications: verifyQuestions.choices[0].message.content }
      });
    }

    // 4. POST-GENERATION GUARDRAILS (Structured Outputs with Confidence Scores)
    if (mitigationMode === 'guardrail') {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: question }],
      });
      const rawOutput = response.choices[0].message.content || "";

      // Enforce JSON Schema for deterministic guardrail auditing (Mechanism #10)
      const guardrailResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: "json_object" },
        messages: [
          { 
            role: 'system', 
            content: `Analyze the user prompt context and original response. Strip speculative claims, absolute figures, or false leaps. 
            Return a JSON object containing:
            1. "cleanOutput": The scrubbed, conservative text.
            2. "confidenceScore": A confidence score integer from 1 to 100 based on known facts about the query.` 
          },
          { role: 'user', content: `Query: ${question}\nOriginal Output: ${rawOutput}` }
        ],
      });

      const parsedResult = JSON.parse(guardrailResponse.choices[0].message.content || "{}");

      return NextResponse.json({ 
        output: parsedResult.cleanOutput, 
        wasGuarded: true, 
        originalOutput: rawOutput,
        confidenceScore: parsedResult.confidenceScore
      });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}