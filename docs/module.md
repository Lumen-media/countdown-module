# Countdown Module — Especificação Funcional Completa

---

## 1. Visão Geral

Módulo de contagem regressiva para o Lumen, usado para gerenciamento de tempo em eventos ao vivo, cultos, produções e transições cronometradas.

**ID do módulo:** `com.example.countdown-module`
**Versão atual:** 0.9.0
**Framework:** React 19 + Zustand + TypeScript
**Animação:** animejs
**Estilos:** Tailwind CSS 4 + tw-animate-css

---

## 2. Arquitetura

### 2.1 Camadas

```
main.ts (ponto de entrada / registro no host)
  └─ store.ts (engine do timer, estado global, ações)
       └─ components/
            ├─ CountdownDialog.tsx (dialog principal)
            ├─ CountdownHeaderStatus.tsx (pill no header)
            ├─ left/
            │  ├─ PanelFooter.tsx (rodapé com controles)
            │  ├─ TimerSettings.tsx (popover de configurações)
            │  └─ tabs/
            │      ├─ ConfigureTab.tsx
            │      ├─ AppearanceTab.tsx
            │      └─ ActionsTab.tsx
            ├─ right/
            │  └─ RightPanel.tsx (live preview)
            └─ presenter/
               └─ CountdownDisplay.tsx (saída presenter/overlay)
```

### 2.2 Gerenciamento de Estado (Zustand)

O store centraliza:

- `config` — configuração completa do timer (duração, aparência, ações, comportamento)
- `timerState` — estado runtime (status, segundos restantes, triggers disparados)
- `timerPresets` — presets salvos pelo usuário
- Referências para APIs do host (presenter, overlay, queue, player, bus, etc.)

Toda mutação de estado passa por `set()` do Zustand, garantindo reatividade nos componentes React.

### 2.3 Integrações com o Host

| API do Host | Uso |
|---|---|
| `host.bus` | Emissão de eventos cross-module |
| `host.panels` | Registro dos componentes (dialog, presenter, header) |
| `host.presentation` | Projeção no presenter/media output |
| `host.overlay` | Projeção no overlay window |
| `host.queue` | Controle da fila de reprodução |
| `host.player` | Controle do player (slides, mídia) |
| `host.commands` | Comando "Open Countdown Timer" |
| `host.menus` | Item no menu Tools |
| `host.ui.openDialog` | Abertura do dialog |
| `host.ui.openBackgroundPicker` | Seletor de fundo customizado |
| `host.data.json` | Persistência de config e presets |
| `host.app.locale` | Internacionalização (en / pt-BR) |
| `host.fonts` | Listagem de fontes do sistema |
| `host.commands` | Registro de comandos no Commander |

---

## 3. Engine do Timer

### 3.1 Precisão

O timer usa `animejs` com animação linear baseada em tempo decorrido, não em intervalos acumulados. Isso garante precisão mesmo com eventuais drifts.

### 3.2 Re-sincronização por Aceleração

Quando o drift acumulado ultrapassa um limiar, a frequência de ticks é temporariamente aumentada para recuperar o tempo perdido, mantendo a exibição sincronizada com o tempo real.

### 3.3 Máquina de Estados

```
idle ──(start)──> running ──(pause)──> paused ──(start)──> running
  ^                                      │
  └──────────(reset)─────────────────────┘
  ^
  └──────────(finished)──────────────────┘
```

### 3.4 Count Up

Quando `countUp` está ativo:
- O timer inicia em 0 e incrementa até `totalSeconds`
- Não permite `allowNegative` simultaneamente (mutuamente exclusivos)
- Triggers disparam quando `remaining >= trigger.atSeconds` (inverso do countdown)

### 3.5 Tempo Negativo

Quando `allowNegative` está ativo:
- O timer continua além do zero, contando valores negativos
- Útil para medir "estouro" de tempo
- O valor mínimo é `-totalSeconds` (simétrico ao positivo)

---

## 4. Features por Categoria

### 4.1 Configuração do Timer

| Feature | Descrição |
|---|---|
| Duração MM:SS | Inputs numéricos para minutos (0-99) e segundos (0-59) |
| Ajustes rápidos | Botões +10s, -10s, Reset |
| Presets rápidos | Botões 5, 10, 15, 30 minutos |
| Pre text | Texto exibido acima do timer |
| Post text | Texto em carrossel (cada linha = 10s) exibido abaixo |
| Background preset | Default, Dark Minimal, Light Clean, Custom |
| Ao finalizar | Atalho: None ou Auto-switch para próxima cena |

### 4.2 Aparência

| Feature | Descrição |
|---|---|
| Fonte | Combobox com busca (fontes do sistema) |
| Peso da fonte | Thin a Black |
| Tamanho | Input numérico em px |
| Cor do timer | Color picker manual |
| Cor do pre/post text | Color picker manual |
| Opacidade pre/post | Slider 0-100% |
| Background | Sólido (color picker) ou Gradiente (2 cores + ângulo) |
| Glow | Intensidade do brilho atrás do texto (slider 0-100%) |
| Animação de dígitos | None, Flip, Blur |
| Efeito pulsar | Toggle on/off |
| Barra de progresso | Toggle + color picker |
| Modo de exibição | Fullscreen ou Corner (com posição: TL/TR/BL/BR) |

