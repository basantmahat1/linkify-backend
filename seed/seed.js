import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import User from "../src/models/User.js";
import Page from "../src/models/Page.js";
import Link from "../src/models/Link.js";
import Report from "../src/models/Report.js";
import BlockedDomain from "../src/models/BlockedDomain.js";
import { seedThemes } from "./seedThemes.js";

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected. Seeding...");

  await Promise.all([
    User.deleteMany({}),
    Page.deleteMany({}),
    Link.deleteMany({}),
    Report.deleteMany({}),
    BlockedDomain.deleteMany({}),
  ]);

  const admin = await User.create({ name: "Admin", email: "admin@linkbio.dev", password: "Admin@12345", role: "admin", plan: "business", isEmailVerified: true });
  const demoUser = await User.create({ name: "Basant Mahat", email: "basant@linkbio.dev", password: "Demo@12345", plan: "pro", isEmailVerified: true });

  await Page.create({ owner: admin._id, username: "admin" });

  const page = await Page.create({
    owner: demoUser._id,
    username: "basant",
    displayName: "Basant Mahat",
    bio: "Web Developer & AI Builder",
    theme: {
      background: { type: "solid", value: "#FBEFE4" },
      buttonStyle: "rounded",
      colors: { text: "#2F2A26", button: "#E8734A", buttonText: "#FFFFFF" },
      layout: "classic",
    },
  });

  await Link.insertMany([
    { page: page._id, title: "My Portfolio", url: "https://example.com/portfolio", order: 0 },
    { page: page._id, title: "YouTube Channel", url: "https://youtube.com", order: 1 },
    { page: page._id, title: "Instagram", url: "https://instagram.com", order: 2 },
  ]);

  await Report.create({
    page: page._id,
    reason: "spam",
    details: "Seed sample report for admin panel demo",
    reporterEmail: "visitor@example.com",
  });
  await Page.updateOne({ _id: page._id }, { $inc: { reportCount: 1 } });

  await BlockedDomain.create({ domain: "spammy-example.com", reason: "Seed sample blocked domain" });

  console.log("Seeding starter themes...");
  await seedThemes({ closeConnection: false });

  console.log("Seed complete:");
  console.log("  Admin login -> admin@linkbio.dev / Admin@12345");
  console.log("  Demo login  -> basant@linkbio.dev / Demo@12345");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
