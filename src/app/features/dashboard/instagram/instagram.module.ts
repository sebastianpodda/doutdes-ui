import {NgModule} from '@angular/core';
import {AppFooterModule} from '@coreui/angular';
import {SharedModule} from '../../../shared/shared.module';
import {CoreModule} from '../../../core/core.module';
import {FeatureDashboardInstagramComponent} from './instagram.component';
import {RouterModule} from '@angular/router';
import {HttpClientModule} from '@angular/common/http';
import {InstagramService} from '../../../shared/_services/instagram.service';
import {ChartsModule} from 'ng2-charts/ng2-charts';
import { Ng2GoogleChartsModule } from 'ng2-google-charts';
import {BreadcrumbActions} from '../../../core/breadcrumb/breadcrumb.actions';
import {DashboardService} from '../../../shared/_services/dashboard.service';
import {ChartsCallsService} from '../../../shared/_services/charts_calls.service';
import {GlobalEventsManagerService} from '../../../shared/_services/global-event-manager.service';
import {BsDatepickerModule, BsDropdownModule, BsLocaleService, PopoverModule} from 'ngx-bootstrap';
import {FilterActions} from '../redux-filter/filter.actions';
import {NgxLoadingModule} from 'ngx-loading';
import {ApiKeysService} from '../../../shared/_services/apikeys.service';
import {DragulaModule} from 'ng2-dragula';
import {TranslateModule} from '@ngx-translate/core';
import {UserService} from '../../../shared/_services/user.service';


@NgModule({
  declarations: [
    FeatureDashboardInstagramComponent
  ],
    imports: [
        SharedModule,
        CoreModule,
        ChartsModule,
        Ng2GoogleChartsModule,
        AppFooterModule,
        RouterModule,
        HttpClientModule,
        BsDatepickerModule.forRoot(),
        BsDropdownModule.forRoot(),
        NgxLoadingModule.forRoot({}),
        DragulaModule,
        TranslateModule,
        PopoverModule
    ],
  providers: [
    ApiKeysService,
    InstagramService,
    DashboardService,
    ChartsCallsService,
    BreadcrumbActions,
    FilterActions,
    BsLocaleService,
    DragulaModule,
    UserService,
  ],
  exports: [
    FeatureDashboardInstagramComponent
  ]
})

export class FeatureDashboardInstagramModule { }
