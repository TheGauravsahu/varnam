export const languages = [
  { id: 1, code: 'es', name: 'Spanish', flagEmoji: '🇪🇸', isActive: true },
  { id: 2, code: 'en', name: 'English', flagEmoji: '🇬🇧', isActive: true },
  { id: 3, code: 'hi', name: 'Hindi', flagEmoji: '🇮🇳', isActive: true },
  { id: 4, code: 'fr', name: 'French', flagEmoji: '🇫🇷', isActive: true },
  { id: 5, code: 'de', name: 'German', flagEmoji: '🇩🇪', isActive: true },
  { id: 6, code: 'ja', name: 'Japanese', flagEmoji: '🇯🇵', isActive: true },
  { id: 7, code: 'sa', name: 'Sanskrit', flagEmoji: '🔱', isActive: true }
];

export const units = [
  { id: 1, languageId: 1, number: 1, title: 'Introduction to Spanish', description: 'Learn basic greetings, introductions, and essential daily phrases.' },
  { id: 2, languageId: 1, number: 2, title: 'Conversational Basics', description: 'Talk about your background, family, foods, and make requests.' },
  // English Track (Unit 3)
  { id: 3, languageId: 2, number: 1, title: 'Foundation English', description: 'Master basic conversational greetings, self-introductions, and social etiquette.' },
  { id: 4, languageId: 2, number: 2, title: 'Intermediate Communication', description: 'Learn professional office communication, hobby discussion, and social planning.' }
];

export const chapters = [
  // Spanish Unit 1
  { id: 1, unitId: 1, number: 1, title: 'Greetings & Introductions', description: 'Learn to say hello, goodbye, and introduce yourself.' },
  { id: 2, unitId: 1, number: 2, title: 'Basic Expressions', description: 'Master polite words like thank you, please, and sorry.' },
  // Spanish Unit 2
  { id: 3, unitId: 2, number: 1, title: 'Food & Dining', description: 'Order food, name kitchen utensils, and describe meals.' },
  
  // English Chapters (Unit 3)
  { id: 4, unitId: 3, number: 1, title: 'Everyday Greetings', description: 'Say hello, ask how people are doing, and say goodbye in professional and casual settings.' },
  { id: 5, unitId: 3, number: 2, title: 'Social & Dining', description: 'Order food, talk to waiters, and have simple restaurant conversations.' },
  { id: 6, unitId: 3, number: 3, title: 'Travel & Directions', description: 'Ask for directions, navigate airports, hotels, and public transit.' },
  
  // English Chapters (Unit 4)
  { id: 7, unitId: 4, number: 1, title: 'Professional & Work English', description: 'Conduct introductions, coordinate meetings, and write business queries.' },
  { id: 8, unitId: 4, number: 2, title: 'Leisure & Hobbies', description: 'Chat about weekend projects, invite friends, and share hobbies.' }
];

export const lessons = [
  // Chapter 1 Greetings & Introductions (Spanish)
  { id: 1, chapterId: 1, number: 1, title: 'Saying Hello', xpReward: 10 },
  { id: 2, chapterId: 1, number: 2, title: 'Introducing Yourself', xpReward: 10 },
  // Chapter 2 Basic Expressions (Spanish)
  { id: 3, chapterId: 2, number: 1, title: 'Polite Phrases', xpReward: 15 },
  
  // English Lessons
  { id: 4, chapterId: 4, number: 1, title: 'Hello and Goodbye', xpReward: 10 },
  { id: 5, chapterId: 4, number: 2, title: 'How are you?', xpReward: 10 },
  { id: 6, chapterId: 5, number: 1, title: 'Ordering a Drink', xpReward: 15 },
  { id: 7, chapterId: 5, number: 2, title: 'Paying the Bill', xpReward: 15 },
  { id: 8, chapterId: 6, number: 1, title: 'Asking for Directions', xpReward: 20 },
  { id: 9, chapterId: 6, number: 2, title: 'At the Airport', xpReward: 20 },
  
  // New Intermediate English Lessons
  { id: 10, chapterId: 7, number: 1, title: 'Introducing Yourself at Work', xpReward: 20 },
  { id: 11, chapterId: 7, number: 2, title: 'Setting up a Meeting', xpReward: 20 },
  { id: 12, chapterId: 8, number: 1, title: 'Talking about Weekend Plans', xpReward: 25 },
  { id: 13, chapterId: 8, number: 2, title: 'Inviting Friends', xpReward: 25 }
];

