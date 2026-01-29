// Word lists for Cloud Functions (simplified - same data as client)
// Points: easy=10, normal=20, hard=25, insane=50

const WORD_LISTS = {
  easy: [
    "DOG", "CAR", "BOOK", "PHONE", "TREE", "CHAIR", "WATER", "HOUSE", "DOOR", "SHOE",
    "APPLE", "CLOCK", "BED", "SUN", "RAIN", "BABY", "BALL", "CAKE", "BIRD", "FISH",
    "MILK", "PIZZA", "MOVIE", "BEACH", "MONEY", "COMPUTER", "WINDOW", "COFFEE", "BANANA", "GUITAR",
    "TABLE", "LAMP", "SHIRT", "PANTS", "HAT", "SOCK", "KNIFE", "FORK", "SPOON", "PLATE",
    "CUP", "BOWL", "PEN", "PAPER", "KEY", "LOCK", "BAG", "BOX", "TRAIN", "BUS",
    "PLANE", "BOAT", "BIKE", "ROAD", "BRIDGE", "PARK", "STORE", "SCHOOL", "DOCTOR", "NURSE",
    "TEACHER", "POLICE", "FIRE", "SNOW", "CLOUD", "MOON", "STAR", "FLOWER", "GRASS", "ROCK",
    "SAND", "OCEAN", "RIVER", "LAKE", "MOUNTAIN", "CAT", "HORSE", "COW", "PIG", "CHICKEN",
    "EGG", "BREAD", "BUTTER", "CHEESE", "RICE", "SOUP", "SALAD", "FRUIT", "ORANGE", "GRAPE",
    "LEMON", "COOKIE", "CANDY", "ICE CREAM", "JUICE", "TEA", "SODA", "BOTTLE", "MIRROR", "TOWEL"
  ],
  normal: [
    "TELESCOPE", "VACATION", "HOSPITAL", "RAINBOW", "VOLCANO", "DINOSAUR", "ASTRONAUT", "SKELETON",
    "CHOCOLATE", "UMBRELLA", "BUTTERFLY", "FIREWORKS", "KANGAROO", "NIGHTMARE", "TREASURE", "WEDDING",
    "PASSPORT", "COMPASS", "SANDWICH", "ELEVATOR", "SKATEBOARD", "CELEBRITY", "HEADPHONES", "LIGHTHOUSE",
    "MARATHON", "BREAKFAST", "MAGICIAN", "SUNGLASSES", "EARTHQUAKE", "SUPERHERO", "WATERFALL", "CAMPFIRE",
    "BACKPACK", "SUBMARINE", "HELICOPTER", "PARACHUTE", "AQUARIUM", "PHARMACY", "LIBRARY", "MUSEUM",
    "STADIUM", "CASINO", "AIRPORT", "SUBWAY", "BALCONY", "BASEMENT", "CHIMNEY", "FOUNTAIN",
    "SCARECROW", "SNOWMAN", "PUMPKIN", "COSTUME", "TROPHY", "MEDAL", "DIPLOMA", "ENVELOPE",
    "MAILBOX", "BATTERY", "CHARGER", "KEYBOARD", "PRINTER", "CAMERA", "MICROPHONE", "SPEAKER",
    "REMOTE", "TOASTER", "BLENDER", "MICROWAVE", "DISHWASHER", "REFRIGERATOR", "STAIRCASE", "ESCALATOR",
    "WHEELCHAIR", "AMBULANCE", "DENTIST", "SURGERY", "BANDAGE", "THERMOMETER", "PRESCRIPTION", "INSURANCE"
  ],
  hard: [
    "MICROSCOPE", "ORCHESTRA", "ARCHITECTURE", "PHOTOSYNTHESIS", "CONSTELLATION", "DEMOCRACY", "VELOCITY",
    "ECOSYSTEM", "METAPHOR", "GRAVITY", "RENEWABLE", "PHILOSOPHY", "HYPOTHESIS", "PROPAGANDA", "BIODIVERSITY",
    "REVOLUTION", "CAPITALISM", "MEDITATION", "PERSPECTIVE", "IMMIGRATION", "CHROMOSOME", "INFLATION",
    "STEREOTYPE", "ALGORITHM", "NOSTALGIA", "DIPLOMACY", "PHENOMENON", "CIVILIZATION", "SUSTAINABILITY",
    "ENTREPRENEUR", "METABOLISM", "VACCINATION", "ANTIBIOTIC", "EVOLUTION", "EXTINCTION", "POLLUTION",
    "RECYCLING", "CONSERVATION", "ATMOSPHERE", "TEMPERATURE", "PRECIPITATION", "BAROMETER", "THERMODYNAMICS",
    "ELECTRICITY", "MAGNETISM", "RADIATION", "FREQUENCY", "WAVELENGTH", "QUANTUM", "MOLECULE",
    "COMPOUND", "CATALYST", "EQUATION", "VARIABLE", "PROBABILITY", "STATISTICS", "CORRELATION",
    "REGRESSION", "DEVIATION", "COGNITION", "PERCEPTION", "CONSCIOUSNESS", "INTUITION", "RATIONALITY",
    "IDEOLOGY", "SOVEREIGNTY", "JURISDICTION", "LEGISLATION", "CONSTITUTION", "AMENDMENT", "BUREAUCRACY"
  ],
  insane: [
    "CRYPTOCURRENCY", "PROCRASTINATION", "SYNCHRONICITY", "METAMORPHOSIS", "JUXTAPOSITION", "SERENDIPITY",
    "ONOMATOPOEIA", "AMBIGUOUS", "QUINTESSENTIAL", "PARADIGM", "EXISTENTIALISM", "PARADOX", "EPIPHANY",
    "RECIPROCITY", "UBIQUITOUS", "IDIOSYNCRASY", "PSEUDONYM", "SCHADENFREUDE", "ANTIDISESTABLISHMENTARIANISM",
    "DEFENESTRATION", "SYCOPHANT", "MAGNANIMOUS", "OBFUSCATE", "VERISIMILITUDE", "ANTHROPOMORPHISM",
    "SOLIPSISM", "DICHOTOMY", "ACQUIESCE", "INEFFABLE", "EPHEMERAL", "SURREPTITIOUS", "PERFUNCTORY",
    "RECALCITRANT", "PERSPICACIOUS", "PUSILLANIMOUS", "CIRCUMLOCUTION", "CONFLAGRATION", "AMALGAMATION",
    "TRANSMUTATION", "PRESTIDIGITATION", "LOQUACIOUS", "CACOPHONY", "MELLIFLUOUS", "SESQUIPEDALIAN",
    "OSTENTATIOUS", "SUPERCILIOUS", "PERNICIOUS", "NEBULOUS", "CAPRICIOUS", "VICARIOUS", "GRATUITOUS",
    "FORTUITOUS", "SUPERFLUOUS", "INCREDULOUS", "SANGUINE", "LUGUBRIOUS", "QUERULOUS", "GARRULOUS",
    "TREMULOUS", "SCRUPULOUS", "PENULTIMATE", "ANTEPENULTIMATE", "INFINITESIMAL", "EXPONENTIAL"
  ]
};

