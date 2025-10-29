import { Command } from "./Command";

export interface CommandStackListener {
  commandStackChanged(): void;
}

export class CommandStack {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private listeners: CommandStackListener[] = [];

  addCommand(command: Command): void {
    this.undoStack.push(command);
    this.redoStack = []; // Clear redo stack on new command
    command.execute();
    this.onChange();
  }

  undo(): void {
    if (this.isUndoEmpty()) return;
    const command = this.undoStack.pop()!;
    command.undo();
    this.redoStack.push(command);
    this.onChange();
  }

  redo(): void {
    if (this.isRedoEmpty()) return;
    const command = this.redoStack.pop()!;
    command.execute();
    this.undoStack.push(command);
    this.onChange();
  }

  isUndoEmpty(): boolean {
    return this.undoStack.length === 0;
  }

  isRedoEmpty(): boolean {
    return this.redoStack.length === 0;
  }

  addListener(listener: CommandStackListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: CommandStackListener): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private onChange(): void {
    for (const listener of this.listeners) {
      listener.commandStackChanged();
    }
  }
}