### 4.3 Ações e Comportamento

| Feature | Descrição |
|---|---|
| Auto-advance | Dispara ação ao finalizar (toggle + seletor de ação) |
| End actions | queue.next, queue.previous, player.next-slide, player.play, change-scene, open-overlay, send-webhook |
| Time triggers | Lista de triggers com reordenação, duplicação, deleção |
| Tipos de trigger | change-text, warning-chime, queue.next, queue.previous, player.next-slide, player.play, send-webhook |
| Completion sound | Áudio interno (bundled) tocado antes do fim |
| Trigger sounds | Bundled ou da biblioteca Lumen |
| Hide on completion | Oculta automaticamente o presenter/overlay |
| Count up | Contagem progressiva (0 → N) |
| Allow negative | Continua contando além do zero (valores negativos) |
| Webhook URL | URL para POST de eventos HTTP |

### 4.4 Timer Presets

- Salvar configuração atual com nome personalizado
- Carregar preset salvo
- Excluir preset
- Lista com ScrollArea (máx. 5 itens visíveis)
- Persistido via `host.data.json`

### 4.5 Hotkeys

| Ação | Padrão |
|---|---|
| Start / Resume | Ctrl+Enter |
| Pause | Ctrl+P |
| Reset | Ctrl+Backspace |
| +10s | Ctrl+= |
| -10s | Ctrl+- |

Customizáveis no popover de configurações (gear icon). O usuário pressiona a tecla desejada para gravar.

---

## 5. Sistema de Eventos

O módulo possui três camadas de eventos:

### 5.1 Tauri IPC (`@tauri-apps/api/event`)

Comunicação entre janela principal e presenter/overlay dentro do mesmo processo Lumen.

| Evento | Sentido | Propósito |
|---|---|---|
| `countdown:tick` | main → presenter | Sincroniza estado do timer na saída |
| `countdown:display-ready` | presenter → main | Notifica que o display montou |

### 5.2 Cross-module Bus (`host.bus`)

Eventos públicos para outros módulos consumirem.

| Topic | Payload | Quando |
|---|---|---|
| `countdown-module:timer.started` | `{ remaining, total, countUp, preText, postText }` | Timer inicia ou retoma |
| `countdown-module:timer.tick` | `{ remaining, total, countUp }` | A cada segundo exibido |
| `countdown-module:timer.trigger` | `{ atSeconds, triggerType, remaining }` | Um trigger de tempo dispara |
| `countdown-module:timer.paused` | `{ remaining }` | Timer é pausado |
| `countdown-module:timer.finished` | `{ remaining, total, countUp }` | Timer chega a zero (ou máximo no count-up) |
| `countdown-module:timer.reset` | `{ remaining, total }` | Timer é resetado manualmente |

Uso em outros módulos:
```ts
const d = host.bus.on("countdown-module:timer.finished", (p) => {
  console.log("Timer finished!", p)
})
// d.dispose() para cancelar
```

### 5.3 Webhook (HTTP POST)

Envia eventos para uma URL externa configurada pelo usuário.

| Evento | Payload |
|---|---|
| `timer.started` | `{ event, remaining, total, countUp, preText, postText }` |
| `timer.tick` | `{ event, remaining, total, countUp }` |
| `timer.trigger` | `{ event, atSeconds, triggerType, remaining }` |
| `timer.paused` | `{ event, remaining }` |
| `timer.finished` | `{ event, remaining, total, countUp }` |
| `timer.reset` | `{ event, remaining, total }` |

---

## 6. Saídas

### 6.1 Presenter Output

- Registrado no slot `presenter.content`
- Exibe o timer em tela cheia ou modo canto
- Renderiza fundo configurado (profile, sólido, gradiente, imagem, vídeo)
- Sincronizado via Tauri events (`countdown:tick`)

### 6.2 Overlay Window

- Janela independente que pode ser aberta separadamente do presenter
- Compartilha o mesmo componente de renderização (`CountdownDisplay`)
- Gerenciado via `host.overlay.project()`

### 6.3 Corner Mode

- Quando há mídia ou letra ativa no Lumen, o timer move para o canto selecionado
- Posições: top-left, top-right, bottom-left, bottom-right
- Se não houver backdrop ativo, permanece centralizado com fundo configurado

### 6.4 Live Preview (Right Panel)

- Painel direito no dialog principal
- Mostra preview ao vivo da estilização
- Exibe cartão de "Saída atual" e "Próxima ação"
- Não substitui o comportamento runtime do presenter/overlay

---

## 7. Persistência

Dados salvos automaticamente via `host.data.json` (com debounce de 800ms):

- `config` — configuração completa do timer
- `timerPresets` — lista de presets salvos pelo usuário

O estado runtime (`timerState`) **não** é persistido — não há timer sempre-ativo entre sessões.

---

## 8. Queue Integration

O módulo registra um trigger provider na fila do Lumen:

