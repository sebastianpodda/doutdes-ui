import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {IsAuthenticatedGuard} from './shared/_guards/is-authenticated.guard';

// Import Containers
import { DefaultLayoutComponent } from './containers';

import { P404Component } from './views/error/404.component';
import { P500Component } from './views/error/500.component';
import { FeatureAuthenticationLoginComponent } from './features/authentication/login/login.component';
import { FeatureAuthenticationRegisterComponent } from './features/authentication/register/register.component';
import {AppComponent} from './app.component';


export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    loadChildren: './features/feature.module#FeatureModule'
  },
  {
    path: '**',
    component: P404Component,
    data: {
      title: 'Page 404'
    }
  }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, {useHash: false, enableTracing: true }) ],
  exports: [ RouterModule ],
  providers: [ IsAuthenticatedGuard ]
})
export class AppRoutingModule {}
