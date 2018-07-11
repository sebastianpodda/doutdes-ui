/** Login Actions **/

import {Injectable} from '@angular/core';
import {IAppState} from '../../../shared/store/model';
import {NgRedux} from '@angular-redux/store';
import {Router} from '@angular/router';
import {User} from '../../../shared/_models/User';
import {StoreService} from '../../../shared/_services/store.service';

export const LOGIN_USER          = 'LOGIN_USER';
export const LOGIN_USER_SUCCESS  = 'LOGIN_USER_SUCCESS';
export const LOGIN_USER_ERROR    = 'LOGIN_USER_ERROR';
export const LOGOUT_USER         = 'LOGOUT_USER';

@Injectable()
export class LoginActions {
  constructor(private ngRedux: NgRedux<IAppState>, private router: Router, private storeLocal: StoreService) {}

  loginUser() {
    this.ngRedux.dispatch({ type: LOGIN_USER });
  }

  loginUserSuccess(user: User, token: string) {
    this.ngRedux.dispatch({ type: LOGIN_USER_SUCCESS, user: user, token: token });

    this.storeLocal.setToken(token);
    this.storeLocal.setUsername(user.username);
  }

  loginUserError() {
    this.ngRedux.dispatch({ type: LOGIN_USER_ERROR });
  }

  logoutUser() {
    this.ngRedux.dispatch({ type: LOGOUT_USER });

    this.storeLocal.removeToken();
    this.storeLocal.removeUsername();

    this.router.navigate(['/authentication/login']);
  }
}