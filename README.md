# 🚫 Interactive LLM Hallucination Mitigation Playground

An advanced, minimalist Next.js dashboard engineered to showcase how industrial LLM pipelines bound, verify, and filter generative hallucinations in production.

---

## 🛠️ The 10 Layer Hallucination Defense Framework

This playground implements and demonstrates the leading industrial practices for limiting generative errors:

| Mechanism | Description | Implementation inside the Sandbox |
| :--- | :--- | :--- |
| **1. Prompt Engineering** | Framing system logic strictly. | Used in RAG System instructions to force model to refuse to extrapolate. |
| **2. Retrieval-Augmented Generation (RAG)** | Pulling verified facts before prompting. | Connected to a local DB containing Acme pricing and Jupiter moon updates. |
| **3. Temperature Control** | Locking randomness metrics. | Configured down to `0.1` in grounded tasks and `1.2` in vanilla tests. |
| **4. Top-P Sampling** | Restricting candidate tokens. | Locked to `0.1` (top 10% probability tokens only) in grounding mode. |
| **5. Fine-Tuning** | Re-training weights with domain data. | Modeled in our layout architecture via our context databases. |
| **6. Data Balance** | Handling training and reference biases. | Handled upstream by our base engine provider (gpt-4o-mini). |
| **7. Evaluation Gates (AutoEval)** | Post-processing quality threshold checks. | Executed through an automated structured parsing step. |
| **8. Constitutional AI / RLHF** | Base alignment protocols. | Handled during base model pre-training. |
| **9. Self-Consistency** | Multiple execution turn matching. | Demonstrated via our active **Chain-of-Verification (CoVe)** process. |
| **10. Confidence Scoring** | Calculating validity probability. | Returns a real-time safety confidence score (1-100%) in Guardrails. |

---

## 🚀 Installation & Running

1. **Clone and Install:**
   ```bash
   git clone [https://github.com/swathikchgithub/hallucination-sandbox.git](https://github.com/swathikchgithub/hallucination-sandbox.git)
   cd hallucination-sandbox
   npm install