export const exercises = [
  // Spanish Lesson 1
  {
    id: 1,
    lessonId: 1,
    type: 'multiple_choice',
    instruction: 'Translate this word',
    questionText: 'Hello',
    correctAnswer: 'Hola',
    choices: ['Hola', 'Adiós', 'Gracias', 'Por favor'],
    order: 1
  },
  {
    id: 2,
    lessonId: 1,
    type: 'true_false',
    instruction: 'Is this statement correct?',
    questionText: '"Adiós" means "Goodbye" in Spanish.',
    correctAnswer: 'true',
    choices: ['true', 'false'],
    order: 2
  },
  {
    id: 3,
    lessonId: 1,
    type: 'fill_blank',
    instruction: 'Fill in the blank to say "Good morning"',
    questionText: '______ days',
    correctAnswer: 'Buenos',
    choices: ['Buenos', 'Buenas', 'Hola'],
    order: 3
  },
  {
    id: 4,
    lessonId: 1,
    type: 'matching',
    instruction: 'Match the pairs correctly',
    questionText: 'Match words',
    correctAnswer: 'Hola:Hello|Adiós:Goodbye|Gracias:Thank you',
    choices: [
      { left: 'Hola', right: 'Goodbye' },
      { left: 'Adiós', right: 'Thank you' },
      { left: 'Gracias', right: 'Hello' }
    ],
    order: 4
  },

  // Spanish Lesson 2
  {
    id: 5,
    lessonId: 2,
    type: 'multiple_choice',
    instruction: 'Select the correct translation',
    questionText: 'How are you?',
    correctAnswer: '¿Cómo estás?',
    choices: ['¿Cómo estás?', 'Me llamo Juan', 'Mucho gusto', 'Buenas noches'],
    order: 1
  },
  {
    id: 6,
    lessonId: 2,
    type: 'fill_blank',
    instruction: 'Complete the self-introduction: "My name is..."',
    questionText: 'Me ______ Carlos',
    correctAnswer: 'llamo',
    choices: ['llamo', 'soy', 'estoy'],
    order: 2
  },
  {
    id: 7,
    lessonId: 2,
    type: 'multiple_choice',
    instruction: 'Translate: "Nice to meet you"',
    questionText: 'Nice to meet you',
    correctAnswer: 'Mucho gusto',
    choices: ['Hola', 'Mucho gusto', 'Adiós', 'De nada'],
    order: 3
  },

  // English Lesson 4: Hello and Goodbye (ES -> EN / EN -> EN)
  {
    id: 8,
    lessonId: 4,
    type: 'multiple_choice',
    instruction: 'Translate this greeting',
    questionText: 'Hello',
    correctAnswer: 'Hi',
    choices: ['Hi', 'Goodbye', 'Thanks', 'Please'],
    order: 1
  },
  {
    id: 9,
    lessonId: 4,
    type: 'true_false',
    instruction: 'True or False',
    questionText: '"Goodbye" is a formal way to say goodbye.',
    correctAnswer: 'true',
    choices: ['true', 'false'],
    order: 2
  },
  {
    id: 10,
    lessonId: 4,
    type: 'fill_blank',
    instruction: 'Fill in the blank to say "See you later"',
    questionText: 'See you ______',
    correctAnswer: 'later',
    choices: ['later', 'soon', 'tomorrow'],
    order: 3
  },
  {
    id: 11,
    lessonId: 4,
    type: 'matching',
    instruction: 'Match the greetings',
    questionText: 'Match words',
    correctAnswer: 'Hello:Hi|Goodbye:Bye|Morning:Good Morning',
    choices: [
      { left: 'Hello', right: 'Bye' },
      { left: 'Goodbye', right: 'Good Morning' },
      { left: 'Morning', right: 'Hi' }
    ],
    order: 4
  },

  // English Lesson 5: How are you?
  {
    id: 12,
    lessonId: 5,
    type: 'multiple_choice',
    instruction: 'Select the best response for: "How are you?"',
    questionText: 'How are you?',
    correctAnswer: 'I am doing well, thank you!',
    choices: ['I am doing well, thank you!', 'I live in London.', 'My name is Bob.', 'Goodbye.'],
    order: 1
  },
  {
    id: 13,
    lessonId: 5,
    type: 'fill_blank',
    instruction: 'Complete the statement: "I am fine"',
    questionText: 'I ______ fine, thanks.',
    correctAnswer: 'am',
    choices: ['am', 'are', 'is'],
    order: 2
  },
  {
    id: 14,
    lessonId: 5,
    type: 'true_false',
    instruction: 'Is this response polite?',
    questionText: 'Answering "I am fine, and you?" is standard conversational etiquette.',
    correctAnswer: 'true',
    choices: ['true', 'false'],
    order: 3
  },

  // English Lesson 6: Ordering a Drink
  {
    id: 15,
    lessonId: 6,
    type: 'multiple_choice',
    instruction: 'Translate this order',
    questionText: 'I would like a coffee, please.',
    correctAnswer: 'A coffee, please.',
    choices: ['A coffee, please.', 'A tea, please.', 'No coffee.', 'Where is coffee?'],
    order: 1
  },
  {
    id: 16,
    lessonId: 6,
    type: 'fill_blank',
    instruction: 'Complete the request',
    questionText: 'Could I ______ a glass of water?',
    correctAnswer: 'have',
    choices: ['have', 'get', 'want'],
    order: 2
  },
  {
    id: 17,
    lessonId: 6,
    type: 'matching',
    instruction: 'Match drinks',
    questionText: 'Match items',
    correctAnswer: 'Water:Water|Coffee:Coffee|Tea:Tea',
    choices: [
      { left: 'Water', right: 'Coffee' },
      { left: 'Coffee', right: 'Tea' },
      { left: 'Tea', right: 'Water' }
    ],
    order: 3
  },

  // English Lesson 7: Paying the Bill
  {
    id: 18,
    lessonId: 7,
    type: 'multiple_choice',
    instruction: 'Select the polite request to ask for the bill',
    questionText: 'Can we pay?',
    correctAnswer: 'Could we have the bill, please?',
    choices: ['Could we have the bill, please?', 'Give me bill!', 'Where is the food?', 'I want to leave.'],
    order: 1
  },
  {
    id: 19,
    lessonId: 7,
    type: 'fill_blank',
    instruction: 'Fill in the blank for payment method',
    questionText: 'Can I pay ______ credit card?',
    correctAnswer: 'by',
    choices: ['by', 'with', 'in'],
    order: 2
  },
  {
    id: 20,
    lessonId: 7,
    type: 'true_false',
    instruction: 'True or False',
    questionText: '"Check" is the American English word for restaurant bill.',
    correctAnswer: 'true',
    choices: ['true', 'false'],
    order: 3
  },

  // English Lesson 8: Asking for Directions
  {
    id: 21,
    lessonId: 8,
    type: 'multiple_choice',
    instruction: 'Translate the question',
    questionText: 'Where is the train station?',
    correctAnswer: 'Where is the train station?',
    choices: ['Where is the train station?', 'Where is the bathroom?', 'Where is the hotel?', 'Is this the station?'],
    order: 1
  },
  {
    id: 22,
    lessonId: 8,
    type: 'fill_blank',
    instruction: 'Complete the sentence for navigation direction',
    questionText: 'Go straight and then turn ______',
    correctAnswer: 'left',
    choices: ['left', 'right', 'here'],
    order: 2
  },
  {
    id: 23,
    lessonId: 8,
    type: 'matching',
    instruction: 'Match directions',
    questionText: 'Match items',
    correctAnswer: 'Left:Left|Right:Right|Straight:Straight',
    choices: [
      { left: 'Left', right: 'Right' },
      { left: 'Right', right: 'Straight' },
      { left: 'Straight', right: 'Left' }
    ],
    order: 3
  },

  // English Lesson 9: At the Airport
  {
    id: 24,
    lessonId: 9,
    type: 'multiple_choice',
    instruction: 'Answer this boarding agent question: "May I see your passport?"',
    questionText: 'May I see your passport?',
    correctAnswer: 'Here it is, sir.',
    choices: ['Here it is, sir.', 'Yes, I fly.', 'No, goodbye.', 'My seat is 2A.'],
    order: 1
  },
  {
    id: 25,
    lessonId: 9,
    type: 'fill_blank',
    instruction: 'Complete the boarding announcement',
    questionText: 'Please proceed to ______ 14',
    correctAnswer: 'gate',
    choices: ['gate', 'plane', 'terminal'],
    order: 2
  },
  {
    id: 26,
    lessonId: 9,
    type: 'true_false',
    instruction: 'True or False',
    questionText: '"Luggage" and "Baggage" mean the same thing at the airport check-in counter.',
    correctAnswer: 'true',
    choices: ['true', 'false'],
    order: 3
  },

  // English Lesson 10: Introducing Yourself at Work
  {
    id: 27,
    lessonId: 10,
    type: 'multiple_choice',
    instruction: 'Translate the work phrase',
    questionText: 'I work as a software developer.',
    correctAnswer: 'I work as a software developer.',
    choices: ['I work as a software developer.', 'I am studying math.', 'I like to play cards.', 'Where is the manager?'],
    order: 1
  },
  {
    id: 28,
    lessonId: 10,
    type: 'fill_blank',
    instruction: 'Fill in the blank to complete the office greeting',
    questionText: 'Nice to ______ you all.',
    correctAnswer: 'meet',
    choices: ['meet', 'see', 'joining'],
    order: 2
  },
  {
    id: 29,
    lessonId: 10,
    type: 'true_false',
    instruction: 'True or False',
    questionText: '"Resume" and "CV" refer to the same type of job application document.',
    correctAnswer: 'true',
    choices: ['true', 'false'],
    order: 3
  },

  // English Lesson 11: Setting up a Meeting
  {
    id: 30,
    lessonId: 11,
    type: 'multiple_choice',
    instruction: 'Translate the invitation',
    questionText: 'Are you free for a meeting tomorrow?',
    correctAnswer: 'Are you free for a meeting tomorrow?',
    choices: ['Are you free for a meeting tomorrow?', 'What is your schedule?', 'Do you have time next week?', 'I am busy today.'],
    order: 1
  },
  {
    id: 31,
    lessonId: 11,
    type: 'fill_blank',
    instruction: 'Fill in the blank to schedule an appointment',
    questionText: 'Let us coordinate a ______.',
    correctAnswer: 'call',
    choices: ['call', 'lunch', 'dinner'],
    order: 2
  },
  {
    id: 32,
    lessonId: 11,
    type: 'matching',
    instruction: 'Match calendar vocabulary',
    questionText: 'Match terms',
    correctAnswer: 'Calendar:Calendar|Meeting:Meeting|Schedule:Schedule',
    choices: [
      { left: 'Calendar', right: 'Meeting' },
      { left: 'Meeting', right: 'Schedule' },
      { left: 'Schedule', right: 'Calendar' }
    ],
    order: 3
  },

  // English Lesson 12: Talking about Weekend Plans
  {
    id: 33,
    lessonId: 12,
    type: 'multiple_choice',
    instruction: 'Translate the plan query',
    questionText: 'What are you doing this weekend?',
    correctAnswer: 'What are you doing this weekend?',
    choices: ['What are you doing this weekend?', 'Where do you go?', 'Who is coming over?', 'Is it cold outside?'],
    order: 1
  },
  {
    id: 34,
    lessonId: 12,
    type: 'fill_blank',
    instruction: 'Complete the statement',
    questionText: 'I am planning to ______ a new book.',
    correctAnswer: 'read',
    choices: ['read', 'write', 'watch'],
    order: 2
  },

  // English Lesson 13: Inviting Friends
  {
    id: 35,
    lessonId: 13,
    type: 'multiple_choice',
    instruction: 'Select the polite invitation',
    questionText: 'Would you like to join us for coffee?',
    correctAnswer: 'Would you like to join us for coffee?',
    choices: ['Would you like to join us for coffee?', 'Give me coffee!', 'Do you like tea?', 'Let us go.'],
    order: 1
  },
  {
    id: 36,
    lessonId: 13,
    type: 'fill_blank',
    instruction: 'Complete the response',
    questionText: 'That sounds ______! I will be there.',
    correctAnswer: 'wonderful',
    choices: ['wonderful', 'bad', 'hard'],
    order: 2
  }
];

export const achievements = [
  { id: 1, code: 'first_lesson', title: 'First Step', description: 'Completed your very first lesson!', icon: 'milestone', xpReward: 50, coinReward: 20 },
  { id: 2, code: 'streak_3', title: 'Consistent Learner', description: 'Maintained a 3-day streak.', icon: 'zap', xpReward: 100, coinReward: 50 },
  { id: 3, code: 'streak_7', title: 'Unstoppable', description: 'Maintained a 7-day streak.', icon: 'flame', xpReward: 250, coinReward: 100 },
  { id: 4, code: 'polyglot', title: 'Polyglot', description: 'Learn two or more languages at once.', icon: 'languages', xpReward: 150, coinReward: 50 },
  { id: 5, code: 'perfect_lesson', title: 'Flawless', description: 'Finished a lesson with a perfect score.', icon: 'star', xpReward: 50, coinReward: 20 }
];
