import { Command } from "./Command";

export class CommandDeleteEdge implements Command {
  private reactFlowInstance: any;
  private edgeDetails: any;

  constructor(reactFlowInstance: any, edgeDetails: any) {
    this.reactFlowInstance = reactFlowInstance;
    this.edgeDetails = edgeDetails;
  }

  execute(): void {
    this.reactFlowInstance.removeEdge(this.edgeDetails.id);
  }

  undo(): void {
    this.reactFlowInstance.addEdge(this.edgeDetails);
  }
}
