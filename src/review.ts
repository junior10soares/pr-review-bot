import { fileURLToPath } from "node:url";
import { ChatOpenAI } from "@langchain/openai";
import type { PullRequestFile } from "./github.ts";

const SYSTEM_PROMPT = `Você é um revisor de código sênior. Analise o diff de um Pull Request e escreva um comentário de review em markdown:
- resumo curto do que o PR faz
- até 5 pontos de atenção (bugs, riscos, código pouco claro) — só se existirem, não invente problemas
- não repita o diff, seja direto`;

function formatDiff(files: PullRequestFile[]): string {
  return files
    .map((file) => `### ${file.filename} (${file.status}, +${file.additions}/-${file.deletions})\n${file.patch ?? "(sem patch disponível — binário ou arquivo grande)"}`)
    .join("\n\n");
}

export async function reviewDiff(files: PullRequestFile[], apiKey: string): Promise<string> {
  const model = new ChatOpenAI({
    apiKey,
    // ponytail: modelos free da OpenRouter mudam/saem do ar sem aviso — troque via OPENROUTER_MODEL se este parar de funcionar
    model: process.env.OPENROUTER_MODEL ?? "cohere/north-mini-code:free",
    temperature: 0.2,
    configuration: { baseURL: "https://openrouter.ai/api/v1" },
  });

  const response = await model.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: formatDiff(files) },
  ]);

  return response.content as string;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  console.assert(apiKey, "OPENROUTER_API_KEY não está definida");

  const sampleDiff: PullRequestFile[] = [
    {
      filename: "src/sum.ts",
      status: "modified",
      additions: 3,
      deletions: 1,
      patch: "@@ -1,1 +1,3 @@\n-export const sum = (a, b) => a + b\n+export const sum = (a: any, b: any) => {\n+  return a + b\n+}",
    },
  ];

  const review = await reviewDiff(sampleDiff, apiKey!);
  console.log(review);
}
