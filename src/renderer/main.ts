import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { AGENT_PROVIDER } from './app/services/agent.service';
import { ServiceIAAgentProvider } from './app/services/providers/service-ia-agent.provider';
import { ElectronService } from './app/services/electron.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    ElectronService,
    ServiceIAAgentProvider,
    {
      provide: AGENT_PROVIDER,
      useExisting: ServiceIAAgentProvider
    }
  ]
}).catch(err => console.error(err));

