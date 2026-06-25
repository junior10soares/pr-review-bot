# pr-review-bot

![CI](https://github.com/junior10soares/pr-review-bot/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)

GitHub Action que revisa Pull Requests usando um LLM. Busca o diff do PR via API do GitHub, envia para um modelo via [OpenRouter](https://openrouter.ai) (LangChain) e posta um comentário de review resumido de volta no PR.

## Como funciona

1. Dispara em `pull_request` (`opened`, `synchronize`).
2. Busca os arquivos/diff do PR via Octokit (`src/github.ts`), sem clonar o repositório.
3. Gera um review em markdown via LangChain + OpenRouter (`src/review.ts`).
4. Posta o resultado como uma review no próprio PR.

v1 é stateless e posta um único comentário resumido (sem comentários inline por linha).

## Uso

```yaml
- uses: junior10soares/pr-review-bot@v1
  with:
    openrouter-api-key: ${{ secrets.OPENROUTER_API_KEY }}
```

`github-token` é opcional (usa `${{ github.token }}` por padrão). O workflow que consome esta Action precisa declarar:

```yaml
permissions:
  pull-requests: write
```

## Desenvolvimento local

```bash
npm install
npm run lint
npm run typecheck
npm test
```

Para testar a geração de review contra a API real:

```bash
node --env-file .env src/review.ts
```

(requer `OPENROUTER_API_KEY` em um `.env` local, não commitado)
