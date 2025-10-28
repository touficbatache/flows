import { useNavigate } from 'react-router-dom';
import { getAllFlowcharts } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Workflow } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const flowcharts = getAllFlowcharts();

  // Group by ID
  const groupedFlowcharts = flowcharts.reduce((acc, flowchart) => {
    if (!acc[flowchart.id]) {
      acc[flowchart.id] = [];
    }
    acc[flowchart.id].push(flowchart);
    return acc;
  }, {} as Record<number, typeof flowcharts>);

  const handleCreateNew = () => {
    navigate('/new/edit');
  };

  return (
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
        {Object.keys(groupedFlowcharts).length === 0 ? (
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
              const latestVersion = versions.sort((a, b) => b.version - a.version)[0];
              return (
                <Card
                  key={id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() =>
                    navigate(`/${id}/${latestVersion.version}`)
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Flowchart #{id}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        v{latestVersion.version}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      {latestVersion.nodes.length} nodes • {versions.length} version
                      {versions.length !== 1 ? 's' : ''}
                    </CardDescription>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(latestVersion.createdAt).toLocaleDateString()}
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
