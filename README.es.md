# Módulo de Cuenta Regresiva Lumen

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Lumen API](https://img.shields.io/badge/Lumen_API-%5E0.1.0-blue.svg)](https://lumen.media)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange.svg)](https://pnpm.io/)

**ID del módulo:** `com.example.countdown-module` &nbsp;|&nbsp; **Versión:** 1.3.1 &nbsp;|&nbsp; **API Lumen:** ^0.1.0 &nbsp;|&nbsp; **Licencia:** MIT

Módulo de cuenta regresiva para Lumen con salida a presentador/superposición, vista previa de estilo en vivo, disparadores de tiempo, audio incluido y de biblioteca, integración con la cola, modos de esquina y pantalla completa, preajustes de temporizador y controles rápidos de Commander.

## Resumen

El **Módulo de Cuenta Regresiva Lumen** es una solución de temporizador completa, diseñada para producciones en vivo, servicios religiosos, eventos y flujos de transmisión. Se integra profundamente con la plataforma Lumen para ofrecer:

### Capacidades principales

- **Motor de Temporizador de Precisión** — Construido sobre `animejs` con animación corregida por deriva, compatible con modos de cuenta regresiva, cuenta progresiva y exceso negativo
- **Salida Dual** — Renderiza en el presentador (pantalla completa o superposición en esquina sobre medios/letras) y/o en una ventana de superposición dedicada simultáneamente
- **Vista Previa de Estilo en Vivo** — Vista previa en tiempo real en el diálogo de configuración que muestra exactamente cómo se verá el temporizador en la salida
- **Disparadores de Tiempo** — Configura acciones en marcas de tiempo específicas: cambiar texto, reproducir sonidos, avanzar la cola, activar diapositivas, enviar webhooks
- **Sistema de Audio** — Sonidos de finalización/advertencia incluidos, además de integración con la biblioteca multimedia de Lumen para audio personalizado
- **Integración con la Cola** — Se registra como proveedor de disparador `countdown.wait` para el control automatizado del flujo del programa
- **Controles Rápidos de Commander** — Inicia preajustes y controla el temporizador directamente desde la paleta Commander de Lumen
- **Persistencia** — Guarda automáticamente la configuración y los preajustes de usuario entre sesiones mediante el almacén de datos de Lumen
- **Internacionalización** — Inglés y portugués (pt-BR) con detección de configuración regional

### Casos de uso

| Escenario | Funciones utilizadas |
|---|---|
| Transiciones de servicios religiosos | Cuenta regresiva, modo de esquina sobre letras, avance automático de cola, sonido de finalización |
| Temporización de segmentos de eventos en vivo | Modo de cuenta progresiva, disparadores de tiempo para advertencias, ventana de superposición para el escenario |
| Pausas comerciales de transmisión | Seguimiento de exceso negativo, integración con webhook, presentador a pantalla completa |
| Gestión de sesiones de conferencias | Preajustes de temporizador, atajos rápidos, píldora de estado en encabezado, disparadores de cola |

## Qué hace

- Se abre desde el menú Herramientas o desde Commander
- Renderiza una cuenta regresiva configurable en `presenter.content`
- Compatible con salida al presentador o una ventana de superposición dedicada
- Expone un control compacto de estado en ejecución en el encabezado de la aplicación
- Guarda la configuración del módulo y los preajustes de temporizador entre sesiones

## Capturas de pantalla

<!-- TODO: agregar capturas de pantalla reales -->
| Pestaña Configurar | Pestaña Apariencia | Pestaña Acciones |
|---|---|---|
| <img width="321" height="789" alt="image" src="https://github.com/user-attachments/assets/992215b0-7c74-4860-8353-d763f41185c7" /> | <img width="316" height="787" alt="image" src="https://github.com/user-attachments/assets/d34d4e8f-46a9-4307-a6c9-b37e3e7a3c45" /> | <img width="317" height="789" alt="image" src="https://github.com/user-attachments/assets/dca5a985-df1f-4f27-b958-bb0059b577de" /> |

<img width="1322" height="830" alt="image" src="https://github.com/user-attachments/assets/322ce122-56bc-4d37-a535-d94cb8a34dc2" />

## Conjunto de funciones

### Configurar
- Campos de minutos y segundos
- Ajustes rápidos: `+10s`, `-10s`, `Restablecer`
- Preajustes rápidos de duración: `5`, `10`, `15`, `30` minutos
- Texto previo y posterior (valores predeterminados traducidos por configuración regional)
- Preajustes de temporizador: guardar, cargar, eliminar configuraciones nombradas
- Grabación de atajos para iniciar, pausar, restablecer, +10s, -10s
- Preajustes de fondo:
  - `Predeterminado` (fondo del perfil)
  - `Mínimo Oscuro`
  - `Limpio Claro`
  - `Personalizado`

### Apariencia
- Selección de fuente local/del sistema
- Peso y tamaño de fuente
- Colores del temporizador y del texto previo/posterior
- Opacidad del previo/posterior
- Edición de la capa de fondo para:
  - `Sólido`
  - `Degradado`
- Intensidad del brillo
- Animación de dígitos:
  - `Ninguna`
  - `Volteo` (estilo reloj de volteo CSS)
  - `Desenfoque`
- Efecto de pulso opcional (últimos 60s)
- Barra de progreso opcional + selector de color
- Modo de visualización:
  - `Pantalla completa`
  - `Esquina` (superpone medios/letras existentes)
  - Posición de la esquina: superior/inferior + izquierda/derecha

### Acciones y comportamiento
- Alternancia de avance automático con acción final configurable
- Disparadores de tiempo con habilitar/deshabilitar, reordenar, duplicar y eliminar
- Tipos de disparador:
  - `Cambiar texto`
  - `Reproducir sonido` (audio incluido o de biblioteca)
  - `Siguiente en cola`
  - `Anterior en cola`
  - `Siguiente diapositiva`
  - `Reproducir medio específico`
- Tipos de acción final:
  - `queue.next`
  - `queue.previous`
  - `player.next-slide`
  - `player.play`
  - `change-scene`
  - `open-overlay`
  - `send-webhook` (con carga útil personalizada opcional)
- Sonido de finalización desde audio incluido
- Audio de biblioteca opcional para disparadores de sonido
- Ocultar al finalizar (se desactiva automáticamente cuando el negativo está activo)
- Permitir tiempo negativo (exceso; mutuamente excluyente con cuenta progresiva y ocultar al finalizar)
- Modo de cuenta progresiva (mutuamente excluyente con permitir negativo)
- URL de webhook para eventos del temporizador

### Ejecución / salida
- El motor del temporizador se ejecuta en una clase dedicada (`TimerEngine`) separada del almacén Zustand
- La visualización del presentador se sincroniza mediante eventos de Tauri con protección ErrorBoundary
- La ventana de superposición se puede abrir de forma independiente de la salida del presentador
- La ranura del encabezado muestra un estado compacto del temporizador en ejecución cuando la cuenta regresiva está activa
- El proveedor de disparador de cola se registra como `countdown.wait`

## Estructura del proyecto

```
src/
├── main.ts                          # Registro del módulo, conexión con el host, persistencia
├── store.ts                         # Estado de Zustand, configuración, conexión con la API
├── types.ts                         # Definiciones de tipos compartidos
├── i18n.ts                          # Auxiliar de traducción
├── i18n/
│   ├── en.ts                        # Traducciones al inglés
│   └── pt-BR.ts                     # Traducciones al portugués
├── lib/
│   ├── timer-engine.ts              # Motor del temporizador (animación, sonidos, eventos)
│   ├── format-time.ts               # Utilidad de formato de tiempo
│   ├── display-mode.ts              # Auxiliares de modo esquina/pantalla completa
│   ├── adaptive-text.ts             # Colores y sombras de texto adaptativos
│   ├── sounds.ts                    # Reproducción de audio, gestión de sonidos incluidos
│   └── utils.ts                     # Utilidad cn() (clsx + tailwind-merge)
├── hooks/
│   ├── useLocalFonts.ts             # Enumeración de fuentes del sistema
│   └── useContrastColor.ts          # Contraste de color legible
└── components/
    ├── CountdownDialog.tsx          # Carcasa del diálogo principal
    ├── CountdownHeaderStatus.tsx    # Indicador compacto del temporizador en el encabezado
    ├── CountdownCommanderApp.tsx    # Controles rápidos de Commander
    ├── DigitDisplay.tsx             # Transiciones animadas de dígitos
    ├── FlipClockDigit.tsx           # Componente de dígito reloj de volteo CSS
    ├── CircularProgress.tsx         # Anillo de progreso SVG
    ├── TextCarousel.tsx             # Carrusel de texto rotatorio
    ├── QueueTriggerConfig.tsx       # Configuración del disparador de espera de cola
    ├── presenter/
    │   ├── CountdownDisplay.tsx     # Renderizador de cuenta regresiva presentador/superposición
    │   └── ErrorBoundary.tsx        # Protección contra fallos del presentador
    ├── right/
    │   ├── RightPanel.tsx           # Panel de escenario de vista previa
    │   └── CountdownPreview.tsx     # Vista previa en vivo de la cuenta regresiva
    └── left/
        ├── PanelFooter.tsx          # Pie del diálogo (controles, proyección)
        ├── TimerSettings.tsx        # Preajustes, atajos, configuración de webhook
        └── tabs/
            ├── ConfigureTab.tsx     # Duración, texto, preajustes de fondo
            ├── AppearanceTab.tsx    # Fuente, colores, animaciones, modo de visualización
            └── ActionsTab.tsx       # Acciones finales, disparadores de tiempo, comportamiento
```

## Desarrollar

```bash
pnpm install
pnpm build
pnpm pack
pnpm validate
```

## Notas

- El módulo depende de las capacidades del host expuestas por Lumen para la salida al presentador, control de superposición, búsquedas en la biblioteca, acciones de cola y selección de fondos.
- La ventana del presentador no tiene Tailwind CSS disponible, por lo que `CountdownDisplay.tsx` y `FlipClockDigit.tsx` usan exclusivamente estilos en línea.
- La lógica del motor del temporizador (`start`, `pause`, `reset`, animación, sonidos, eventos) vive en `lib/timer-engine.ts`, separada del almacén Zustand.

## Inicio rápido

```bash
# Instalar dependencias
pnpm install

# Desarrollo (modo de observación)
pnpm dev

# Compilar para producción
pnpm build

# Crear .lumenpack para distribución
pnpm pack

# Validar manifiesto y paquete
pnpm validate
```

## Instalar en Lumen

1. Ejecuta `pnpm pack` para generar `com.example.countdown-module-X.Y.Z.lumenpack`
2. En Lumen: **Configuración → Módulos → Instalar módulo** → selecciona el archivo `.lumenpack`
3. Habilita el módulo y ábrelo en **Herramientas → Temporizador** o desde Commander (`Ctrl+Shift+P` → "Countdown: Controles")

## Licencia

MIT