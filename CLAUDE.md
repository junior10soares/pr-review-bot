# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este projeto

`pr-review-bot`: uma GitHub Action que, ao abrir/atualizar um Pull Request, busca o diff via API do GitHub, envia para um LLM e posta um comentário de review resumido de volta no PR. Combina IA (LangChain/OpenRouter) com automação de DevOps — peça central do portfólio do autor. Repo público: https://github.com/junior10soares/pr-review-bot

Este projeto faz parte de uma iniciativa maior de profissionalizar o GitHub do autor (ver plano em `~/.claude/plans/boa-noite-gostaria-de-vast-petal.md`).

## Comandos

```bash
npm run lint        # eslint .
npm run typecheck   # tsc --noEmit
npm test            # node --test tests/**/*.test.ts
npm run build       # bundle src/index.ts -> dist/index.js (esbuild)
```

Self-checks manuais (chamam APIs reais, não fazem parte do bundle nem dos testes automatizados):

```bash
node scripts/check-github.ts <owner> <repo> <pull_number>   # busca diff real de um PR
node --env-file .env scripts/check-review.ts                 # gera review real via OpenRouter (requer OPENROUTER_API_KEY)
```

## Restrições obrigatórias (não violar sem confirmar com o usuário)

- **v1 é stateless.** Sem banco de dados, sem persistência entre execuções.
- **v1 posta UM comentário de review resumido por execução**, não comentários inline por linha — mapear diff→posição de linha é complexidade real, fica para uma v2 se um dia fizer sentido.
- **Buscar o diff via API do GitHub (Octokit)**, nunca clonar o repositório completo.
- **Segredos nunca hardcoded nem logados.** `GITHUB_TOKEN` vem automaticamente da Action; `OPENROUTER_API_KEY` é um GitHub Actions secret, passado como input (`reviewDiff` recebe a key por parâmetro, nunca lê `process.env` direto).
- O workflow consumidor precisa declarar `permissions: pull-requests: write` explicitamente — o token da Action é read-only por padrão desde 2023.
- **Trigger apenas em `pull_request` (`opened`, `synchronize`).** Sem execução agendada, sem suporte a múltiplos repositórios/dashboard, sem UI de configuração — é um MVP de portfólio, não um produto.

## Arquitetura

```
action.yml              # metadata da Action (runs: node24, main: dist/index.js)
src/index.ts             # entrypoint: lê contexto/inputs via @actions/core + @actions/github, orquestra
src/github.ts            # Octokit: busca diff do PR, posta o review (GitHubClient = tipo estrutural, aceita @octokit/rest OU @actions/github.getOctokit())
src/review.ts            # chain LangChain: diff -> LLM (OpenRouter) -> texto de review
scripts/                  # self-checks manuais (NUNCA importados por src/index.ts — ver "armadilha do bundle" abaixo)
tests/review.unit.test.ts
.github/workflows/ci.yml
dist/index.js             # bundle commitado (NÃO está no .gitignore — é o artefato que a Action de fato executa)
```

### Por que tem um `dist/index.js` commitado

`action.yml` usa `runs.using: node24` e roda `node <main>` direto, sem `npm install` — então o `main` da Action precisa ser autossuficiente (sem depender de `node_modules`, que é gitignored). Por isso `src/index.ts` é bundlado com `esbuild` (formato ESM, com um banner `createRequire` pra resolver módulos nativos do Node corretamente dentro do bundle) e o resultado é commitado. **Sempre que mudar algo em `src/`, rode `npm run build` e commite o `dist/` atualizado** — a CI falha (`git diff --exit-code dist/`) se esquecer.

### Armadilha do bundle (não reintroduzir)

`src/github.ts` e `src/review.ts` já tiveram um bloco `if (process.argv[1] === fileURLToPath(import.meta.url))` pra servir de self-check standalone. Isso quebrou o bundle: depois que `esbuild` junta tudo em um arquivo só, `import.meta.url` de **todos** os módulos bundlados aponta pro mesmo `dist/index.js`, então todos os guards disparavam ao mesmo tempo e o primeiro (`github.ts`) chamava `process.exit(1)` antes do entrypoint real rodar. Por isso os self-checks viraram scripts separados em `scripts/`, que `src/index.ts` nunca importa — mantenha essa separação.

## Forma de trabalho

Histórico de fases (commits no repo, todas concluídas):

- [x] **Fase 0** — Setup (`package.json`, `tsconfig.json`)
- [x] **Fase 1** — `github.ts`: busca o diff de um PR real
- [x] **Fase 2** — `review.ts`: chain LangChain + OpenRouter
- [x] **Fase 3** — `index.ts` + `action.yml`: entrypoint completo
- [x] **Fase 4** — CI (lint, typecheck, test)
- [x] **Fase 5** — testes unitários de `review.ts` (model injetável, sem chamar API real)
- [x] **Fase 6** — LICENSE, README, `gh repo create` + push, branch protection, tag `v1`, correção do bundle (`esbuild` + `dist/index.js` commitado)
- [ ] **Fase 7** — dogfooding: referenciar a Action (`uses: junior10soares/pr-review-bot@v1`) em outros repos

Mudanças futuras: ao terminar algo testável, descreva como testá-lo manualmente antes de seguir.
