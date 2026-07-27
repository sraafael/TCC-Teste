/**
 * Arquivo: front-end/lib/workout-data.ts
 * Area: Front-end utilitarios e dados
 * Funcao: Base de dados local de exercicios e planos de treino reutilizaveis.
 * Onde fica: /front-end/lib/workout-data.ts
 */
export type ExerciseCategory =
  | "peito"
  | "costas"
  | "pernas"
  | "ombros"
  | "biceps"
  | "triceps"
  | "abdomen"
  | "gluteos"
  | "cardio"

export type GoalType =
  | "hipertrofia"
  | "emagrecimento"
  | "condicionamento"
  | "funcional"
  | "forca"

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  sets: string
  reps: string
  animationType: string
}

export interface WorkoutDay {
  label: string
  muscleGroups: string
  exercises: Exercise[]
}

export interface WorkoutPlan {
  id: string
  goalLabel: string
  goal: GoalType
  description: string
  days: WorkoutDay[]
}

// TODO: REFACTOR - O banco local de exercícios funciona como fonte única de verdade e de montagem de planos, concentrando regra de negócio e dados em um mesmo ponto.
// Banco local de exercicios por grupo muscular/categoria.
// Este objeto alimenta filtros, montagem de treino e planos prontos.
const exerciseDatabase: Record<ExerciseCategory, Exercise[]> = {
  peito: [
    { id: "supino-reto", name: "Supino Reto", category: "peito", sets: "4", reps: "12", animationType: "bench-press" },
    { id: "supino-inclinado", name: "Supino Inclinado", category: "peito", sets: "4", reps: "10", animationType: "incline-press" },
    { id: "crucifixo", name: "Crucifixo", category: "peito", sets: "3", reps: "15", animationType: "chest-fly" },
    { id: "crossover", name: "Crossover", category: "peito", sets: "3", reps: "12", animationType: "crossover" },
    { id: "flexao", name: "Flexao de Braco", category: "peito", sets: "3", reps: "15", animationType: "push-up" },
    { id: "supino-declinado", name: "Supino Declinado", category: "peito", sets: "4", reps: "10", animationType: "bench-press" },
  ],
  costas: [
    { id: "puxada-frontal", name: "Puxada Frontal", category: "costas", sets: "4", reps: "12", animationType: "lat-pulldown" },
    { id: "remada-curvada", name: "Remada Curvada", category: "costas", sets: "4", reps: "10", animationType: "bent-row" },
    { id: "remada-baixa", name: "Remada Baixa", category: "costas", sets: "3", reps: "12", animationType: "seated-row" },
    { id: "pulldown", name: "Pulldown", category: "costas", sets: "3", reps: "12", animationType: "lat-pulldown" },
    { id: "remada-unilateral", name: "Remada Unilateral", category: "costas", sets: "3", reps: "10", animationType: "bent-row" },
    { id: "barra-fixa", name: "Barra Fixa", category: "costas", sets: "3", reps: "8", animationType: "lat-pulldown" },
  ],
  pernas: [
    { id: "agachamento", name: "Agachamento", category: "pernas", sets: "4", reps: "12", animationType: "squat" },
    { id: "leg-press", name: "Leg Press", category: "pernas", sets: "4", reps: "15", animationType: "leg-press" },
    { id: "cadeira-extensora", name: "Cadeira Extensora", category: "pernas", sets: "3", reps: "12", animationType: "leg-extension" },
    { id: "cadeira-flexora", name: "Cadeira Flexora", category: "pernas", sets: "3", reps: "12", animationType: "leg-curl" },
    { id: "panturrilha", name: "Panturrilha em Pe", category: "pernas", sets: "4", reps: "15", animationType: "calf-raise" },
    { id: "afundo", name: "Afundo", category: "pernas", sets: "3", reps: "12", animationType: "lunge" },
    { id: "stiff", name: "Stiff", category: "pernas", sets: "3", reps: "12", animationType: "deadlift" },
  ],
  ombros: [
    { id: "desenvolvimento", name: "Desenvolvimento", category: "ombros", sets: "4", reps: "10", animationType: "shoulder-press" },
    { id: "elevacao-lateral", name: "Elevacao Lateral", category: "ombros", sets: "4", reps: "12", animationType: "lateral-raise" },
    { id: "elevacao-frontal", name: "Elevacao Frontal", category: "ombros", sets: "3", reps: "12", animationType: "front-raise" },
    { id: "crucifixo-inverso", name: "Crucifixo Inverso", category: "ombros", sets: "3", reps: "15", animationType: "reverse-fly" },
    { id: "encolhimento", name: "Encolhimento", category: "ombros", sets: "4", reps: "12", animationType: "shrug" },
  ],
  biceps: [
    { id: "rosca-direta", name: "Rosca Direta", category: "biceps", sets: "4", reps: "12", animationType: "bicep-curl" },
    { id: "rosca-alternada", name: "Rosca Alternada", category: "biceps", sets: "3", reps: "10", animationType: "bicep-curl" },
    { id: "rosca-martelo", name: "Rosca Martelo", category: "biceps", sets: "3", reps: "12", animationType: "hammer-curl" },
    { id: "rosca-scott", name: "Rosca Scott", category: "biceps", sets: "3", reps: "10", animationType: "bicep-curl" },
    { id: "rosca-concentrada", name: "Rosca Concentrada", category: "biceps", sets: "3", reps: "12", animationType: "bicep-curl" },
  ],
  triceps: [
    { id: "triceps-pulley", name: "Triceps Pulley", category: "triceps", sets: "4", reps: "12", animationType: "tricep-pushdown" },
    { id: "triceps-frances", name: "Triceps Frances", category: "triceps", sets: "3", reps: "12", animationType: "overhead-extension" },
    { id: "triceps-testa", name: "Triceps Testa", category: "triceps", sets: "3", reps: "10", animationType: "skull-crusher" },
    { id: "mergulho", name: "Mergulho", category: "triceps", sets: "3", reps: "10", animationType: "dip" },
    { id: "triceps-corda", name: "Triceps Corda", category: "triceps", sets: "3", reps: "15", animationType: "tricep-pushdown" },
  ],
  abdomen: [
    { id: "abdominal-crunch", name: "Abdominal Crunch", category: "abdomen", sets: "3", reps: "20", animationType: "crunch" },
    { id: "prancha", name: "Prancha", category: "abdomen", sets: "3", reps: "45s", animationType: "plank" },
    { id: "abdominal-infra", name: "Abdominal Infra", category: "abdomen", sets: "3", reps: "15", animationType: "leg-raise" },
    { id: "russian-twist", name: "Russian Twist", category: "abdomen", sets: "3", reps: "20", animationType: "russian-twist" },
    { id: "abdominal-bicicleta", name: "Abdominal Bicicleta", category: "abdomen", sets: "3", reps: "20", animationType: "bicycle-crunch" },
  ],
  gluteos: [
    { id: "hip-thrust", name: "Hip Thrust", category: "gluteos", sets: "4", reps: "12", animationType: "hip-thrust" },
    { id: "elevacao-pelvica", name: "Elevacao Pelvica", category: "gluteos", sets: "3", reps: "15", animationType: "hip-thrust" },
    { id: "abdutora", name: "Abdutora", category: "gluteos", sets: "3", reps: "15", animationType: "hip-abduction" },
    { id: "coice", name: "Coice no Cabo", category: "gluteos", sets: "3", reps: "12", animationType: "kickback" },
  ],
  cardio: [
    { id: "esteira", name: "Esteira", category: "cardio", sets: "1", reps: "20min", animationType: "treadmill" },
    { id: "bicicleta", name: "Bicicleta Ergometrica", category: "cardio", sets: "1", reps: "15min", animationType: "cycling" },
    { id: "eliptico", name: "Eliptico", category: "cardio", sets: "1", reps: "15min", animationType: "elliptical" },
    { id: "pular-corda", name: "Pular Corda", category: "cardio", sets: "3", reps: "3min", animationType: "jump-rope" },
  ],
}

