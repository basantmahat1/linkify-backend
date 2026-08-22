import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import User from "../src/models/User.js";
import Theme from "../src/models/Theme.js";
import { validateForPublish } from "../src/utils/themeSchema.js";
import { THEME_DEFINITIONS } from "./themeDefinitions.js";

export async function seedThemes({ closeConnection = true } = {}) {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.mongoUri);
  }

  let admin = await User.findOne({ role: "admin" });
  if (!admin) {
    admin = await User.create({ name: "Admin", email: "admin@linkbio.dev", password: "Admin@12345", role: "admin", plan: "business" });
  }

  for (const def of THEME_DEFINITIONS) {
    const { valid, errors } = validateForPublish(def.config);
    if (!valid) {
      console.error(`Skipping "${def.name}" — failed publish validation:`, errors);
      continue;
    }
    await Theme.findOneAndUpdate(
      { slug: def.slug },
      {
        name: def.name,
        slug: def.slug,
        description: def.description,
        category: def.category,
        thumbnail: def.thumbnail,
        status: "published",
        config: def.config,
        publishedConfig: def.config,
        $inc: { version: 0 },
        publishedAt: new Date(),
        createdBy: admin._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).then(async (doc) => {
      if (doc.version === 0) {
        doc.version = 1;
        await doc.save();
      }
    });
    console.log(`  ✓ ${def.name}`);
  }

  console.log(`Seeded ${THEME_DEFINITIONS.length} starter themes.`);
  if (closeConnection) await mongoose.disconnect();
}

// Allow running directly: `node seed/seedThemes.js`
const isMain = process.argv[1] && process.argv[1].endsWith("seedThemes.js");
if (isMain) {
  seedThemes()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
