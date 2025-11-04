import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { AGENT_PROVIDER } from './app/services/agent.service';
import { OpenAIAgentProvider } from './app/services/providers/openai-agent.provider';
import { ElectronService } from './app/services/electron.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    ElectronService,
    OpenAIAgentProvider,
    {
      provide: AGENT_PROVIDER,
      useExisting: OpenAIAgentProvider
    }
  ]
}).catch(err => console.error(err));

