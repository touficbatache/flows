// /* eslint-disable @typescript-eslint/no-explicit-any */
// import fs from "fs";
// import path from "path";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// async function main() {
//   const filePath = path.resolve(path.resolve(), "zapier_all_combined.json");
//   const raw = fs.readFileSync(filePath, "utf-8");
//   const items = JSON.parse(raw) as unknown as Record<string, unknown>[];

//   const rows = items
//     .map((rec) => {
//       const slug = rec["slug"];
//       if (!slug) return null;

//       const name = String(rec["name"] ?? "").trim();
//       if (!name) return null;

//       const description = rec["description"]
//         ? String(rec["description"])
//         : null;
//       const externalUrl = rec["externalUrl"]
//         ? String(rec["externalUrl"])
//         : null;
//       let color = String(rec["primaryColor"] ?? "").trim();
//       if (color && !color.startsWith("#") && !color.startsWith("hsl"))
//         color = `#${color}`;
//       const logo = (rec["logo"] as Record<string, unknown>) || undefined;
//       const image = logo?.["mainUrl"] ? String(logo["mainUrl"]) : null;

//       return {
//         id: String(slug),
//         name,
//         description,
//         externalUrl,
//         color,
//         image,
//         assetType: image ? "image" : null,
//         isCustom: false,
//       };
//     })
//     .filter(Boolean) as Array<{
//     id: string;
//     name: string;
//     description: string | null;
//     externalUrl: string | null;
//     color: string;
//     image: string | null;
//     assetType: string | null;
//     isCustom: boolean;
//   }>;

//   const result = await prisma.nodeStyle.createMany({
//     data: rows,
//     skipDuplicates: true, // ignores if id already exists
//   });
//   console.log(`Inserted ${result.count} new rows`);
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const filePath = path.resolve(path.resolve(), "zapier_all_combined.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const items = JSON.parse(raw) as unknown as Record<string, unknown>[];

  const rows = items
    .map((rec) => {
      const slug = rec["slug"];
      if (!slug) return null;

      const name = String(rec["name"] ?? "").trim();
      if (!name) return null;

      const description = rec["description"]
        ? String(rec["description"])
        : null;
      const externalUrl = rec["externalUrl"]
        ? String(rec["externalUrl"])
        : null;
      let color = String(rec["primaryColor"] ?? "").trim();
      if (color && !color.startsWith("#") && !color.startsWith("hsl"))
        color = `#${color}`;
      const logo = (rec["logo"] as Record<string, unknown>) || undefined;
      const image = logo?.["mainUrl"] ? String(logo["mainUrl"]) : null;

      return {
        id: String(slug),
        name,
        description,
        externalUrl,
        color,
        image,
        assetType: image ? "image" : null,
        isCustom: false,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    description: string | null;
    externalUrl: string | null;
    color: string;
    image: string | null;
    assetType: string | null;
    isCustom: boolean;
  }>;

  const result = await prisma.nodeStyle.createMany({
    data: rows,
    skipDuplicates: true,
  });

  console.log(`Inserted ${result.count} new rows`);

  // Clone zapier_chrome_extension → zapier
  const existing = await prisma.nodeStyle.findUnique({
    where: { id: "zapier-chrome-extension" },
  });

  if (!existing) {
    console.error("Could not find nodeStyle with id 'zapier_chrome_extension'");
  } else {
    await prisma.nodeStyle.upsert({
      where: { id: "zapier" },
      update: {},
      create: {
        ...existing,
        id: "zapier",
        name: "Zapier",
        description:
          "Zapier is where innovators put AI to work. Connect AI directly to your workflows, build your own agents, and actually deliver on your AI strategy.",
        externalUrl: "https://zapier.com/",
      },
    });
    console.log("Created cloned nodeStyle with id 'zapier'");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