```
ID: countdown.wait
Label: "Aguardar (Contagem)"
```

Quando um item da fila usa este trigger:
1. A duração configurada no trigger é aplicada ao timer
2. Auto-advance é ativado com ação `queue.next`
3. O timer inicia automaticamente

---

## 9. Internacionalização

Idiomas suportados:

| Idioma | Arquivo |
|---|---|
| Inglês | `src/i18n/en.ts` |
| Português (Brasil) | `src/i18n/pt-BR.ts` |

A detecção é feita via `host.app.locale` no momento do `onload`.

---

## 10. Commander

O módulo registra comandos no Commander do Lumen para acesso rápido sem abrir o dialog.

### 10.1 Ações Diretas

| Comando | Descrição |
|---|---|
| `Countdown: Start` | Inicia ou retoma o timer |
| `Countdown: Pause / Resume` | Pausa se rodando, retoma se pausado |
| `Countdown: Reset` | Reseta o timer para o estado inicial |
| `Open Countdown Timer` | Abre o dialog completo de configuração |

### 10.2 App do Commander

O comando `Countdown: Controls` (`type: "app"`) abre uma interface compacta dentro do próprio Commander com:

- **Presets rápidos**: botões para 5, 10, 15, 30 minutos
- **Controles**: Start, Pause/Resume, Reset
- **Fechar**: botão para voltar

Cada preset define a duração do timer (substitui a config atual). Os controles agem imediatamente no timer em execução.

---

## 11. Estrutura de Arquivos

```
src/
├── main.ts                        # Ponto de entrada, registro no host
├── store.ts                       # Engine do timer, estado, ações
├── types.ts                       # Tipos TypeScript completos
├── styles.css                     # Estilos globais do módulo
├── i18n.ts                        # Setup de internacionalização
├── i18n/
│   ├── en.ts                      # Traduções inglês
│   └── pt-BR.ts                   # Traduções português
├── lib/
│   ├── cn.ts                      # Utilitário cn (clsx + tailwind-merge)
│   ├── display-mode.ts            # Lógica de modo canto vs tela cheia
│   └── sounds.ts                  # Gerenciamento de áudios bundled/library
├── components/
│   ├── CountdownCommanderApp.tsx  # App do Commander (presets + controles)
│   ├── CountdownDialog.tsx        # Dialog principal (layout esquerda/direita)
│   ├── CountdownHeaderStatus.tsx  # Pill no header do Lumen
│   ├── CircularProgress.tsx       # Componente de barra circular
│   ├── DigitDisplay.tsx           # Display de dígitos com animação
│   ├── TextCarousel.tsx           # Carrossel de texto pós-timer
│   ├── QueueTriggerConfig.tsx     # Configurador de trigger de fila
│   ├── left/
│   │   ├── PanelFooter.tsx        # Rodapé com controles (start/pause/reset)
│   │   ├── TimerSettings.tsx      # Popover de config (presets, webhook, hotkeys)
│   │   └── tabs/
│   │       ├── ConfigureTab.tsx   # Aba de configuração do timer
│   │       ├── AppearanceTab.tsx  # Aba de aparência
│   │       └── ActionsTab.tsx     # Aba de ações e comportamento
│   ├── right/
│   │   └── RightPanel.tsx         # Painel de preview ao vivo
│   └── presenter/
│       └── CountdownDisplay.tsx   # Renderização do timer (presenter/overlay)
docs/
├── spec.md                        # Especificação de funcionalidades
├── plan.md                        # Planejamento e WIP ideas
└── module.md                      # Este documento
```

---

## 11. Considerações Técnicas

### 11.1 Dependências Principais

| Pacote | Versão | Propósito |
|---|---|---|
| react / react-dom | ^19.0.0 | UI framework |
| zustand | ^5.0.14 | Gerenciamento de estado |
| animejs | ^4.4.1 | Animações do timer |
| @lumen-media/module-sdk | ^0.9.0 | SDK de integração com Lumen |
| @tauri-apps/api | ^2.11.0 | Tauri IPC events |
| tailwindcss | ^4.3.0 | Estilização |
| lucide-react | ^1.17.0 | Ícones |
| clsx + tailwind-merge | — | Utilitários de classe |
| polished | ^4.3.1 | Manipulação de cores |
| react-colorful | ^5.7.0 | Color pickers |
| usehooks-ts | ^3.1.1 | Hooks utilitários |

### 11.2 Scripts

| Comando | Descrição |
|---|---|
| `pnpm dev` | Build em watch mode |
| `pnpm build` | Build via Lumen CLI |
| `pnpm pack` | Build + empacotamento |
| `pnpm validate` | Validação do módulo |

### 11.3 Estados e Transições

O timer dispara áudio de conclusão segundos antes de finalizar (configurável por `COMPLETION_SOUND_SAFETY_SECONDS = 1`). O áudio é pausado/retomado junto com o timer, e cancelado no reset.

Triggers podem ser reorganizados por drag (ou botões de move up/down). Ao duplicar um trigger, todos os seus parâmetros são copiados. O tempo padrão de um novo trigger é metade da duração configurada.
