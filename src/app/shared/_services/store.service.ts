import {LocalStorage} from '@ngx-pwa/local-storage';
import {Injectable} from '@angular/core';

@Injectable()
export class StoreService {

  constructor(protected localStorage: LocalStorage) {}

  setToken(token: string) {
    this.localStorage.setItem('jwt', token).subscribe(() => {});
  }

  getToken() {
    return this.localStorage.getItem('jwt');
  }

  removeToken() {
    this.localStorage.removeItem('jwt').subscribe(() => {}, () => {});
  }

  setId(id: number) {
    this.localStorage.setItem('id', id).subscribe(() => {});
  }

  getId() {
    return this.localStorage.getItem('id');
  }

  removeId() {
    this.localStorage.removeItem('id').subscribe(() => {}, () => {});
  }

  clear() {
    this.localStorage.clear().subscribe(() => {}, () => {});
  }
}
