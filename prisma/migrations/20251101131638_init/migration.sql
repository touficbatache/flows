-- CreateTable
CREATE TABLE "Flowchart" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flowchart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowchartVersion" (
    "id" SERIAL NOT NULL,
    "flowchartId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "styles" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowchartVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeStyle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT,
    "image" TEXT,
    "imageName" TEXT,
    "assetType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NodeStyle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlowchartVersion_flowchartId_version_key" ON "FlowchartVersion"("flowchartId", "version");

-- AddForeignKey
ALTER TABLE "FlowchartVersion" ADD CONSTRAINT "FlowchartVersion_flowchartId_fkey" FOREIGN KEY ("flowchartId") REFERENCES "Flowchart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
