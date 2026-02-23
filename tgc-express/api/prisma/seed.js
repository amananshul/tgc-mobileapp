const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SEED_TRIBES = [
  {
    name: "Tech Creators",
    slug: "tech-creators",
    emoji: "🚀",
    category: "tech",
    description: "Builders, coders, and tech enthusiasts pushing boundaries.",
  },
  {
    name: "Music Lovers",
    slug: "music-lovers",
    emoji: "🎵",
    category: "music",
    description: "DJs, producers, and music fans vibing together.",
  },
  {
    name: "Startup Hub",
    slug: "startup-hub",
    emoji: "💡",
    category: "business",
    description: "Founders and hustlers building the next big thing.",
  },
  {
    name: "Fitness Tribe",
    slug: "fitness-tribe",
    emoji: "💪",
    category: "fitness",
    description: "Athletes and wellness seekers crushing goals together.",
  },
  {
    name: "Art Collective",
    slug: "art-collective",
    emoji: "🎨",
    category: "art",
    description: "Creatives expressing through visual arts and design.",
  },
  {
    name: "Foodies United",
    slug: "foodies-united",
    emoji: "🍜",
    category: "food",
    description: "Food lovers exploring cuisines and culinary adventures.",
  },
];

async function main() {
  for (const tribe of SEED_TRIBES) {
    await prisma.tribe.upsert({
      where: { slug: tribe.slug },
      update: {},
      create: {
        ...tribe,
        visibility: "PUBLIC",
        memberCount: 0,
        createdById: null,
      },
    });
  }
  console.log("Seed completed: 6 tribes created");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
