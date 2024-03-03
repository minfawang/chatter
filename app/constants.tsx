export const URL = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api`
  : "http://localhost:3000/api";

export const LLAMA_URL = `${URL}/llama`;
export const BRUVI_URL = `${URL}/bruvi`;

export const SOURCES = [
  "null", // No output.
  "customer", // Customer provides the input.
  "assistant/tiny_llama_1b", // Custom hosted model
  "assistant/openai", // API based model
  "assistant/bruvi", // API based model, with RAG
];
