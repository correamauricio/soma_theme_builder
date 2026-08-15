import { Command, TokenStateMemento } from '../models/history.model';
import { TokenStateService } from '../services/token-state.service';

export class StateChangeCommand implements Command {
  private previousState: TokenStateMemento;
  private nextState: TokenStateMemento | null = null;
  
  constructor(
    private stateService: TokenStateService,
    private action: () => void
  ) {
    this.previousState = this.stateService.createMemento();
  }

  execute() {
    if (this.nextState) {
      this.stateService.restoreMemento(this.nextState);
    } else {
      this.action();
      this.nextState = this.stateService.createMemento();
    }
  }

  undo() {
    this.stateService.restoreMemento(this.previousState);
  }
}
