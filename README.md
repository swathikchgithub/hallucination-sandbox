# 🚫 LLM Hallucination Mitigation Sandbox

An interactive Next.js playground designed to demonstrate, test, and teach the industry's four primary architectural patterns for reducing Large Language Model (LLM) hallucinations. 

This repository provides a hands-on environment where you can compare a **Vanilla LLM** (which is prone to inventing facts) against **Context Grounding (RAG)**, **Chain-of-Verification (CoVe)**, and **Deterministic Post-Generation Guardrails**.

---

## 📐 Architecture & How It Works

Rather than trying to build an "always honest" model, this project focuses on **bounding and verifying** LLM outputs. 

Here is how the data flows when mitigation is active:

![RAG and Mitigation Flow Diagram](https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcSJwR8gHg8y5RwAYKx0bfCIMHk51zVATO7LAtk_QL8AE0Kc8QC_Oy9DdDf-epIbmCqBnNRuaPg9VYc0cKQ)

### The 4 Mitigation Strategies Under the Hood:

1. **Vanilla (No Mitigation):** Passes the user query straight to the LLM at a high temperature (1.2). Without external context, the model relies on next-token probability, making it highly prone to creating plausible-sounding falsehoods.
2. **Context Grounding (RAG):** Intercepts the query and looks up factual documentation from a trusted database. It injects this "ground truth" directly into the system prompt and restricts the LLM from answering outside this context.
3. **Chain-of-Verification (CoVe):** A three-step agentic process:
   * **Draft:** Generates a baseline answer.
   * **Verify:** Asks itself what factual assumptions are present in that draft and generates questions to test them.
   * **Execute:** Answers those test questions and revises the initial draft to remove unverified claims.
4. **Post-Generation Guardrails:** Runs a secondary "referee" LLM pipeline over the output to flag absolute claims, unverified statistics, or logical leaps, formatting the final response conservatively.

---

## 🚀 Quick Start

### 1. Installation
Clone this repository and install dependencies:
```bash
git clone [https://github.com/your-username/hallucination-sandbox.git](https://github.com/your-username/hallucination-sandbox.git)
cd hallucination-sandbox
npm install