// TODO: REFACTOR - Os planos são definidos diretamente com referências a exercícios específicos, o que torna os dados rígidos e acoplados à estrutura atual do banco.
export const workoutPlans: WorkoutPlan[] = [
  {
    id: "hipertrofia-abc",
    goalLabel: "Hipertrofia",
    goal: "hipertrofia",
    description: "Ganho de massa muscular com treinos pesados e progressivos",
    days: [
      {
        label: "Treino A",
        muscleGroups: "Peito / Triceps",
        exercises: [
          exerciseDatabase.peito[0],
          exerciseDatabase.peito[1],
          exerciseDatabase.peito[2],
          exerciseDatabase.triceps[0],
          exerciseDatabase.triceps[1],
          exerciseDatabase.abdomen[0],
        ],
      },
      {
        label: "Treino B",
        muscleGroups: "Costas / Biceps",
        exercises: [
          exerciseDatabase.costas[0],
          exerciseDatabase.costas[1],
          exerciseDatabase.costas[2],
          exerciseDatabase.biceps[0],
          exerciseDatabase.biceps[2],
          exerciseDatabase.abdomen[1],
        ],
      },
      {
        label: "Treino C",
        muscleGroups: "Pernas / Ombros",
        exercises: [
          exerciseDatabase.pernas[0],
          exerciseDatabase.pernas[1],
          exerciseDatabase.pernas[2],
          exerciseDatabase.pernas[3],
          exerciseDatabase.ombros[0],
          exerciseDatabase.ombros[1],
        ],
      },
    ],
  },
  {
    id: "emagrecimento-abc",
    goalLabel: "Emagrecimento",
    goal: "emagrecimento",
    description: "Queima de gordura com treino intenso e cardio integrado",
    days: [
      {
        label: "Treino A",
        muscleGroups: "Superior + Cardio",
        exercises: [
          exerciseDatabase.peito[0],
          exerciseDatabase.costas[0],
          exerciseDatabase.ombros[1],
          exerciseDatabase.triceps[0],
          exerciseDatabase.biceps[0],
          exerciseDatabase.cardio[0],
        ],
      },
      {
        label: "Treino B",
        muscleGroups: "Inferior + Cardio",
        exercises: [
          exerciseDatabase.pernas[0],
          exerciseDatabase.pernas[1],
          exerciseDatabase.gluteos[0],
          exerciseDatabase.pernas[4],
          exerciseDatabase.abdomen[0],
          exerciseDatabase.cardio[1],
        ],
      },
      {
        label: "Treino C",
        muscleGroups: "Full Body + HIIT",
        exercises: [
          exerciseDatabase.peito[4],
          exerciseDatabase.pernas[5],
          exerciseDatabase.costas[5],
          exerciseDatabase.abdomen[1],
          exerciseDatabase.abdomen[3],
          exerciseDatabase.cardio[3],
        ],
      },
    ],
  },
  {
    id: "condicionamento-abc",
    goalLabel: "Condicionamento",
    goal: "condicionamento",
    description: "Melhora da resistencia e capacidade cardiovascular",
    days: [
      {
        label: "Treino A",
        muscleGroups: "Push + Cardio",
        exercises: [
          exerciseDatabase.peito[0],
          exerciseDatabase.ombros[0],
          exerciseDatabase.triceps[0],
          exerciseDatabase.abdomen[0],
          exerciseDatabase.cardio[0],
          exerciseDatabase.cardio[3],
        ],
      },
      {
        label: "Treino B",
        muscleGroups: "Pull + Cardio",
        exercises: [
          exerciseDatabase.costas[0],
          exerciseDatabase.costas[1],
          exerciseDatabase.biceps[0],
          exerciseDatabase.abdomen[1],
          exerciseDatabase.cardio[1],
          exerciseDatabase.cardio[2],
        ],
      },
      {
        label: "Treino C",
        muscleGroups: "Pernas + Cardio",
        exercises: [
          exerciseDatabase.pernas[0],
          exerciseDatabase.pernas[1],
          exerciseDatabase.gluteos[0],
          exerciseDatabase.pernas[4],
          exerciseDatabase.abdomen[3],
          exerciseDatabase.cardio[0],
        ],
      },
    ],
  },
  {
    id: "funcional-abc",
    goalLabel: "Funcional",
    goal: "funcional",
    description: "Movimentos funcionais para o dia a dia",
    days: [
      {
        label: "Treino A",
        muscleGroups: "Corpo Inteiro",
        exercises: [
          exerciseDatabase.pernas[0],
          exerciseDatabase.peito[4],
          exerciseDatabase.costas[5],
          exerciseDatabase.abdomen[1],
          exerciseDatabase.pernas[5],
          exerciseDatabase.cardio[3],
        ],
      },
      {
        label: "Treino B",
        muscleGroups: "Forca + Estabilidade",
        exercises: [
          exerciseDatabase.pernas[6],
          exerciseDatabase.ombros[0],
          exerciseDatabase.costas[1],
          exerciseDatabase.gluteos[0],
          exerciseDatabase.abdomen[3],
          exerciseDatabase.abdomen[4],
        ],
      },
      {
        label: "Treino C",
        muscleGroups: "Potencia + Cardio",
        exercises: [
          exerciseDatabase.pernas[0],
          exerciseDatabase.peito[0],
          exerciseDatabase.costas[0],
          exerciseDatabase.triceps[3],
          exerciseDatabase.abdomen[2],
          exerciseDatabase.cardio[0],
        ],
      },
    ],
  },
  {
    id: "forca-abc",
    goalLabel: "Forca",
    goal: "forca",
    description: "Foco em cargas pesadas e ganho de forca maxima",
    days: [
      {
        label: "Treino A",
        muscleGroups: "Peito / Ombros",
        exercises: [
          exerciseDatabase.peito[0],
          exerciseDatabase.peito[1],
          exerciseDatabase.ombros[0],
          exerciseDatabase.ombros[1],
          exerciseDatabase.triceps[0],
          exerciseDatabase.triceps[2],
        ],
      },
      {
        label: "Treino B",
        muscleGroups: "Costas / Biceps",
        exercises: [
          exerciseDatabase.costas[0],
          exerciseDatabase.costas[1],
          exerciseDatabase.costas[4],
          exerciseDatabase.biceps[0],
          exerciseDatabase.biceps[3],
          exerciseDatabase.abdomen[0],
        ],
      },
      {
        label: "Treino C",
        muscleGroups: "Pernas",
        exercises: [
          exerciseDatabase.pernas[0],
          exerciseDatabase.pernas[1],
          exerciseDatabase.pernas[6],
          exerciseDatabase.pernas[2],
          exerciseDatabase.pernas[3],
          exerciseDatabase.pernas[4],
        ],
      },
    ],
  },
]

