export const QUESTION_PRESETS = {
  Ukrainian: {
    chips: [
      "Розкажіть про себе",
      "Чому вас цікавить ця роль?",
      "Опишіть складний виклик, який ви вирішили",
      "Приклад роботи зі стейкхолдерами",
      "Які метрики ви покращили?"
    ],
    preset: [
      "Розкажіть про себе",
      "Чому вас цікавить ця роль?",
      "Опишіть складний виклик, який ви вирішили",
      "Приклад роботи зі стейкхолдерами",
      "Які метрики ви покращили?"
    ]
  },
  English: {
    chips: [
      "Tell me about yourself",
      "Why are you interested in this role?",
      "Describe a challenging problem you solved",
      "Share an example of stakeholder management",
      "What metrics did you improve?"
    ],
    preset: [
      "Tell me about yourself",
      "Why are you interested in this role?",
      "Describe a challenging problem you solved",
      "Share an example of stakeholder management",
      "What metrics did you improve?"
    ]
  },
  German: {
    chips: [
      "Erzählen Sie etwas über sich",
      "Warum interessiert Sie diese Rolle?",
      "Beschreiben Sie eine schwierige Herausforderung",
      "Beispiel für Stakeholder-Management",
      "Welche Kennzahlen haben Sie verbessert?"
    ],
    preset: [
      "Erzählen Sie etwas über sich",
      "Warum interessiert Sie diese Rolle?",
      "Beschreiben Sie eine schwierige Herausforderung",
      "Beispiel für Stakeholder-Management",
      "Welche Kennzahlen haben Sie verbessert?"
    ]
  },
  Spanish: {
    chips: [
      "Háblame de ti",
      "¿Por qué te interesa este puesto?",
      "Describe un reto difícil que resolviste",
      "Ejemplo de gestión de stakeholders",
      "¿Qué métricas mejoraste?"
    ],
    preset: [
      "Háblame de ti",
      "¿Por qué te interesa este puesto?",
      "Describe un reto difícil que resolviste",
      "Ejemplo de gestión de stakeholders",
      "¿Qué métricas mejoraste?"
    ]
  },
  Portuguese: {
    chips: [
      "Fale sobre você",
      "Por que você se interessa por esta função?",
      "Descreva um desafio que você resolveu",
      "Exemplo de gestão de stakeholders",
      "Quais métricas você melhorou?"
    ],
    preset: [
      "Fale sobre você",
      "Por que você se interessa por esta função?",
      "Descreva um desafio que você resolveu",
      "Exemplo de gestão de stakeholders",
      "Quais métricas você melhorou?"
    ]
  },
  French: {
    chips: [
      "Parlez-moi de vous",
      "Pourquoi ce poste vous intéresse-t-il ?",
      "Décrivez un défi difficile que vous avez résolu",
      "Exemple de gestion des parties prenantes",
      "Quelles métriques avez-vous améliorées ?"
    ],
    preset: [
      "Parlez-moi de vous",
      "Pourquoi ce poste vous intéresse-t-il ?",
      "Décrivez un défi difficile que vous avez résolu",
      "Exemple de gestion des parties prenantes",
      "Quelles métriques avez-vous améliorées ?"
    ]
  },
  Arabic: {
    chips: [
      "عرّفنا عن نفسك",
      "لماذا تهتم بهذه الوظيفة؟",
      "صف تحديًا صعبًا قمت بحله",
      "مثال على إدارة أصحاب المصلحة",
      "ما المؤشرات التي حسّنتها؟"
    ],
    preset: [
      "عرّفنا عن نفسك",
      "لماذا تهتم بهذه الوظيفة؟",
      "صف تحديًا صعبًا قمت بحله",
      "مثال على إدارة أصحاب المصلحة",
      "ما المؤشرات التي حسّنتها؟"
    ]
  },
  Turkish: {
    chips: [
      "Kendinizden bahseder misiniz?",
      "Bu role neden ilgi duyuyorsunuz?",
      "Çözdüğünüz zor bir problemi anlatın",
      "Paydaş yönetimine bir örnek",
      "Hangi metrikleri iyileştirdiniz?"
    ],
    preset: [
      "Kendinizden bahseder misiniz?",
      "Bu role neden ilgi duyuyorsunuz?",
      "Çözdüğünüz zor bir problemi anlatın",
      "Paydaş yönetimine bir örnek",
      "Hangi metrikleri iyileştirdiniz?"
    ]
  },
  Russian: {
    chips: [
      "Расскажите о себе",
      "Почему вас интересует эта роль?",
      "Опишите сложную задачу, которую вы решили",
      "Пример работы со стейкхолдерами",
      "Какие метрики вы улучшили?"
    ],
    preset: [
      "Расскажите о себе",
      "Почему вас интересует эта роль?",
      "Опишите сложную задачу, которую вы решили",
      "Пример работы со стейкхолдерами",
      "Какие метрики вы улучшили?"
    ]
  }
} as const;

export const DEFAULT_LANGUAGE = "English" as const;

export type QuestionPresetLanguage = keyof typeof QUESTION_PRESETS;
