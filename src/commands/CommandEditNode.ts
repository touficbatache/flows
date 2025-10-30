import { Command } from "./Command";
import { NodeProperties } from "./NodeProperties";

interface EditNodeParams {
  updateNode: (id: string, value: NodeProperties) => void;
}

export class CommandEditNode implements Command {
  private reactFlowInstance: EditNodeParams;
  private nodeId: string;
  private newValue: NodeProperties;
  private previousValue: NodeProperties;

  constructor(
    reactFlowInstance: EditNodeParams,
    nodeId: string,
    newValue: NodeProperties,
    previousValue: NodeProperties
  ) {
    this.reactFlowInstance = reactFlowInstance;
    this.nodeId = nodeId;
    this.newValue = newValue;
    this.previousValue = previousValue;
  }

  execute(): void {
    this.reactFlowInstance.updateNode(this.nodeId, this.newValue);
  }

  undo(): void {
    this.reactFlowInstance.updateNode(this.nodeId, this.previousValue);
  }
}
