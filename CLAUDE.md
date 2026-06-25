# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este projeto

Projeto de portfólio ainda não iniciado (pasta vazia). Será um **bot de PR review com IA**: uma GitHub Action que, ao abrir/atualizar um Pull Request, busca o diff via API do GitHub, envia para um LLM e posta um comentário de review resumido de volta no PR. Combina IA (LangChain/OpenRouter) com automação de DevOps — peça central do portfólio do autor. Nome de repo planejado: `pr-review-bot`.

Este projeto faz parte de uma iniciativa maior de profissionalizar o GitHub do autor (ver plano em `~/.claude/plans/boa-noite-gostaria-de-vast-petal.md`). O bot deve ser construído **depois** que o baseline de padrões (templates de PR/issue, CI, CODEOWNERS) já tiver sido validado em outro repo — ver Fase 1 desse plano.

## Restrições obrigatórias (não violar sem confirmar com o usuário)

- **Reaproveitar o padrão LangChain + OpenRouter já usado em `03-medical-appointment-template/src/config.ts`** (projeto vizinho no monorepo). Não introduzir um SDK de LLM diferente sem motivo.
- **v1 é stateless.** Sem banco de dados, sem persistência entre execuções.
- **v1 posta UM comentário de review resumido por execução**, não comentários inline por linha — mapear diff→posição de linha é complexidade real, fica para uma v2 se um dia fizer sentido.
- **Buscar o diff via API do GitHub (Octokit)**, nunca clonar o repositório completo.
- **Segredos nunca hardcoded nem logados.** `GITHUB_TOKEN` vem automaticamente da Action; `OPENROUTER_API_KEY` é um GitHub Actions secret.
- O workflow precisa declarar `permissions: pull-requests: write` explicitamente — o token da Action é read-only por padrão desde 2023.
- **Trigger apenas em `pull_request` (`opened`, `synchronize`).** Sem execução agendada, sem suporte a múltiplos repositórios/dashboard, sem UI de configuração — é um MVP de portfólio, não um produto.

## Estrutura planejada

```
action.yml              # metadata da Action (runs: node24, main: src/index.ts ou dist/ se bundlar)
src/index.ts             # entrypoint: lê GITHUB_TOKEN/evento, orquestra github.ts + review.ts
src/github.ts            # Octokit: busca diff do PR, posta o comentário de review
src/review.ts            # chain LangChain: diff -> LLM (OpenRouter) -> texto de review
tests/review.unit.test.ts
.github/workflows/ci.yml
```

## Comandos

Ainda não definidos — `package.json` será criado na Fase 0. Convenção provável, por consistência com `03-medical-appointment-template` (mesmo autor, mesma stack Node/TS): runner de teste nativo (`node --test`), sem Jest/Vitest. Atualizar esta seção assim que os scripts forem decididos.

## Forma de trabalho

O bot é construído **fase por fase**, cada uma testável isoladamente antes de avançar para a próxima:

- [ ] **Fase 0** — Setup (`package.json`, `tsconfig.json`, scaffold mínimo)
- [ ] **Fase 1** — `github.ts`: cliente Octokit, busca o diff de um PR real (testável via script standalone, antes de virar Action)
- [ ] **Fase 2** — `review.ts`: chain LangChain + OpenRouter, diff fixo de teste → texto de review
- [ ] **Fase 3** — `index.ts` + `action.yml`: entrypoint completo, rodando como Action (local via `act` ou em um PR de teste real)
- [ ] **Fase 4** — CI do próprio bot (lint/typecheck/test/build)
- [ ] **Fase 5** — testes unitários de `review.ts`
- [ ] **Fase 6** — `gh repo create` + push + tag `v1`
- [ ] **Fase 7** — dogfooding: referenciar a Action (`uses: junior10soares/pr-review-bot@v1`) nos outros repos do plano mestre

Ao terminar uma fase, descrever como testá-la manualmente (que comando rodar, que PR/diff usar, o que observar no resultado). Não pular fases nem implementar várias de uma vez sem validação.
