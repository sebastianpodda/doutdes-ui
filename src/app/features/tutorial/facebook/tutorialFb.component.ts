import {Component, OnDestroy, OnInit, TemplateRef, ViewEncapsulation} from '@angular/core';
import {Breadcrumb} from '../../../core/breadcrumb/Breadcrumb';
import {BreadcrumbActions} from '../../../core/breadcrumb/breadcrumb.actions';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '../../../shared/_services/user.service';
import {User} from '../../../shared/_models/User';

@Component({
  selector: 'app-feature-tutorial-facebook',
  templateUrl: './tutorialFb.component.html',
  styleUrls: ['./tutorialFb.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class FeatureTutorialFbComponent implements OnInit, OnDestroy {

  modalRef: BsModalRef;
  imgSrc: string;

  lang: string;
  value: string;
  tmp: string;
  user: User;

  constructor(
    private breadcrumbActions: BreadcrumbActions,
    private modalService: BsModalService,
    public translate: TranslateService,
    private userService: UserService
    ) { }

  ngOnInit(): void {
    this.addBreadcrumb();
  }

  ngOnDestroy(): void {
    this.removeBreadcrumb();
  }

  addBreadcrumb() {
    const bread = [] as Breadcrumb[];

    bread.push(new Breadcrumb('Home', '/'));
    bread.push(new Breadcrumb('Tutorial', '/tutorial/'));
    bread.push(new Breadcrumb('Facebook', '/tutorial/facebook/'));

    this.breadcrumbActions.updateBreadcrumb(bread);
  }

  removeBreadcrumb() {
    this.breadcrumbActions.deleteBreadcrumb();
  }

  openModal(template: TemplateRef<any>, imgName) {
    this.imgSrc = imgName;
    this.modalRef = this.modalService.show(template, {class: 'modal-xl modal-dialog-centered'});
  }

  closeModal(): void {
    this.modalRef.hide();
  }

}
