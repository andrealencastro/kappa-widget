
# Kappa Widget (MVP) — κ-only

Training wheels for intraduzibility awareness. Local-only. No logs. Three modes:
- **Descoberta**: mostra κ ao passar o mouse.
- **Confiança**: mostra κ apenas quando acima do limiar.
- **Poético**: discretiza κ (baixa névoa / névoa / bruma).

## Instalação (Chrome/Brave/Edge - Manifest V3)
1. Clone este repositório, ou baixe-o em **Code → Download ZIP** e descompacte.
2. Acesse `chrome://extensions` → ative **Developer mode**.
3. `Load unpacked` / `Carregar sem empacotar` → selecione a pasta do repositório (a que contém `manifest.json`).
4. Abra qualquer página de texto e use o painel flutuante para alternar modos.

## Estrutura
- `manifest.json` — manifesto da extensão (Manifest V3).
- `content.js` — heurística de κ, painel flutuante e anotação da página.
- `styles.css` — estilos do painel e dos selos.

## Privacidade
- Processamento **100% local** (content script). Nenhum dado é enviado.
- Sem armazenamento: nada persiste entre páginas/tabs.
- A extensão pede acesso a todas as páginas (`<all_urls>`) porque precisa ler o texto de qualquer página para anotá-lo. Não faz nenhuma requisição de rede.

## Como funciona (alto nível)
Heurística leve por sentença:
- **raridade lexical** (fora de um vocabulário básico EN/PT + palavras longas),
- **idioms** (lista pequena),
- **marcadores de metáfora** (similes simples),
- **gap de entidades** (Capitais no meio da sentença).
Combinação ponderada → `κ ∈ [0,1]`. **Não é verdade** sobre “intraduzibilidade real”; é *sinal pedagógico*.

## Métrica de sucesso (Claude)
> “O dia em que ninguém mais precisar olhar para κ.”
No MVP: os usuários **param de olhar para κ após 3 dias** (treinamento concluído).

## Limitações
- Estimativa grosseira, sem contexto cultural/individual.
- Apenas texto renderizado (ignora imagens/PDF incorporados).
- Não substitui julgamento humano.

## Licença
MIT (use, modifique, forke). Ver `LICENSE`.

