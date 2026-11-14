import "dotenv/config";
import http from "http";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const defaultStyles = [
  {
    id: "trigger",
    name: "Trigger",
    icon: "⚡",
    color: "#ef4343",
    assetType: "emoji",
  },
  {
    id: "agent",
    name: "AI Agent",
    icon: "🤖",
    color: "#11a4d4",
    assetType: "emoji",
  },
  {
    id: "condition",
    name: "Condition",
    icon: "🔀",
    color: "hsl(142, 71%, 45%)",
    assetType: "emoji",
  },
  {
    id: "action",
    name: "Action",
    icon: "🎯",
    color: "#7c3bed",
    assetType: "emoji",
  },
  {
    id: "database",
    name: "Database",
    icon: "💾",
    color: "#667085",
    assetType: "emoji",
  },
  { id: "api", name: "API", icon: "🔌", color: "#f97015", assetType: "emoji" },
];

const FALLBACK_STYLE_ID =
  defaultStyles.find((style) => style.id === "action")?.id ??
  defaultStyles[0]?.id ??
  "trigger";
const FLOWCHART_JSON_STRUCTURE = `{
  "title": "Clear, descriptive name for the flowchart",
  "nodes": [
    {
      "id": "kebab-case-identifier",
      "label": "Short step name",
      "description": "Helpful instructions for this step",
      "styleId": "kebab-case-app-name-or-step-type"
    }
  ],
  "edges": [
    { "source": "node-id", "target": "node-id" }
  ]
}`;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const stripCodeFences = (content = "") => {
  const trimmed = content.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?/, "")
    .replace(/```$/, "")
    .trim();
};

const normalizeNodeId = (value, fallback) => {
  if (typeof value === "string" && value.trim().length > 0) {
    return (
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || fallback
    );
  }
  return fallback;
};

const buildFlowchartFromAi = (raw) => {
  console.log("Raw AI flowchart data:", raw);
  const title =
    typeof raw?.title === "string" && raw.title.trim().length > 0
      ? raw.title.trim()
      : "AI Generated Flowchart";

  const rawNodes = Array.isArray(raw?.nodes)
    ? raw.nodes
    : Array.isArray(raw?.steps)
    ? raw.steps
    : [];

  const ensuredNodes =
    rawNodes.length > 0
      ? rawNodes
      : [
          {
            label: "Define the goal",
            description: "Clarify what this flowchart should achieve.",
            styleId: "trigger",
          },
        ];

  const seenIds = new Set();
  const normalizedNodes = ensuredNodes.map((node, index) => {
    const baseId = normalizeNodeId(node?.id || node?.slug, `step-${index + 1}`);
    let candidateId = baseId;
    let suffix = 1;
    while (seenIds.has(candidateId)) {
      candidateId = `${baseId}-${suffix++}`;
    }
    seenIds.add(candidateId);

    const label =
      typeof node?.label === "string" && node.label.trim().length > 0
        ? node.label.trim()
        : typeof node?.name === "string" && node.name.trim().length > 0
        ? node.name.trim()
        : `Step ${index + 1}`;

    const description =
      typeof node?.description === "string"
        ? node.description.trim()
        : typeof node?.summary === "string"
        ? node.summary.trim()
        : "";

    const suggestedStyle =
      typeof node?.styleId === "string" && node.styleId.trim().length > 0
        ? node.styleId.trim()
        : typeof node?.type === "string" && node.type.trim().length > 0
        ? node.type.trim()
        : undefined;

    const styleId =
      typeof suggestedStyle === "string" && suggestedStyle.trim().length > 0
        ? suggestedStyle.trim()
        : FALLBACK_STYLE_ID;

    return {
      id: candidateId,
      label,
      description,
      styleId,
    };
  });

  const positionedNodes = normalizedNodes.map((node, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    return {
      id: node.id,
      type: "custom",
      position: {
        x: 120 + column * 280,
        y: 80 + row * 180,
      },
      data: {
        label: node.label,
        description: node.description,
        styleId: node.styleId,
      },
    };
  });

  const rawEdges = Array.isArray(raw?.edges)
    ? raw.edges
    : Array.isArray(raw?.connections)
    ? raw.connections
    : [];
  const nodeIds = new Set(positionedNodes.map((node) => node.id));
  const normalizedEdges = rawEdges
    .map((edge) => {
      const source =
        typeof edge?.source === "string"
          ? edge.source
          : typeof edge?.from === "string"
          ? edge.from
          : undefined;
      const target =
        typeof edge?.target === "string"
          ? edge.target
          : typeof edge?.to === "string"
          ? edge.to
          : undefined;
      if (!source || !target) {
        return null;
      }
      if (!nodeIds.has(source) || !nodeIds.has(target)) {
        return null;
      }
      return { source, target };
    })
    .filter(Boolean);

  const ensuredEdges =
    normalizedEdges.length > 0
      ? normalizedEdges
      : positionedNodes.length > 1
      ? positionedNodes.slice(0, -1).map((node, index) => ({
          source: node.id,
          target: positionedNodes[index + 1].id,
        }))
      : [];

  const edges = ensuredEdges.map((edge, index) => ({
    id: `edge-${index + 1}`,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
  }));

  return { title, nodes: positionedNodes, edges };
};

const generateFlowchartWithAi = async (prompt) => {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const bodyJson = {
    model: OPENAI_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You are an expert technical writer who designs automation flowcharts.",
          "Always respond with valid JSON only. Do not include explanations or markdown fences.",
          "Follow this JSON structure exactly:",
          FLOWCHART_JSON_STRUCTURE,
          "Specify the styleId for each node using kebab-case identifiers of the app's name or the type of step if no app (e.g., trigger, action, condition, agent, database, api).",
          "Edges must reference node IDs that exist.",
        ].join(" "),
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(bodyJson),
  });

  console.log(bodyJson);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const payload = await response.json();
  console.log("OpenAI response:", payload);
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response missing content");
  }

  const rawJson = stripCodeFences(content);
  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch (error) {
    throw new Error("Failed to parse OpenAI response");
  }

  return buildFlowchartFromAi(parsed);
};

const parseJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e7) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(data);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { "Content-Type": "application/json", ...headers });
  res.end(JSON.stringify(payload));
};

const sendNoContent = (res) => {
  res.writeHead(204, headers);
  res.end();
};

const sendError = (res, statusCode, message) => {
  sendJson(res, statusCode, { error: message });
};

const ensureDefaultStyles = async () => {
  await Promise.all(
    defaultStyles.map((style) =>
      prisma.nodeStyle.upsert({
        where: { id: style.id },
        update: {
          name: style.name,
          color: style.color,
          icon: style.icon,
          image: style.image ?? null,
          assetType: style.assetType ?? null,
          isCustom: false,
        },
        create: {
          ...style,
          image: style.image ?? null,
          assetType: style.assetType ?? null,
          isCustom: false,
        },
      })
    )
  );
};

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
};

const getAllFlowchartVersions = async () => {
  const versions = await prisma.flowchartVersion.findMany({
    orderBy: [{ flowchartId: "asc" }, { version: "asc" }],
  });
  return versions.map((version) => ({
    id: version.flowchartId,
    version: version.version,
    title: version.title,
    nodes: version.nodes,
    edges: version.edges,
    styles: version.styles,
    createdAt: version.createdAt.toISOString(),
  }));
};

const getFlowchartVersionsById = async (flowchartId) => {
  const versions = await prisma.flowchartVersion.findMany({
    where: { flowchartId },
    orderBy: { version: "desc" },
  });
  return versions.map((version) => ({
    id: version.flowchartId,
    version: version.version,
    title: version.title,
    nodes: version.nodes,
    edges: version.edges,
    styles: version.styles,
    createdAt: version.createdAt.toISOString(),
  }));
};

const getFlowchartVersion = async (flowchartId, versionNumber) => {
  const version = await prisma.flowchartVersion.findUnique({
    where: {
      flowchartId_version: {
        flowchartId,
        version: versionNumber,
      },
    },
  });

  if (!version) {
    return null;
  }

  return {
    id: version.flowchartId,
    version: version.version,
    title: version.title,
    nodes: version.nodes,
    edges: version.edges,
    styles: version.styles,
    createdAt: version.createdAt.toISOString(),
  };
};

const getLatestVersionNumber = async (flowchartId) => {
  const latest = await prisma.flowchartVersion.findFirst({
    where: { flowchartId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return latest?.version ?? 0;
};

const createFlowchart = async (title) => {
  const baseTitle = title?.trim();
  const created = await prisma.flowchart.create({
    data: {
      title: baseTitle || "Untitled Flowchart",
    },
  });

  const computedTitle = baseTitle || `Flowchart #${created.id}`;

  if (computedTitle !== created.title) {
    await prisma.flowchart.update({
      where: { id: created.id },
      data: { title: computedTitle },
    });
  }

  return { id: created.id, version: 1, title: computedTitle };
};