// TODO: REFACTOR - Os helpers de consulta assumem uma estrutura fixa do banco local, limitando a evolução para outras fontes de dados.
// Retorna todos os exercicios de uma categoria especifica.
export function getExercisesByCategory(category: ExerciseCategory): Exercise[] {
  return exerciseDatabase[category]
}

// Retorna uma lista unica com todos os exercicios cadastrados.
export function getAllExercises(): Exercise[] {
  return Object.values(exerciseDatabase).flat()
}

// Converte id tecnico de categoria para label amigavel de exibicao.
export function getCategoryLabel(category: ExerciseCategory): string {
  const labels: Record<ExerciseCategory, string> = {
    peito: "Peito",
    costas: "Costas",
    pernas: "Pernas",
    ombros: "Ombros",
    biceps: "Biceps",
    triceps: "Triceps",
    abdomen: "Abdomen",
    gluteos: "Gluteos",
    cardio: "Cardio",
  }
  return labels[category]
}

// Converte objetivo tecnico do plano para texto exibido ao usuario.
export function getGoalLabel(goal: GoalType): string {
  const labels: Record<GoalType, string> = {
    hipertrofia: "Hipertrofia",
    emagrecimento: "Emagrecimento",
    condicionamento: "Condicionamento",
    funcional: "Funcional",
    forca: "Forca",
  }
  return labels[goal]
}
