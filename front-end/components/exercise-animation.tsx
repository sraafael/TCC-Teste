/**
 * Arquivo: front-end/components/exercise-animation.tsx
 * Area: Front-end React (componentes)
 * Funcao: Renderiza animacoes SVG de exercicios para apoio visual dos treinos.
 * Onde fica: /front-end/components/exercise-animation.tsx
 */
"use client"

import { cn } from "@/lib/utils"

interface ExerciseAnimationProps {
  type: string
  className?: string
}

export function ExerciseAnimation({ type, className }: ExerciseAnimationProps) {
  return (
    // Container SVG principal: recebe "type" e delega desenho para Avatar3D.
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 200 200"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Body gradient - gives a 3D metallic look */}
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.78 0.19 145)" />
            <stop offset="50%" stopColor="oklch(0.65 0.17 145)" />
            <stop offset="100%" stopColor="oklch(0.52 0.14 145)" />
          </linearGradient>
          {/* Skin gradient */}
          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.82 0.06 70)" />
            <stop offset="100%" stopColor="oklch(0.72 0.06 55)" />
          </linearGradient>
          {/* Metal gradient for weights/bars */}
          <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.65 0.01 250)" />
            <stop offset="50%" stopColor="oklch(0.45 0.01 250)" />
            <stop offset="100%" stopColor="oklch(0.35 0.01 250)" />
          </linearGradient>
          {/* Weight plate gradient */}
          <linearGradient id="plateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.55 0.02 250)" />
            <stop offset="100%" stopColor="oklch(0.30 0.02 250)" />
          </linearGradient>
          {/* Equipment gradient */}
          <linearGradient id="equipGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.35 0.005 250)" />
            <stop offset="100%" stopColor="oklch(0.22 0.005 250)" />
          </linearGradient>
          {/* Subtle glow */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          {/* Shadow under figure */}
          <filter id="shadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="2" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Floor shadow */}
        <ellipse cx="100" cy="185" rx="50" ry="6" fill="oklch(0.20 0.005 250)" opacity="0.3" />
        <Avatar3D type={type} />
      </svg>
    </div>
  )
}

