import { Command } from "./Command";

export class CommandMoveNode implements Command {
  private reactFlowInstance: any;
  private nodeId: string;
  private oldPosition: any;
  private newPosition: any;

  constructor(
    reactFlowInstance: any,
    nodeId: string,
    oldPosition: any,
    newPosition: any
  ) {
    this.reactFlowInstance = reactFlowInstance;
    this.nodeId = nodeId;
    this.oldPosition = oldPosition;
    this.newPosition = newPosition;
  }

  execute(): void {
    this.reactFlowInstance.moveNode(this.nodeId, this.newPosition);
  }

  undo(): void {
    this.reactFlowInstance.moveNode(this.nodeId, this.oldPosition);
  }
}
