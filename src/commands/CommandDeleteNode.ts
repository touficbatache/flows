import { Command } from "./Command";

export class CommandDeleteNode implements Command {
  private reactFlowInstance: any;
  private nodeDetails: any;

  constructor(reactFlowInstance: any, nodeDetails: any) {
    this.reactFlowInstance = reactFlowInstance;
    this.nodeDetails = nodeDetails;
  }

  execute(): void {
    this.reactFlowInstance.removeNode(this.nodeDetails.id);
  }

  undo(): void {
    this.reactFlowInstance.addNode(this.nodeDetails);
  }
}
