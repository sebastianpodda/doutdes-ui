import {NgModule} from '@angular/core';
import {FeatureComponent} from './feature.component';
import {FeatureRoutingModule} from './feature.routing';
import {SharedModule} from '../shared/shared.module';
import {CoreModule} from '../core/core.module';
import {IsAuthenticatedGuard} from '../shared/_guards/is-authenticated.guard';
import {PerfectScrollbarModule} from 'ngx-perfect-scrollbar';
import {P404Component} from '../errors/404.component';
import {P500Component} from '../errors/500.component';
import {NgxLoadingModule} from 'ngx-loading';
import {GlobalEventsManagerService} from '../shared/_services/global-event-manager.service';
import {IsNotAuthenticatedGuard} from '../shared/_guards/is-not-authenticated.guard';

@NgModule({
  declarations: [
    FeatureComponent,
    P404Component,
    P500Component
  ],
  imports: [
    FeatureRoutingModule,
    SharedModule,
    CoreModule,
    PerfectScrollbarModule,
    NgxLoadingModule.forRoot({}),
  ],
  providers: [
    IsAuthenticatedGuard,
    GlobalEventsManagerService
  ],
  exports: [
  ]
})

export class FeatureModule { }
