import {NgModule} from '@angular/core';
import {AppFooterModule} from '@coreui/angular';
import {SharedModule} from '../../../shared/shared.module';
import {CoreModule} from '../../../core/core.module';
import {FeatureDashboardFacebookComponent} from './facebook.component';
import {RouterModule} from '@angular/router';
import {HttpClientModule} from '@angular/common/http';
import {FacebookService} from '../../../shared/_services/facebook.service';
import {ChartsModule} from 'ng2-charts/ng2-charts';
import { Ng2GoogleChartsModule } from 'ng2-google-charts';
import {BreadcrumbActions} from '../../../core/breadcrumb/breadcrumb.actions';


@NgModule({
  declarations: [
    FeatureDashboardFacebookComponent
  ],
  imports: [
    SharedModule,
    CoreModule,
    ChartsModule,
    Ng2GoogleChartsModule,
    AppFooterModule,
    RouterModule,
    HttpClientModule
  ],
  providers: [
    FacebookService,
    BreadcrumbActions
  ],
  exports: [
    FeatureDashboardFacebookComponent
  ]
})

export class FeatureDashboardFacebookModule { }