const POINTS = { easy: 10, normal: 20, hard: 25, insane: 50 };

const DIFFICULTY_DISTRIBUTIONS = {
  easy: { easy: 0.7, normal: 0.2, hard: 0.1, insane: 0 },
  normal: { easy: 0, normal: 0.7, hard: 0.3, insane: 0 },
  hard: { easy: 0.1, normal: 0.2, hard: 0.7, insane: 0 },
  insane: { easy: 0, normal: 0.2, hard: 0.2, insane: 0.6 },
  mixed: { easy: 0.25, normal: 0.25, hard: 0.25, insane: 0.25 },
};

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getWordsForDifficulty(difficulty, totalWords = 16) {
  const distribution = DIFFICULTY_DISTRIBUTIONS[difficulty] || DIFFICULTY_DISTRIBUTIONS.mixed;
  const selectedWords = [];

  const counts = {
    easy: Math.round(totalWords * distribution.easy),
    normal: Math.round(totalWords * distribution.normal),
    hard: Math.round(totalWords * distribution.hard),
    insane: Math.round(totalWords * distribution.insane),
  };

  // Adjust for rounding errors
  const totalCount = counts.easy + counts.normal + counts.hard + counts.insane;
  if (totalCount !== totalWords) {
    const categories = ['easy', 'normal', 'hard', 'insane'].filter(cat => counts[cat] > 0);
    if (categories.length > 0) {
      counts[categories[0]] += (totalWords - totalCount);
    }
  }

  // Select random words from each difficulty level
  for (const [level, count] of Object.entries(counts)) {
    if (count > 0 && WORD_LISTS[level]) {
      const shuffled = shuffleArray(WORD_LISTS[level]);
      for (let i = 0; i < count && i < shuffled.length; i++) {
        selectedWords.push({
          word: shuffled[i],
          points: POINTS[level],
          difficulty: level
        });
      }
    }
  }

  return shuffleArray(selectedWords);
}

module.exports = { WORD_LISTS, POINTS, getWordsForDifficulty };
