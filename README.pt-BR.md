# Módulo de Contagem Regressiva Lumen

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Lumen API](https://img.shields.io/badge/Lumen_API-%5E0.1.0-blue.svg)](https://lumen.media)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange.svg)](https://pnpm.io/)

**ID do módulo:** `com.example.countdown-module` &nbsp;|&nbsp; **Versão:** 1.3.1 &nbsp;|&nbsp; **API Lumen:** ^0.1.0 &nbsp;|&nbsp; **Licença:** MIT

Módulo de contagem regressiva para Lumen com saída em apresentador/overlay, pré-visualização de estilo ao vivo, gatilhos de tempo, áudio integrado e da biblioteca, integração com a fila, modos de canto e tela cheia, predefinições de temporizador e controles rápidos via Commander.

## Visão Geral

O **Módulo de Contagem Regressiva Lumen** é uma solução completa de temporizador projetada para produções ao vivo, cultos, eventos e fluxos de transmissão. Ele se integra profundamente à plataforma Lumen para oferecer:

### Recursos Principais

- **Motor de Temporizador de Precisão** — Construído sobre `animejs` com animação corrigida por desvio, suportando modos de contagem regressiva, progressiva e de estouro negativo
- **Saída Dupla** — Renderiza no apresentador (tela cheia ou overlay de canto sobre mídia/letras) e/ou em uma janela de overlay dedicada simultaneamente
- **Pré-visualização de Estilo ao Vivo** — Pré-visualização em tempo real no diálogo de configuração mostrando exatamente como o temporizador ficará na saída
- **Gatilhos de Tempo** — Configure ações em marcas de tempo específicas: alterar texto, tocar sons, avançar a fila, disparar slides, enviar webhooks
- **Sistema de Áudio** — Sons de conclusão/aviso integrados, além de integração com a biblioteca de mídia do Lumen para áudio personalizado
- **Integração com a Fila** — Registra-se como provedor de gatilho `countdown.wait` para controle automatizado do fluxo do programa
- **Controles Rápidos no Commander** — Inicie predefinições e controle o temporizador diretamente pela paleta Commander do Lumen
- **Persistência** — Salva automaticamente a configuração e as predefinições do usuário entre sessões pelo armazenamento de dados do Lumen
- **Internacionalização** — Inglês e português (pt-BR) com detecção de locale

### Casos de Uso

| Cenário | Recursos Utilizados |
|---|---|
| Transições de culto | Contagem regressiva, modo de canto sobre letras, avanço automático da fila, som de conclusão |
| Tempo de segmentos de eventos ao vivo | Modo de contagem progressiva, gatilhos de tempo para avisos, janela de overlay para o palco |
| Intervalos comerciais em transmissões | Rastreamento de estouro negativo, integração com webhook, apresentador em tela cheia |
| Gestão de sessões de conferência | Predefinições de temporizador, atalhos rápidos, indicador de status no cabeçalho, gatilhos de fila |

## O que faz

- Abre a partir do menu Ferramentas ou pelo Commander
- Renderiza uma contagem regressiva configurável em `presenter.content`
- Suporta saída no apresentador ou em uma janela de overlay dedicada
- Expõe um controle compacto de status em execução no cabeçalho do aplicativo
- Salva a configuração do módulo e predefinições de temporizador entre sessões

## Capturas de Tela

<!-- TODO: adicionar capturas de tela reais -->
| Aba Configurar | Aba Aparência | Aba Ações |
|---|---|---|
| <img width="321" height="789" alt="image" src="https://github.com/user-attachments/assets/992215b0-7c74-4860-8353-d763f41185c7" /> | <img width="316" height="787" alt="image" src="https://github.com/user-attachments/assets/d34d4e8f-46a9-4307-a6c9-b37e3e7a3c45" /> | <img width="317" height="789" alt="image" src="https://github.com/user-attachments/assets/dca5a985-df1f-4f27-b958-bb0059b577de" /> |

<img width="1322" height="830" alt="image" src="https://github.com/user-attachments/assets/322ce122-56bc-4d37-a535-d94cb8a34dc2" />

## Conjunto de Recursos

### Configurar
- Campos de minutos e segundos
- Ajustes rápidos: `+10s`, `-10s`, `Reiniciar`
- Predefinições rápidas de duração: `5`, `10`, `15`, `30` minutos
- Texto pré e pós (padrões traduzidos por locale)
- Predefinições de temporizador: salvar, carregar, excluir configurações nomeadas
- Gravação de atalhos para iniciar, pausar, reiniciar, +10s, -10s
- Predefinições de fundo:
  - `Padrão` (fundo do perfil)
  - `Mínimo Escuro`
  - `Limpo Claro`
  - `Personalizado`

### Aparência
- Seleção de fonte local/de sistema
- Peso e tamanho da fonte
- Cores do temporizador e dos textos pré/pós
- Opacidade do pré/pós
- Edição da camada de fundo para:
  - `Sólido`
  - `Gradiente`
- Intensidade do brilho
- Animação dos dígitos:
  - `Nenhum`
  - `Flip` (estilo relógio de flip)
  - `Blur`
- Efeito de pulsação opcional (últimos 60s)
- Barra de progresso opcional + seletor de cor
- Modo de exibição:
  - `Tela Cheia`
  - `Canto` (sobrepõe mídia/letras existentes)
  - Posição do canto: superior/inferior + esquerdo/direito

### Ações e comportamento
- Alternância de avanço automático com ação final configurável
- Gatilhos de tempo com ativar/desativar, reordenar, duplicar e excluir
- Tipos de gatilho:
  - `Alterar Texto`
  - `Tocar Som` (áudio integrado ou da biblioteca)
  - `Avançar na Fila`
  - `Voltar na Fila`
  - `Próximo Slide`
  - `Reproduzir Mídia Específica`
- Tipos de ação final:
  - `queue.next`
  - `queue.previous`
  - `player.next-slide`
  - `player.play`
  - `change-scene`
  - `open-overlay`
  - `send-webhook` (com payload personalizado opcional)
- Som de conclusão a partir de áudio integrado
- Áudio da biblioteca opcional para gatilhos de som
- Ocultar ao concluir (desativado automaticamente quando o negativo está ativo)
- Permitir tempo negativo (estouro, mutuamente exclusivo com contagem progressiva e ocultar ao concluir)
- Modo de contagem progressiva (mutuamente exclusivo com permitir negativo)
- URL de webhook para eventos do temporizador

### Execução / saída
- O motor do temporizador roda em uma classe dedicada (`TimerEngine`) separada do store Zustand
- A exibição do apresentador é sincronizada por eventos Tauri com proteção ErrorBoundary
- A janela de overlay pode ser aberta independentemente da saída do apresentador
- O slot do cabeçalho mostra um status compacto do temporizador em execução quando a contagem regressiva está ativa
- O provedor de gatilho de fila é registrado como `countdown.wait`

## Estrutura do projeto

```
src/
├── main.ts                          # Registro do módulo, integração com o host, persistência
├── store.ts                         # Estado Zustand, configuração, integração com a API
├── types.ts                         # Definições de tipos compartilhados
├── i18n.ts                          # Auxiliar de tradução
├── i18n/
│   ├── en.ts                        # Traduções em inglês
│   └── pt-BR.ts                     # Traduções em português
├── lib/
│   ├── timer-engine.ts              # Motor do temporizador (animação, sons, eventos)
│   ├── format-time.ts               # Utilitário de formatação de tempo
│   ├── display-mode.ts              # Helpers de modo canto/tela cheia
│   ├── adaptive-text.ts             # Cores e sombras de texto adaptativas
│   ├── sounds.ts                    # Reprodução de áudio, gestão de sons integrados
│   └── utils.ts                     # Utilitário cn() (clsx + tailwind-merge)
├── hooks/
│   ├── useLocalFonts.ts             # Enumeração de fontes do sistema
│   └── useContrastColor.ts          # Contraste de cor legível
└── components/
    ├── CountdownDialog.tsx           # Casca do diálogo principal
    ├── CountdownHeaderStatus.tsx     # Indicador compacto do temporizador no cabeçalho
    ├── CountdownCommanderApp.tsx     # Controles rápidos do Commander
    ├── DigitDisplay.tsx              # Transições animadas de dígitos
    ├── FlipClockDigit.tsx            # Componente de dígito flip-clock CSS
    ├── CircularProgress.tsx          # Anel de progresso SVG
    ├── TextCarousel.tsx              # Carrossel de texto rotativo
    ├── QueueTriggerConfig.tsx        # Configuração do gatilho de espera da fila
    ├── presenter/
    │   ├── CountdownDisplay.tsx      # Renderizador de contagem regressiva apresentador/overlay
    │   └── ErrorBoundary.tsx         # Proteção contra falhas do apresentador
    ├── right/
    │   ├── RightPanel.tsx            # Painel de palco de pré-visualização
    │   └── CountdownPreview.tsx      # Pré-visualização ao vivo da contagem regressiva
    └── left/
        ├── PanelFooter.tsx           # Rodapé do diálogo (controles, projeção)
        ├── TimerSettings.tsx         # Predefinições, atalhos, configurações de webhook
        └── tabs/
            ├── ConfigureTab.tsx      # Duração, texto, predefinições de fundo
            ├── AppearanceTab.tsx     # Fonte, cores, animações, modo de exibição
            └── ActionsTab.tsx        # Ações finais, gatilhos de tempo, comportamento
```

## Desenvolver

```bash
pnpm install
pnpm build
pnpm pack
pnpm validate
```

## Notas

- O módulo depende de capacidades do host expostas pelo Lumen para saída no apresentador, controle de overlay, consultas à biblioteca, ações de fila e seleção de fundo.
- A janela do apresentador não tem Tailwind CSS disponível, então `CountdownDisplay.tsx` e `FlipClockDigit.tsx` usam exclusivamente estilos inline.
- A lógica do motor do temporizador (`start`, `pause`, `reset`, animação, sons, eventos) vive em `lib/timer-engine.ts`, separada do store Zustand.

## Início Rápido

```bash
# Instalar dependências
pnpm install

# Desenvolvimento (modo de observação)
pnpm dev

# Build para produção
pnpm build

# Criar .lumenpack para distribuição
pnpm pack

# Validar manifesto e pacote
pnpm validate
```

## Instalar no Lumen

1. Execute `pnpm pack` para gerar `com.example.countdown-module-X.Y.Z.lumenpack`
2. No Lumen: **Configurações → Módulos → Instalar Módulo** → selecione o arquivo `.lumenpack`
3. Ative o módulo e abra em **Ferramentas → Temporizador** ou pelo Commander (`Ctrl+Shift+P` → "Countdown: Controles")

## Licença

MIT