const createFlowchartVersion = async (flowchartId, payload) => {
  const { title, nodes = [], edges = [], styles = [] } = payload || {};
  const latestVersion = await getLatestVersionNumber(flowchartId);
  const nextVersion = latestVersion + 1;

  const versionRecord = await prisma.flowchartVersion.create({
    data: {
      flowchartId,
      version: nextVersion,
      title: title?.trim() || `Flowchart #${flowchartId}`,
      nodes,
      edges,
      styles,
    },
  });

  if (title?.trim()) {
    await prisma.flowchart.update({
      where: { id: flowchartId },
      data: { title: title.trim() },
    });
  }

  return {
    id: flowchartId,
    version: versionRecord.version,
    createdAt: versionRecord.createdAt.toISOString(),
  };
};

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments[0] !== "api") {
    sendError(res, 404, "Not found");
    return;
  }

  try {
    if (segments.length === 1 && req.method === "GET") {
      sendJson(res, 200, { status: "ok" });
      return;
    }

    if (
      segments.length === 3 &&
      segments[1] === "ai" &&
      segments[2] === "flowchart" &&
      req.method === "POST"
    ) {
      const body = await parseJsonBody(req);
      const prompt = body?.prompt?.trim();
      if (!prompt) {
        sendError(res, 400, "Prompt is required");
        return;
      }

      try {
        const generated = await generateFlowchartWithAi(prompt);
        sendJson(res, 200, generated);
      } catch (error) {
        console.error("AI generation failed:", error);
        sendError(
          res,
          500,
          error instanceof Error
            ? error.message
            : "Failed to generate flowchart"
        );
      }
      return;
    }

    if (segments[1] === "styles") {
      if (
        segments.length === 3 &&
        segments[2] === "recent" &&
        req.method === "GET"
      ) {
        const recents = await prisma.recentlyUsedStyle.findMany({
          orderBy: { lastUsedAt: "desc" },
          include: { style: true },
        });
        const payload = recents
          .map((entry) =>
            entry.style
              ? {
                  ...entry.style,
                  lastUsedAt: entry.lastUsedAt.toISOString(),
                }
              : null
          )
          .filter(Boolean);
        sendJson(res, 200, payload);
        return;
      }

      if (req.method === "GET" && segments.length === 2) {
        const query = url.searchParams.get("q")?.trim();
        const effectiveQuery = query && query.length >= 2 ? query : null;
        const styles = await prisma.nodeStyle.findMany({
          where: effectiveQuery
            ? {
                OR: [
                  { name: { contains: effectiveQuery, mode: "insensitive" } },
                ],
              }
            : undefined,
          orderBy: { name: "asc" },
        });
        sendJson(res, 200, styles);
        return;
      }

      if (req.method === "POST" && segments.length === 2) {
        const body = await parseJsonBody(req);
        const id = body.id?.trim() || randomUUID();
        const created = await prisma.nodeStyle.create({
          data: {
            id,
            name: body.name ?? "Unnamed Style",
            color: body.color ?? "#3b82f6",
            icon: body.icon ?? null,
            image: body.image ?? null,
            imageName: body.imageName ?? null,
            assetType: body.assetType ?? null,
            isCustom: true,
            description: body.description ?? null,
            externalUrl: body.externalUrl ?? null,
          },
        });
        sendJson(res, 201, created);
        return;
      }

      if (segments.length >= 3) {
        const styleId = segments[2];

        if (segments.length === 4 && segments[3] === "recent") {
          if (req.method === "POST") {
            const style = await prisma.nodeStyle.findUnique({
              where: { id: styleId },
            });
            if (!style) {
              sendError(res, 404, "Style not found");
              return;
            }

            const recent = await prisma.recentlyUsedStyle.upsert({
              where: { styleId },
              update: { lastUsedAt: new Date() },
              create: { styleId },
            });

            sendJson(res, 200, {
              ...style,
              lastUsedAt: recent.lastUsedAt.toISOString(),
            });
            return;
          }

          if (req.method === "DELETE") {
            try {
              await prisma.recentlyUsedStyle.delete({ where: { styleId } });
            } catch (error) {
              if (error?.code !== "P2025") {
                throw error;
              }
            }
            sendNoContent(res);
            return;
          }
        }

        if (segments.length === 3 && req.method === "GET") {
          const style = await prisma.nodeStyle.findUnique({
            where: { id: styleId },
          });
          if (!style) {
            sendError(res, 404, "Style not found");
            return;
          }
          sendJson(res, 200, style);
          return;
        }

        if (segments.length === 3 && req.method === "PUT") {
          const body = await parseJsonBody(req);
          const existing = await prisma.nodeStyle.findUnique({
            where: { id: styleId },
          });
          if (!existing) {
            sendError(res, 404, "Style not found");
            return;
          }

          if (!existing.isCustom) {
            sendError(res, 400, "Default styles cannot be edited");
            return;
          }

          const updateData = {
            name: body.name ?? existing.name,
            color: body.color ?? existing.color,
          };

          if ("icon" in body) updateData.icon = body.icon ?? null;
          if ("image" in body) updateData.image = body.image ?? null;
          if ("imageName" in body)
            updateData.imageName = body.imageName ?? null;
          if ("assetType" in body)
            updateData.assetType = body.assetType ?? null;
          if ("description" in body)
            updateData.description = body.description ?? null;
          if ("externalUrl" in body)
            updateData.externalUrl = body.externalUrl ?? null;

          const updated = await prisma.nodeStyle.update({
            where: { id: styleId },
            data: updateData,
          });
          sendJson(res, 200, updated);
          return;
        }

        if (segments.length === 3 && req.method === "DELETE") {
          const existing = await prisma.nodeStyle.findUnique({
            where: { id: styleId },
            select: { isCustom: true },
          });
          if (!existing) {
            sendError(res, 404, "Style not found");
            return;
          }

          if (!existing.isCustom) {
            sendError(res, 400, "Default styles cannot be deleted");
            return;
          }

          await prisma.recentlyUsedStyle
            .delete({ where: { styleId } })
            .catch((error) => {
              if (error?.code !== "P2025") {
                throw error;
              }
            });
          await prisma.nodeStyle.delete({ where: { id: styleId } });
          sendNoContent(res);
          return;
        }
      }
    }

    if (segments[1] === "flowcharts") {
      if (req.method === "GET" && segments.length === 2) {
        const flowcharts = await getAllFlowchartVersions();
        sendJson(res, 200, flowcharts);
        return;
      }

      if (req.method === "POST" && segments.length === 2) {
        const body = await parseJsonBody(req);
        const result = await createFlowchart(body.title);
        sendJson(res, 201, result);
        return;
      }

      if (segments.length >= 3) {
        const flowchartId = parseId(segments[2]);
        if (flowchartId === null) {
          sendError(res, 400, "Invalid flowchart id");
          return;
        }

        if (req.method === "DELETE" && segments.length === 3) {
          await prisma.flowchart.delete({ where: { id: flowchartId } });
          sendNoContent(res);
          return;
        }

        if (
          req.method === "GET" &&
          segments.length === 4 &&
          segments[3] === "latest"
        ) {
          const version = await getLatestVersionNumber(flowchartId);
          sendJson(res, 200, { version });
          return;
        }

        if (segments.length === 4 && segments[3] === "versions") {
          if (req.method === "GET") {
            const versions = await getFlowchartVersionsById(flowchartId);
            sendJson(res, 200, versions);
            return;
          }

          if (req.method === "POST") {
            const body = await parseJsonBody(req);
            const created = await createFlowchartVersion(flowchartId, body);
            sendJson(res, 201, created);
            return;
          }
        }

        if (
          segments.length === 5 &&
          segments[3] === "versions" &&
          req.method === "GET"
        ) {
          const versionNumber = parseId(segments[4]);
          if (versionNumber === null) {
            sendError(res, 400, "Invalid version");
            return;
          }

          const result = await getFlowchartVersion(flowchartId, versionNumber);
          if (!result) {
            sendError(res, 404, "Flowchart version not found");
            return;
          }

          sendJson(res, 200, result);
          return;
        }
      }
    }

    sendError(res, 404, "Not found");
  } catch (error) {
    console.error("API error:", error);
    sendError(res, 500, "Internal server error");
  }
});

const start = async () => {
  try {
    await prisma.$connect();
    await ensureDefaultStyles();
    server.listen(PORT, () => {
      console.log(`API server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
