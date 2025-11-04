import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../services/electron.service';
import { FileService } from '../../services/file.service';

@Component({
  selector: 'app-project-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-panel.component.html',
  styleUrl: './project-panel.component.css'
})
export class ProjectPanelComponent {
  @Output() projectOpened = new EventEmitter<string>();
  isLoading = false;
  error: string | null = null;

  constructor(
    private electronService: ElectronService,
    private fileService: FileService
  ) {}

  async openProject() {
    this.isLoading = true;
    this.error = null;

    try {
      const projectPath = await this.electronService.openDirectory().toPromise();
      
      if (!projectPath) {
        this.isLoading = false;
        return;
      }

      // Verificar se é projeto Angular
      const isAngular = await this.fileService.isAngularProject(projectPath).toPromise();
      
      if (!isAngular) {
        this.error = 'Esta pasta não parece ser um projeto Angular. Verifique se contém angular.json';
        this.isLoading = false;
        return;
      }

      // Projeto válido
      this.projectOpened.emit(projectPath);
      this.isLoading = false;
    } catch (error: any) {
      this.error = error.message || 'Erro ao abrir projeto';
      this.isLoading = false;
    }
  }
}

