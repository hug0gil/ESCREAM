import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth/auth.service';
import { RouterLink } from "@angular/router";
import { MainComponent } from "../../main/main.component";
import { MainLayoutComponent } from "../../../layout/main-layout/main-layout.component";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, MainComponent, MainLayoutComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {

  protected auth = inject(AuthService);


  /** Placeholder: navegará a la sección de administración cuando exista. */
  manage(section: string): void {
    // TODO: enrutar a /admin/<section> cuando se cree el panel de administración
  }

}
