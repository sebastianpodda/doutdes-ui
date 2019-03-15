import {NgModule} from '@angular/core';
import {SharedModule} from '../../../shared/shared.module';
import {CoreModule} from '../../../core/core.module';
import {FeaturePreferencesApiKeysComponent} from './api-keys.component';
import {ApiKeysService} from '../../../shared/_services/apikeys.service';
import {FeaturePreferencesApiKeysRegisterFormComponent} from './register-form/register-form.component';
import {BreadcrumbActions} from '../../../core/breadcrumb/breadcrumb.actions';
import {FacebookService} from '../../../shared/_services/facebook.service';
import {GoogleAnalyticsService} from '../../../shared/_services/googleAnalytics.service';
import {BsModalService} from 'ngx-bootstrap';
import {NgxLoadingModule} from 'ngx-loading';
import {FilterActions} from '../../dashboard/redux-filter/filter.actions';
import {ChartsCallsService} from '../../../shared/_services/charts_calls.service';
import {InstagramService} from '../../../shared/_services/instagram.service';
import {AggregatedDataService} from '../../../shared/_services/aggregated-data.service';

@NgModule({
  declarations: [
    FeaturePreferencesApiKeysComponent,
    FeaturePreferencesApiKeysRegisterFormComponent
  ],
  imports: [
    SharedModule,
    CoreModule,
    NgxLoadingModule.forRoot({})
  ],
  providers: [
    ApiKeysService,
    FacebookService,
    InstagramService,
    GoogleAnalyticsService,
    AggregatedDataService,
    BsModalService,
    BreadcrumbActions,
    FilterActions,
    ChartsCallsService
  ],
  exports: [
    FeaturePreferencesApiKeysComponent,
    FeaturePreferencesApiKeysRegisterFormComponent
  ]
})

export class FeaturePreferencesApiKeysModule { }
