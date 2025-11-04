import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ActivityView = 'explorer' | 'extensions' | 'search' | 'git' | 'tests' | 'chat';

@Component({
  selector: 'app-activity-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-bar.component.html',
  styleUrl: './activity-bar.component.css'
})
export class ActivityBarComponent {
  @Output() viewChanged = new EventEmitter<ActivityView>();
  
  activeView: ActivityView = 'explorer';

  selectView(view: ActivityView) {
    if (this.activeView === view) {
      // Se já está ativo, desativar (toggle)
      this.activeView = 'explorer';
    } else {
      this.activeView = view;
    }
    this.viewChanged.emit(this.activeView);
  }

  isActive(view: ActivityView): boolean {
    return this.activeView === view;
  }
}

