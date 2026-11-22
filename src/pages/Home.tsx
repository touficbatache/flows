import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllFlowcharts,
  type Flowchart,
  createNewFlowchart,
  saveFlowchart,
  defaultStyles,
  generateFlowchartFromPrompt,
  getStyleById,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { LoaderCircle, SquarePen, Plus, Sparkles, Workflow } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [flowcharts, setFlowcharts] = useState<Flowchart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"manual" | "ai" | null>(
    null
  );
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPromptError, setAiPromptError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const all = await getAllFlowcharts();
        if (isMounted) {
          setFlowcharts(all);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to load flowcharts", err);
        if (isMounted) {
          setError("Failed to load flowcharts");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  // Group by ID
  const groupedFlowcharts = useMemo(() => {
    return flowcharts.reduce((acc, flowchart) => {
      if (!acc[flowchart.id]) {
        acc[flowchart.id] = [];
      }
      acc[flowchart.id].push(flowchart);
      return acc;
    }, {} as Record<number, Flowchart[]>);
  }, [flowcharts]);

  const resetDialogState = () => {
    setSelectedOption(null);
    setAiPrompt("");
    setAiPromptError(null);
  };

  const handleCreateNew = () => {
    if (isGenerating) {
      return;
    }
    resetDialogState();
    setIsCreateDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && isGenerating) {
      return;
    }
    setIsCreateDialogOpen(open);
    if (!open) {
      resetDialogState();
    }
  };

  const handleManualCreation = () => {
    if (isGenerating) {
      return;
    }
    setIsCreateDialogOpen(false);
    resetDialogState();
    navigate("/new/edit");
  };

  const handleGenerateWithAi = async () => {
    if (isGenerating) {
      return;
    }
    const trimmedPrompt = aiPrompt.trim();
    if (!trimmedPrompt) {
      setAiPromptError("Please describe the process so we know what to build.");
      return;
    }

    setIsGenerating(true);
    setAiPromptError(null);
    try {
      const aiResult = await generateFlowchartFromPrompt(trimmedPrompt);

      // Ensure nodes and edges have necessary defaults
      const nodesWithType = (aiResult.nodes ?? []).map((node) => ({
        ...node,
        type: node.type ?? "custom",
      }));
      const edgesWithId = (aiResult.edges ?? []).map((edge, index) => ({
        ...edge,
        id: edge.id ?? `edge-${index + 1}`,
      }));

      // Collect styleIds referenced by AI nodes
      const referencedStyleIds = Array.from(
        new Set(
          nodesWithType.map((n) => n.data?.styleId).filter(Boolean) as string[]
        )
      );
      console.log("Referenced style IDs:", referencedStyleIds);

      // Start with default styles and add any referenced styles that aren't present
      const stylesToSave = [...defaultStyles];
      const defaultIds = new Set(defaultStyles.map((s) => s.id));

      for (const styleId of referencedStyleIds) {
        if (defaultIds.has(styleId)) continue;
        try {
          console.log(`Loading style ${styleId} from storage`);
          const remote = await getStyleById(styleId);
          if (remote) {
            console.log(`Loaded style ${styleId} from storage`);
            stylesToSave.push(remote);
            defaultIds.add(remote.id);
          } else {
            console.warn(`Style ${styleId} not found in storage`);
          }
        } catch (err) {
          console.warn(`Failed to load style ${styleId}`, err);
        }
      }

      const created = await createNewFlowchart(aiResult.title);
      await saveFlowchart(
        created.id,
        aiResult.title,
        nodesWithType,
        edgesWithId,
        stylesToSave
      );
      toast.success("Flowchart created from your description.");
      setIsCreateDialogOpen(false);
      resetDialogState();
      navigate(`/${created.id}/edit`);
    } catch (err) {
      console.error("Failed to generate flowchart", err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to generate flowchart. Please try again.";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Workflow className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Flowchart Builder</h1>
                  <p className="text-sm text-muted-foreground">
                    Create beautiful documentation flowcharts
                  </p>
                </div>
              </div>
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                New Flowchart
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Workflow className="h-20 w-20 text-muted-foreground/50 mb-4 animate-pulse" />
              <h2 className="text-2xl font-semibold mb-2">
                Loading flowcharts…
              </h2>
              <p className="text-muted-foreground">
                Fetching the latest projects from the database.
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Workflow className="h-20 w-20 text-muted-foreground/50 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">
                Something went wrong
              </h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                size="lg"
                className="gap-2"
              >
                Retry
              </Button>
            </div>
          ) : Object.keys(groupedFlowcharts).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Workflow className="h-20 w-20 text-muted-foreground/50 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No flowcharts yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first flowchart to get started
              </p>
              <Button onClick={handleCreateNew} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create First Flowchart
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(groupedFlowcharts).map(([id, versions]) => {
                const latestVersion = versions.sort(
                  (a, b) => b.version - a.version
                )[0];
                return (
                  <Card
                    key={id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/${id}/${latestVersion.version}`)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{latestVersion.title}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                          v{latestVersion.version}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {latestVersion.nodes.length} nodes • {versions.length}{" "}
                        version
                        {versions.length !== 1 ? "s" : ""}
                      </CardDescription>
                      <div className="text-xs text-muted-foreground">
                        Created:{" "}
                        {new Date(latestVersion.createdAt).toLocaleDateString()}
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>How would you like to start?</DialogTitle>
            <DialogDescription>
              Pick a blank canvas or have AI draft a starting flowchart from
              your explanation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setSelectedOption("manual")}
              disabled={isGenerating}
              className={cn(
                "flex h-full flex-col gap-3 rounded-xl border-2 border-muted bg-card p-5 text-left transition-all",
                "enabled:hover:border-primary enabled:hover:shadow-lg enabled:hover:scale-[1.02]",
                "enabled:focus-visible:outline-hidden enabled:focus-visible:ring-2 enabled:focus-visible:ring-primary",
                "disabled:cursor-not-allowed disabled:opacity-70",
                selectedOption === "manual" &&
                  "border-primary shadow-lg scale-[1.01]"
              )}
            >
              <div className="flex items-center justify-between">
                <SquarePen className="h-6 w-6 text-primary" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Manual
                </span>
              </div>
              <div>
                <h3 className="font-semibold">Start from scratch</h3>
                <p className="text-sm text-muted-foreground">
                  Open the editor with a blank canvas and build every node
                  yourself.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedOption("ai")}
              disabled={isGenerating}
              className={cn(
                "flex h-full flex-col gap-3 rounded-xl border-2 border-muted bg-card p-5 text-left transition-all",
                "enabled:hover:border-primary enabled:hover:shadow-lg enabled:hover:scale-[1.02]",
                "enabled:focus-visible:outline-hidden enabled:focus-visible:ring-2 enabled:focus-visible:ring-primary",
                "disabled:cursor-not-allowed disabled:opacity-70",
                selectedOption === "ai" &&
                  "border-primary shadow-lg scale-[1.01]"
              )}
            >
              <div className="flex items-center justify-between">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  AI assist
                </span>
              </div>
              <div>
                <h3 className="font-semibold">Describe the process</h3>
                <p className="text-sm text-muted-foreground">
                  Tell us what the workflow should do and we&apos;ll draft the
                  nodes and edges.
                </p>
              </div>
            </button>
          </div>

          {selectedOption === "manual" && (
            <Button
              className="mt-4 w-full"
              onClick={handleManualCreation}
              disabled={isGenerating}
            >
              <SquarePen className="h-4 w-4" />
              Create manually
            </Button>
          )}

          {selectedOption === "ai" && (
            <div className="space-y-3 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="ai-description">
                  What should this flowchart cover?
                </Label>
                <Textarea
                  id="ai-description"
                  placeholder="Explain the trigger, steps, and outcome for the automation you need."
                  value={aiPrompt}
                  onChange={(event) => {
                    setAiPrompt(event.target.value);
                    if (aiPromptError) {
                      setAiPromptError(null);
                    }
                  }}
                  disabled={isGenerating}
                  className="min-h-[120px]"
                />
                {aiPromptError && (
                  <p className="text-sm text-destructive">{aiPromptError}</p>
                )}
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleGenerateWithAi}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Creating flowchart…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Create with AI
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