function Avatar3D({ type }: { type: string }) {
  // Renderizadores base (cabeca, tronco, membros, barra, anilhas, halteres).
  // Todos os exercicios do switch reaproveitam esses blocos para manter consistencia visual.
  const Head = ({ cx, cy, r = 12 }: { cx: number; cy: number; r?: number }) => (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="url(#skinGrad)" filter="url(#shadow)" />
      {/* Eyes */}
      <circle cx={cx - 3.5} cy={cy - 1} r="1.2" fill="oklch(0.25 0.01 250)" />
      <circle cx={cx + 3.5} cy={cy - 1} r="1.2" fill="oklch(0.25 0.01 250)" />
      {/* Hair */}
      <path d={`M${cx - r + 1},${cy - 3} Q${cx},${cy - r - 5} ${cx + r - 1},${cy - 3}`} fill="oklch(0.30 0.04 40)" stroke="none" />
    </g>
  )

  const Torso = ({ x1, y1, x2, y2, width = 16 }: { x1: number; y1: number; x2: number; y2: number; width?: number }) => (
    <g>
      <rect
        x={x1 - width / 2}
        y={y1}
        width={width}
        height={y2 - y1}
        rx={width / 3}
        fill="url(#bodyGrad)"
        filter="url(#shadow)"
      />
    </g>
  )

  const Limb = ({ x1, y1, x2, y2, width = 5, animate: anim }: {
    x1: number; y1: number; x2: number; y2: number; width?: number;
    animate?: { attr: string; values: string; dur: string; begin?: string }[]
  }) => (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="url(#skinGrad)"
      strokeWidth={width}
      strokeLinecap="round"
      filter="url(#shadow)"
    >
      {anim?.map((a, i) => (
        <animate key={i} attributeName={a.attr} values={a.values} dur={a.dur} begin={a.begin || "0s"} repeatCount="indefinite" />
      ))}
    </line>
  )

  const Bar = ({ x1, y1, x2, y2, animate: anim }: {
    x1: number; y1: number; x2: number; y2: number;
    animate?: { attr: string; values: string; dur: string }[]
  }) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#metalGrad)" strokeWidth="5" strokeLinecap="round" filter="url(#shadow)">
      {anim?.map((a, i) => (
        <animate key={i} attributeName={a.attr} values={a.values} dur={a.dur} repeatCount="indefinite" />
      ))}
    </line>
  )

  const Plate = ({ x, y, w = 10, h = 16, animate: anim }: {
    x: number; y: number; w?: number; h?: number;
    animate?: { attr: string; values: string; dur: string }[]
  }) => (
    <rect x={x} y={y} width={w} height={h} rx={2} fill="url(#plateGrad)" filter="url(#shadow)">
      {anim?.map((a, i) => (
        <animate key={i} attributeName={a.attr} values={a.values} dur={a.dur} repeatCount="indefinite" />
      ))}
    </rect>
  )

  const Dumbbell = ({ cx, cy, animate: anim }: {
    cx: number; cy: number;
    animate?: { attr: string; values: string; dur: string; begin?: string }[]
  }) => (
    <g>
      <rect x={cx - 4} y={cy - 3} width={8} height={6} rx={1.5} fill="url(#metalGrad)" filter="url(#shadow)">
        {anim?.filter(a => a.attr === "x" || a.attr === "y").map((a, i) => (
          <animate key={i} attributeName={a.attr} values={a.values} dur={a.dur} begin={a.begin || "0s"} repeatCount="indefinite" />
        ))}
      </rect>
      <circle cx={cx - 6} cy={cy} r={5} fill="url(#plateGrad)" filter="url(#shadow)">
        {anim?.filter(a => a.attr === "cx" || a.attr === "cy").map((a, i) => (
          <animate key={i} attributeName={a.attr} values={a.values} dur={a.dur} begin={a.begin || "0s"} repeatCount="indefinite" />
        ))}
      </circle>
      <circle cx={cx + 6} cy={cy} r={5} fill="url(#plateGrad)" filter="url(#shadow)">
        {anim?.filter(a => a.attr === "cx" || a.attr === "cy").map((a, i) => (
          <animate key={i} attributeName={a.attr} values={a.values} dur={a.dur} begin={a.begin || "0s"} repeatCount="indefinite" />
        ))}
      </circle>
    </g>
  )

  // Cada case retorna uma animacao diferente conforme o tipo de exercicio recebido.
  switch (type) {
    case "bench-press":
    case "incline-press":
      return (
        <g>
          {/* Bench */}
          <rect x="40" y="120" width="120" height="10" rx="5" fill="url(#equipGrad)" />
          <rect x="50" y="130" width="8" height="30" rx="3" fill="url(#equipGrad)" />
          <rect x="142" y="130" width="8" height="30" rx="3" fill="url(#equipGrad)" />
          {/* Body lying */}
          <Torso x1={100} y1={105} x2={100} y2={120} width={18} />
          {/* Head */}
          <g>
            <circle cx={75} cy={110} r={10} fill="url(#skinGrad)" filter="url(#shadow)" />
            <circle cx={72} cy={108} r={1} fill="oklch(0.25 0.01 250)" />
            <circle cx={78} cy={108} r={1} fill="oklch(0.25 0.01 250)" />
          </g>
          {/* Arms pushing bar */}
          <Limb x1={90} y1={112} x2={70} y2={88} width={5}
            animate={[{ attr: "y2", values: "88;72;88", dur: "1.8s" }]} />
          <Limb x1={110} y1={112} x2={130} y2={88} width={5}
            animate={[{ attr: "y2", values: "88;72;88", dur: "1.8s" }]} />
          {/* Bar */}
          <Bar x1={50} y1={88} x2={150} y2={88}
            animate={[
              { attr: "y1", values: "88;72;88", dur: "1.8s" },
              { attr: "y2", values: "88;72;88", dur: "1.8s" },
            ]} />
          {/* Plates */}
          <Plate x={40} y={80} w={12} h={16}
            animate={[{ attr: "y", values: "80;64;80", dur: "1.8s" }]} />
          <Plate x={148} y={80} w={12} h={16}
            animate={[{ attr: "y", values: "80;64;80", dur: "1.8s" }]} />
          {/* Legs */}
          <Limb x1={115} y1={118} x2={135} y2={150} width={6} />
          <Limb x1={135} y1={150} x2={140} y2={162} width={5} />
        </g>
      )

    case "chest-fly":
    case "crossover":
    case "reverse-fly":
      return (
        <g>
          <Head cx={100} cy={42} />
          <Torso x1={100} y1={54} x2={100} y2={110} />
          <Limb x1={100} y1={110} x2={82} y2={155} width={6} />
          <Limb x1={100} y1={110} x2={118} y2={155} width={6} />
          <Limb x1={82} y1={155} x2={76} y2={170} width={5} />
          <Limb x1={118} y1={155} x2={124} y2={170} width={5} />
          {/* Arms fly */}
          <Limb x1={92} y1={68} x2={52} y2={82} width={5}
            animate={[
              { attr: "x2", values: "52;78;52", dur: "2s" },
              { attr: "y2", values: "82;60;82", dur: "2s" },
            ]} />
          <Limb x1={108} y1={68} x2={148} y2={82} width={5}
            animate={[
              { attr: "x2", values: "148;122;148", dur: "2s" },
              { attr: "y2", values: "82;60;82", dur: "2s" },
            ]} />
          <Dumbbell cx={52} cy={82}
            animate={[
              { attr: "cx", values: "46;72;46", dur: "2s" },
              { attr: "cy", values: "82;60;82", dur: "2s" },
              { attr: "x", values: "42;68;42", dur: "2s" },
              { attr: "y", values: "79;57;79", dur: "2s" },
            ]} />
          <Dumbbell cx={148} cy={82}
            animate={[
              { attr: "cx", values: "154;128;154", dur: "2s" },
              { attr: "cy", values: "82;60;82", dur: "2s" },
              { attr: "x", values: "150;124;150", dur: "2s" },
              { attr: "y", values: "79;57;79", dur: "2s" },
            ]} />
        </g>
      )

    case "push-up":
      return (
        <g>
          <g>
            <circle cx={52} cy={68} r={10} fill="url(#skinGrad)" filter="url(#shadow)">
              <animate attributeName="cy" values="68;82;68" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle cx={49} cy={66} r={1} fill="oklch(0.25 0.01 250)">
              <animate attributeName="cy" values="66;80;66" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle cx={55} cy={66} r={1} fill="oklch(0.25 0.01 250)">
              <animate attributeName="cy" values="66;80;66" dur="1.8s" repeatCount="indefinite" />
            </circle>
          </g>
          {/* Body plank */}
          <line x1={60} y1={75} x2={145} y2={100} stroke="url(#bodyGrad)" strokeWidth={14} strokeLinecap="round" filter="url(#shadow)">
            <animate attributeName="y1" values="75;90;75" dur="1.8s" repeatCount="indefinite" />
          </line>
          {/* Arms */}
          <Limb x1={60} y1={75} x2={60} y2={120} width={5}
            animate={[{ attr: "y1", values: "75;90;75", dur: "1.8s" }]} />
          {/* Legs */}
          <Limb x1={145} y1={100} x2={160} y2={120} width={6} />
          {/* Ground */}
          <line x1={30} y1={122} x2={170} y2={122} stroke="oklch(0.28 0.005 250)" strokeWidth={2} opacity={0.5} />
        </g>
      )

    case "squat":
      return (
        <g>
          <g>
            <Head cx={100} cy={40} r={12} />
            <animateTransform attributeName="transform" type="translate" values="0,0;0,18;0,0" dur="2s" repeatCount="indefinite" />
          </g>
          {/* Body */}
          <rect x={91} y={52} width={18} height={46} rx={6} fill="url(#bodyGrad)" filter="url(#shadow)">
            <animate attributeName="y" values="52;68;52" dur="2s" repeatCount="indefinite" />
            <animate attributeName="height" values="46;36;46" dur="2s" repeatCount="indefinite" />
          </rect>
          {/* Bar across shoulders */}
          <Bar x1={62} y1={56} x2={138} y2={56}
            animate={[
              { attr: "y1", values: "56;74;56", dur: "2s" },
              { attr: "y2", values: "56;74;56", dur: "2s" },
            ]} />
          <Plate x={50} y={48} w={14} h={16}
            animate={[{ attr: "y", values: "48;66;48", dur: "2s" }]} />
          <Plate x={136} y={48} w={14} h={16}
            animate={[{ attr: "y", values: "48;66;48", dur: "2s" }]} />
          {/* Legs */}
          <Limb x1={94} y1={98} x2={78} y2={142} width={6}
            animate={[
              { attr: "y1", values: "98;104;98", dur: "2s" },
              { attr: "x2", values: "78;70;78", dur: "2s" },
            ]} />
          <Limb x1={106} y1={98} x2={122} y2={142} width={6}
            animate={[
              { attr: "y1", values: "98;104;98", dur: "2s" },
              { attr: "x2", values: "122;130;122", dur: "2s" },
            ]} />
          {/* Feet */}
          <Limb x1={78} y1={142} x2={68} y2={155} width={5} />
          <Limb x1={122} y1={142} x2={132} y2={155} width={5} />
        </g>
      )

    case "lat-pulldown":
      return (
        <g>
          {/* Machine */}
          <rect x={95} y={10} width={10} height={20} rx={3} fill="url(#equipGrad)" />
          <line x1={60} y1={30} x2={140} y2={30} stroke="url(#equipGrad)" strokeWidth={4} />
          {/* Head */}
          <Head cx={100} cy={58} />
          {/* Body seated */}
          <Torso x1={100} y1={70} x2={100} y2={118} />
          {/* Seat */}
          <rect x={80} y={118} width={40} height={8} rx={4} fill="url(#equipGrad)" />
          {/* Legs */}
          <Limb x1={92} y1={126} x2={82} y2={155} width={6} />
          <Limb x1={108} y1={126} x2={118} y2={155} width={6} />
          {/* Arms pulling */}
          <Limb x1={92} y1={78} x2={65} y2={40} width={5}
            animate={[
              { attr: "y2", values: "40;78;40", dur: "1.8s" },
              { attr: "x2", values: "65;72;65", dur: "1.8s" },
            ]} />
          <Limb x1={108} y1={78} x2={135} y2={40} width={5}
            animate={[
              { attr: "y2", values: "40;78;40", dur: "1.8s" },
              { attr: "x2", values: "135;128;135", dur: "1.8s" },
            ]} />
          {/* Pull bar */}
          <Bar x1={58} y1={36} x2={142} y2={36}
            animate={[
              { attr: "y1", values: "36;74;36", dur: "1.8s" },
              { attr: "y2", values: "36;74;36", dur: "1.8s" },
            ]} />
        </g>
      )

    case "bicep-curl":
    case "hammer-curl":
      return (
        <g>
          <Head cx={100} cy={38} />
          <Torso x1={100} y1={50} x2={100} y2={110} />
          <Limb x1={100} y1={110} x2={85} y2={158} width={6} />
          <Limb x1={100} y1={110} x2={115} y2={158} width={6} />
          <Limb x1={85} y1={158} x2={78} y2={170} width={5} />
          <Limb x1={115} y1={158} x2={122} y2={170} width={5} />
          {/* Left upper arm */}
          <Limb x1={92} y1={62} x2={76} y2={85} width={5} />
          {/* Left forearm curling */}
          <Limb x1={76} y1={85} x2={72} y2={70} width={5}
            animate={[
              { attr: "y2", values: "85;55;85", dur: "1.6s" },
              { attr: "x2", values: "72;74;72", dur: "1.6s" },
            ]} />
          {/* Right upper arm */}
          <Limb x1={108} y1={62} x2={124} y2={85} width={5} />
          {/* Right forearm curling */}
          <Limb x1={124} y1={85} x2={128} y2={70} width={5}
            animate={[
              { attr: "y2", values: "85;55;85", dur: "1.6s", begin: "0.8s" },
              { attr: "x2", values: "128;126;128", dur: "1.6s", begin: "0.8s" },
            ]} />
          {/* Dumbbells */}
          <Dumbbell cx={72} cy={85}
            animate={[
              { attr: "cy", values: "85;55;85", dur: "1.6s" },
              { attr: "y", values: "82;52;82", dur: "1.6s" },
              { attr: "cx", values: "66;68;66", dur: "1.6s" },
              { attr: "x", values: "62;64;62", dur: "1.6s" },
            ]} />
          <Dumbbell cx={128} cy={85}
            animate={[
              { attr: "cy", values: "85;55;85", dur: "1.6s", begin: "0.8s" },
              { attr: "y", values: "82;52;82", dur: "1.6s", begin: "0.8s" },
              { attr: "cx", values: "134;132;134", dur: "1.6s", begin: "0.8s" },
              { attr: "x", values: "130;128;130", dur: "1.6s", begin: "0.8s" },
            ]} />
        </g>
      )

    case "tricep-pushdown":
    case "overhead-extension":
    case "skull-crusher":
      return (
        <g>
          {/* Cable machine */}
          <rect x={95} y={8} width={10} height={18} rx={3} fill="url(#equipGrad)" />
          <Head cx={100} cy={42} />
          <Torso x1={100} y1={54} x2={100} y2={110} />
          <Limb x1={100} y1={110} x2={85} y2={155} width={6} />
          <Limb x1={100} y1={110} x2={115} y2={155} width={6} />
          {/* Arms pushing down */}
          <Limb x1={92} y1={66} x2={82} y2={80} width={5} />
          <Limb x1={82} y1={80} x2={82} y2={95} width={5}
            animate={[{ attr: "y2", values: "80;112;80", dur: "1.5s" }]} />
          <Limb x1={108} y1={66} x2={118} y2={80} width={5} />
          <Limb x1={118} y1={80} x2={118} y2={95} width={5}
            animate={[{ attr: "y2", values: "80;112;80", dur: "1.5s" }]} />
          {/* Handle */}
          <Bar x1={76} y1={95} x2={124} y2={95}
            animate={[
              { attr: "y1", values: "80;112;80", dur: "1.5s" },
              { attr: "y2", values: "80;112;80", dur: "1.5s" },
            ]} />
        </g>
      )

    case "shoulder-press":
    case "front-raise":
      return (
        <g>
          <g>
            <Head cx={100} cy={38} r={12} />
            <animateTransform attributeName="transform" type="translate" values="0,0;0,-5;0,0" dur="1.8s" repeatCount="indefinite" />
          </g>
          <Torso x1={100} y1={50} x2={100} y2={110} />
          <Limb x1={100} y1={110} x2={85} y2={155} width={6} />
          <Limb x1={100} y1={110} x2={115} y2={155} width={6} />
          {/* Arms pressing up */}
          <Limb x1={92} y1={62} x2={70} y2={60} width={5}
            animate={[{ attr: "y2", values: "68;35;68", dur: "1.8s" }]} />
          <Limb x1={108} y1={62} x2={130} y2={60} width={5}
            animate={[{ attr: "y2", values: "68;35;68", dur: "1.8s" }]} />
          <Dumbbell cx={70} cy={68}
            animate={[
              { attr: "cy", values: "68;35;68", dur: "1.8s" },
              { attr: "y", values: "65;32;65", dur: "1.8s" },
            ]} />
          <Dumbbell cx={130} cy={68}
            animate={[
              { attr: "cy", values: "68;35;68", dur: "1.8s" },
              { attr: "y", values: "65;32;65", dur: "1.8s" },
            ]} />
        </g>
      )

    case "lateral-raise":
    case "shrug":
      return (
        <g>
          <Head cx={100} cy={38} />
          <Torso x1={100} y1={50} x2={100} y2={110} />
          <Limb x1={100} y1={110} x2={85} y2={155} width={6} />
          <Limb x1={100} y1={110} x2={115} y2={155} width={6} />
          {/* Arms raising */}
          <Limb x1={92} y1={62} x2={62} y2={88} width={5}
            animate={[
              { attr: "x2", values: "62;38;62", dur: "1.8s" },
              { attr: "y2", values: "88;48;88", dur: "1.8s" },
            ]} />
          <Limb x1={108} y1={62} x2={138} y2={88} width={5}
            animate={[
              { attr: "x2", values: "138;162;138", dur: "1.8s" },
              { attr: "y2", values: "88;48;88", dur: "1.8s" },
            ]} />
          <Dumbbell cx={62} cy={88}
            animate={[
              { attr: "cx", values: "56;32;56", dur: "1.8s" },
              { attr: "cy", values: "88;48;88", dur: "1.8s" },
              { attr: "x", values: "52;28;52", dur: "1.8s" },
              { attr: "y", values: "85;45;85", dur: "1.8s" },
            ]} />
          <Dumbbell cx={138} cy={88}
            animate={[
              { attr: "cx", values: "144;168;144", dur: "1.8s" },
              { attr: "cy", values: "88;48;88", dur: "1.8s" },
              { attr: "x", values: "140;164;140", dur: "1.8s" },
              { attr: "y", values: "85;45;85", dur: "1.8s" },
            ]} />
        </g>
      )

    case "leg-press":
    case "leg-extension":
    case "leg-curl":
      return (
        <g>
          {/* Seat */}
          <rect x={38} y={60} width={14} height={60} rx={5} fill="url(#equipGrad)" transform="rotate(-15 45 90)" />
          <rect x={35} y={100} width={50} height={8} rx={4} fill="url(#equipGrad)" />
          {/* Head */}
          <g>
            <circle cx={62} cy={52} r={10} fill="url(#skinGrad)" filter="url(#shadow)" />
            <circle cx={65} cy={50} r={1} fill="oklch(0.25 0.01 250)" />
          </g>
          {/* Body reclined */}
          <line x1={62} y1={62} x2={78} y2={105} stroke="url(#bodyGrad)" strokeWidth={14} strokeLinecap="round" filter="url(#shadow)" />
          {/* Legs pressing */}
          <Limb x1={80} y1={102} x2={115} y2={88} width={6}
            animate={[
              { attr: "x2", values: "115;148;115", dur: "1.8s" },
              { attr: "y2", values: "88;78;88", dur: "1.8s" },
            ]} />
          <Limb x1={80} y1={108} x2={115} y2={118} width={6}
            animate={[
              { attr: "x2", values: "115;148;115", dur: "1.8s" },
              { attr: "y2", values: "118;108;118", dur: "1.8s" },
            ]} />
          {/* Platform */}
          <rect x={118} y={68} width={12} height={60} rx={4} fill="url(#plateGrad)" filter="url(#shadow)">
            <animate attributeName="x" values="118;150;118" dur="1.8s" repeatCount="indefinite" />
          </rect>
        </g>
      )

    case "lunge":
    case "deadlift":
      return (
        <g>
          <g>
            <Head cx={100} cy={35} r={12} />
            <animateTransform attributeName="transform" type="translate" values="0,0;0,16;0,0" dur="2.2s" repeatCount="indefinite" />
          </g>
          <rect x={91} y={47} width={18} height={42} rx={6} fill="url(#bodyGrad)" filter="url(#shadow)">
            <animate attributeName="y" values="47;63;47" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="height" values="42;34;42" dur="2.2s" repeatCount="indefinite" />
          </rect>
          <Limb x1={94} y1={89} x2={76} y2={140} width={6}
            animate={[{ attr: "y1", values: "89;97;89", dur: "2.2s" }]} />
          <Limb x1={106} y1={89} x2={128} y2={130} width={6}
            animate={[
              { attr: "y1", values: "89;97;89", dur: "2.2s" },
              { attr: "y2", values: "130;140;130", dur: "2.2s" },
            ]} />
          <Limb x1={76} y1={140} x2={68} y2={158} width={5} />
          <Limb x1={128} y1={130} x2={138} y2={158} width={5} />
        </g>
      )

    case "hip-thrust":
    case "hip-abduction":
    case "kickback":
      return (
        <g>
          {/* Bench */}
          <rect x={55} y={85} width={50} height={10} rx={5} fill="url(#equipGrad)" />
          {/* Head */}
          <g>
            <circle cx={72} cy={75} r={10} fill="url(#skinGrad)" filter="url(#shadow)" />
          </g>
          {/* Body bridging */}
          <line x1={80} y1={88} x2={130} y2={88} stroke="url(#bodyGrad)" strokeWidth={14} strokeLinecap="round" filter="url(#shadow)">
            <animate attributeName="y2" values="100;82;100" dur="1.8s" repeatCount="indefinite" />
          </line>
          {/* Legs */}
          <Limb x1={130} y1={100} x2={140} y2={135} width={6}
            animate={[{ attr: "y1", values: "100;82;100", dur: "1.8s" }]} />
          <Limb x1={140} y1={135} x2={148} y2={152} width={5} />
          {/* Plate on lap */}
          <Plate x={100} y={82} w={16} h={10}
            animate={[{ attr: "y", values: "93;75;93", dur: "1.8s" }]} />
        </g>
      )

    case "crunch":
    case "bicycle-crunch":
    case "russian-twist":
      return (
        <g>
          {/* Mat */}
          <rect x={30} y={140} width={140} height={6} rx={3} fill="url(#equipGrad)" opacity={0.5} />
          {/* Body crunching */}
          <line x1={70} y1={120} x2={140} y2={135} stroke="url(#bodyGrad)" strokeWidth={14} strokeLinecap="round" filter="url(#shadow)" />
          {/* Head crunching up */}
          <g>
            <circle cx={65} cy={112} r={10} fill="url(#skinGrad)" filter="url(#shadow)">
              <animate attributeName="cy" values="112;95;112" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="cx" values="65;72;65" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </g>
          {/* Upper body crunching */}
          <line x1={70} y1={120} x2={70} y2={120} stroke="url(#bodyGrad)" strokeWidth={14} strokeLinecap="round" filter="url(#shadow)">
            <animate attributeName="y1" values="120;108;120" dur="1.5s" repeatCount="indefinite" />
          </line>
          {/* Legs bent */}
          <Limb x1={140} y1={132} x2={148} y2={110} width={6} />
          <Limb x1={148} y1={110} x2={155} y2={138} width={5} />
        </g>
      )

    case "plank":
      return (
        <g>
          <rect x={30} y={148} width={140} height={6} rx={3} fill="url(#equipGrad)" opacity={0.5} />
          <g>
            <circle cx={52} cy={100} r={10} fill="url(#skinGrad)" filter="url(#shadow)" />
          </g>
          <line x1={60} y1={108} x2={150} y2={118} stroke="url(#bodyGrad)" strokeWidth={14} strokeLinecap="round" filter="url(#shadow)" />
          <Limb x1={60} y1={108} x2={60} y2={142} width={5} />
          <Limb x1={150} y1={118} x2={155} y2={142} width={5} />
        </g>
      )

    case "leg-raise":
      return (
        <g>
          <rect x={30} y={148} width={140} height={6} rx={3} fill="url(#equipGrad)" opacity={0.5} />
          <g>
            <circle cx={65} cy={120} r={10} fill="url(#skinGrad)" filter="url(#shadow)" />
          </g>
          <line x1={70} y1={130} x2={70} y2={145} stroke="url(#bodyGrad)" strokeWidth={14} strokeLinecap="round" filter="url(#shadow)" />
          <Limb x1={80} y1={140} x2={130} y2={140} width={6}
            animate={[{ attr: "y2", values: "140;100;140", dur: "1.6s" }]} />
          <Limb x1={130} y1={140} x2={138} y2={148} width={5}
            animate={[
              { attr: "y1", values: "140;100;140", dur: "1.6s" },
              { attr: "y2", values: "148;108;148", dur: "1.6s" },
            ]} />
        </g>
      )

    // Cardio exercises
    case "treadmill":
    case "elliptical":
      return (
        <g>
          {/* Machine base */}
          <rect x={50} y={145} width={100} height={8} rx={4} fill="url(#equipGrad)" />
          <rect x={120} y={45} width={8} height={100} rx={3} fill="url(#equipGrad)" />
          {/* Screen */}
          <rect x={115} y={42} width={18} height={12} rx={3} fill="oklch(0.40 0.15 145)" opacity={0.6} />
          <Head cx={90} cy={52} r={11} />
          <Torso x1={90} y1={64} x2={90} y2={108} width={15} />
          {/* Arms swinging */}
          <Limb x1={84} y1={72} x2={72} y2={95} width={4}
            animate={[{ attr: "x2", values: "72;78;72", dur: "0.8s" }]} />
          <Limb x1={96} y1={72} x2={108} y2={95} width={4}
            animate={[{ attr: "x2", values: "108;102;108", dur: "0.8s" }]} />
          {/* Legs running */}
          <Limb x1={88} y1={108} x2={74} y2={142} width={6}
            animate={[{ attr: "x2", values: "74;88;74", dur: "0.8s" }]} />
          <Limb x1={92} y1={108} x2={106} y2={142} width={6}
            animate={[{ attr: "x2", values: "106;92;106", dur: "0.8s" }]} />
        </g>
      )

    case "cycling":
      return (
        <g>
          {/* Bike frame */}
          <circle cx={70} cy={135} r={22} fill="none" stroke="url(#equipGrad)" strokeWidth={3} />
          <circle cx={130} cy={135} r={22} fill="none" stroke="url(#equipGrad)" strokeWidth={3} />
          <line x1={70} y1={135} x2={100} y2={100} stroke="url(#equipGrad)" strokeWidth={4} />
          <line x1={130} y1={135} x2={100} y2={100} stroke="url(#equipGrad)" strokeWidth={4} />
          <line x1={100} y1={100} x2={100} y2={80} stroke="url(#equipGrad)" strokeWidth={4} />
          <line x1={90} y1={80} x2={110} y2={80} stroke="url(#equipGrad)" strokeWidth={4} />
          {/* Person */}
          <Head cx={100} cy={52} r={11} />
          <Torso x1={100} y1={64} x2={100} y2={95} width={14} />
          {/* Legs pedaling */}
          <Limb x1={96} y1={95} x2={80} y2={128} width={5}
            animate={[
              { attr: "x2", values: "80;100;80", dur: "1s" },
              { attr: "y2", values: "128;118;128", dur: "1s" },
            ]} />
          <Limb x1={104} y1={95} x2={120} y2={118} width={5}
            animate={[
              { attr: "x2", values: "120;100;120", dur: "1s" },
              { attr: "y2", values: "118;128;118", dur: "1s" },
            ]} />
        </g>
      )

    case "jump-rope":
      return (
        <g>
          <g>
            <Head cx={100} cy={40} r={11} />
            <animateTransform attributeName="transform" type="translate" values="0,0;0,-12;0,0" dur="0.6s" repeatCount="indefinite" />
          </g>
          <rect x={92} y={52} width={16} height={42} rx={5} fill="url(#bodyGrad)" filter="url(#shadow)">
            <animate attributeName="y" values="52;40;52" dur="0.6s" repeatCount="indefinite" />
          </rect>
          <Limb x1={94} y1={94} x2={85} y2={135} width={5}
            animate={[{ attr: "y1", values: "94;82;94", dur: "0.6s" }]} />
          <Limb x1={106} y1={94} x2={115} y2={135} width={5}
            animate={[{ attr: "y1", values: "94;82;94", dur: "0.6s" }]} />
          {/* Rope */}
          <ellipse cx={100} cy={100} rx={45} ry={60} fill="none" stroke="oklch(0.72 0.19 145)" strokeWidth={2} strokeDasharray="4 4" opacity={0.6}>
            <animateTransform attributeName="transform" type="rotate" values="0 100 100;360 100 100" dur="0.6s" repeatCount="indefinite" />
          </ellipse>
        </g>
      )

    // Specific back exercises
    case "bent-row":
    case "seated-row":
      return (
        <g>
          {/* Head bent forward */}
          <g>
            <circle cx={75} cy={55} r={11} fill="url(#skinGrad)" filter="url(#shadow)" />
            <circle cx={78} cy={53} r={1} fill="oklch(0.25 0.01 250)" />
          </g>
          {/* Body bent */}
          <line x1={80} y1={65} x2={115} y2={95} stroke="url(#bodyGrad)" strokeWidth={14} strokeLinecap="round" filter="url(#shadow)" />
          {/* Legs */}
          <Limb x1={115} y1={95} x2={100} y2={148} width={6} />
          <Limb x1={115} y1={95} x2={130} y2={148} width={6} />
          {/* Arms rowing */}
          <Limb x1={85} y1={72} x2={68} y2={100} width={5}
            animate={[
              { attr: "y2", values: "100;78;100", dur: "1.6s" },
              { attr: "x2", values: "68;78;68", dur: "1.6s" },
            ]} />
          <Limb x1={95} y1={78} x2={78} y2={105} width={5}
            animate={[
              { attr: "y2", values: "105;82;105", dur: "1.6s" },
              { attr: "x2", values: "78;88;78", dur: "1.6s" },
            ]} />
          {/* Bar */}
          <Bar x1={55} y1={102} x2={95} y2={102}
            animate={[
              { attr: "y1", values: "102;80;102", dur: "1.6s" },
              { attr: "y2", values: "102;80;102", dur: "1.6s" },
            ]} />
        </g>
      )

    case "dip":
      return (
        <g>
          {/* Bars */}
          <rect x={60} y={80} width={6} height={80} rx={3} fill="url(#equipGrad)" />
          <rect x={134} y={80} width={6} height={80} rx={3} fill="url(#equipGrad)" />
          {/* Head */}
          <g>
            <Head cx={100} cy={44} r={12} />
            <animateTransform attributeName="transform" type="translate" values="0,0;0,18;0,0" dur="1.8s" repeatCount="indefinite" />
          </g>
          <Torso x1={100} y1={56} x2={100} y2={100} />
          {/* Arms on bars */}
          <Limb x1={92} y1={65} x2={66} y2={82} width={5}
            animate={[{ attr: "y2", values: "82;82;82", dur: "1.8s" }]} />
          <Limb x1={108} y1={65} x2={134} y2={82} width={5}
            animate={[{ attr: "y2", values: "82;82;82", dur: "1.8s" }]} />
          {/* Legs */}
          <Limb x1={96} y1={100} x2={90} y2={140} width={6}
            animate={[{ attr: "y1", values: "100;118;100", dur: "1.8s" }]} />
          <Limb x1={104} y1={100} x2={110} y2={140} width={6}
            animate={[{ attr: "y1", values: "100;118;100", dur: "1.8s" }]} />
        </g>
      )

    case "calf-raise":
      return (
        <g>
          {/* Step platform */}
          <rect x={65} y={148} width={70} height={10} rx={4} fill="url(#equipGrad)" />
          <g>
            <Head cx={100} cy={35} r={12} />
            <animateTransform attributeName="transform" type="translate" values="0,0;0,-10;0,0" dur="1.2s" repeatCount="indefinite" />
          </g>
          <rect x={91} y={47} width={18} height={50} rx={6} fill="url(#bodyGrad)" filter="url(#shadow)">
            <animate attributeName="y" values="47;37;47" dur="1.2s" repeatCount="indefinite" />
          </rect>
          <Limb x1={94} y1={97} x2={90} y2={145} width={6}
            animate={[{ attr: "y1", values: "97;87;97", dur: "1.2s" }]} />
          <Limb x1={106} y1={97} x2={110} y2={145} width={6}
            animate={[{ attr: "y1", values: "97;87;97", dur: "1.2s" }]} />
        </g>
      )

    default:
      // Generic standing figure
      return (
        <g>
          <Head cx={100} cy={38} />
          <Torso x1={100} y1={50} x2={100} y2={110} />
          <Limb x1={92} y1={60} x2={68} y2={88} width={5} />
          <Limb x1={108} y1={60} x2={132} y2={88} width={5} />
          <Limb x1={100} y1={110} x2={85} y2={158} width={6} />
          <Limb x1={100} y1={110} x2={115} y2={158} width={6} />
          <Limb x1={85} y1={158} x2={78} y2={172} width={5} />
          <Limb x1={115} y1={158} x2={122} y2={172} width={5} />
        </g>
      )
  }
}
