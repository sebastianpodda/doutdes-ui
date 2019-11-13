import {Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Breadcrumb} from '../../../../core/breadcrumb/Breadcrumb';
import {BreadcrumbActions} from '../../../../core/breadcrumb/breadcrumb.actions';
import {FacebookMarketingService} from '../../../../shared/_services/facebook-marketing.service';
import {DashboardData, IntervalDate} from '../../redux-filter/filter.model';
import {D_TYPE} from '../../../../shared/_models/Dashboard';
import {forkJoin, Observable, Subject} from 'rxjs';
import {FbmMiniCards, MiniCard} from '../../../../shared/_models/MiniCard';
import {ChartsCallsService} from '../../../../shared/_services/charts_calls.service';
import {DashboardCharts} from '../../../../shared/_models/DashboardCharts';
import {subDays} from "date-fns";
import html2canvas from 'html2canvas';
import {takeUntil} from 'rxjs/operators';
import {GlobalEventsManagerService} from '../../../../shared/_services/global-event-manager.service';
import {DashboardService} from '../../../../shared/_services/dashboard.service';
import {ToastrService} from 'ngx-toastr';
import {ApiKey} from '../../../../shared/_models/ApiKeys';
import {ApiKeysService} from '../../../../shared/_services/apikeys.service';
import {BsLocaleService, BsModalRef, BsModalService} from 'ngx-bootstrap';
import {select} from '@angular-redux/store';
import {FilterActions} from '../../redux-filter/filter.actions';
import {ngxLoadingAnimationTypes} from 'ngx-loading';
import * as jsPDF from 'jspdf';
import {User} from '../../../../shared/_models/User';
import {UserService} from '../../../../shared/_services/user.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {connectableObservableDescriptor} from 'rxjs/internal/observable/ConnectableObservable';
import {computeStyle} from '@angular/animations/browser/src/util';


const PrimaryWhite = '#ffffff';

@Component({
  selector: 'app-feature-dashboard-facebook-marketing',
  templateUrl: './facebook-marketing.component.html'
})

export class FeatureDashboardFacebookMarketingComponent implements OnInit, OnDestroy {
  title = 'Facebook Marketing';
  public miniCards: MiniCard[] = FbmMiniCards;
  public chartArray$: Array<DashboardCharts> = [];
  loaded: boolean = false;
  private pageID = null;
  public loading = false;
  public isApiKeySet = true;

  @ViewChild('reportWait') reportWait;
  @ViewChild('selectView') selectView;

  public FILTER_DAYS = {
    yesterday: 1,
    seven: 6,
    thirty: 29,
    ninety: 89
  };

  public config = {
    animationType: ngxLoadingAnimationTypes.threeBounce,
    backdropBackgroundColour: 'rgba(0,0,0,0.1)',
    backdropBorderRadius: '4px',
    primaryColour: PrimaryWhite,
    secondaryColour: PrimaryWhite
  };

  firstDateRange: Date;
  lastDateRange: Date;
  maxDate: Date = subDays(new Date(), this.FILTER_DAYS.yesterday);
  minDate: Date = subDays(this.maxDate, this.FILTER_DAYS.ninety);
  bsRangeValue: Date[];
  dateChoice: String = 'Ultimi 30 giorni';

  modalRef: BsModalRef;


  // Form for init
  selectViewForm: FormGroup;
  loadingForm: boolean;
  pageList;
  submitted: boolean;

  @select() filter: Observable<any>;

  public D_TYPE = D_TYPE;
  public HARD_DASH_DATA = {
    dashboard_type: D_TYPE.FBM,
    dashboard_id: null
  };
  private dashStored: Array<DashboardCharts> = [];

  dashErrors = {
    emptyMiniCards: false,
    noPages: false
  };

  constructor(
    private FBMService: FacebookMarketingService,
    private breadcrumbActions: BreadcrumbActions,
    private GEService: GlobalEventsManagerService,
    private DService: DashboardService,
    private toastr: ToastrService,
    private userService: UserService,
    private formBuilder: FormBuilder,
    private apiKeyService: ApiKeysService,
    private localeService: BsLocaleService,
    private filterActions: FilterActions,
    private modalService: BsModalService,
    private CCService: ChartsCallsService
) {
  }

  async ngOnInit() {

    let existence, fbm_page_id, update;
    let key: ApiKey;

    this.GEService.loadingScreen.subscribe(value => {
      this.loading = value;
    });

    this.addBreadcrumb();
    try {
      existence = await this.checkExistence();

      if (!existence) { // If the Api Key has not been set yet, then a message is print
        this.isApiKeySet = false;
        return;
      }
      fbm_page_id = await this.getPageID();
      this.pageID = fbm_page_id;
      // We check if the user has already set a preferred page if there is more than one in his permissions.
      if (!fbm_page_id) {
        await this.getPagesList();

        if (this.pageList.length === 0) {
          this.dashErrors.noPages = true;
          return;
        }

        if (this.pageList.length === 1) {
          key = {fbm_page_id: this.pageList[0]['id'], service_id: D_TYPE.FBM};
          update = await this.apiKeyService.updateKey(key).toPromise();

          if (!update) {
            return;
          }
        } else {

          this.selectViewForm = this.formBuilder.group({
            fbm_page_id: ['', Validators.compose([Validators.maxLength(20), Validators.required])],
          });

          this.selectViewForm.controls['fbm_page_id'].setValue(this.pageList[0].id);

          this.openModal(this.selectView, true);
          return;
        }
      }
      await this.getPagesName();
      console.log(this.title);

      this.firstDateRange = this.minDate;
      this.lastDateRange = this.maxDate;
      this.bsRangeValue = [this.firstDateRange, this.lastDateRange];

      this.GEService.loadingScreen.subscribe(value => {
        this.loading = value;
      });

      this.filter.subscribe(elements => {
        this.chartArray$ = elements['filteredDashboard'] ? elements['filteredDashboard']['data'] : [];
        const index = elements['storedDashboards'] ? elements['storedDashboards'].findIndex((el: DashboardData) => el.type === D_TYPE.FBM) : -1;
        this.dashStored = index >= 0 ? elements['storedDashboards'][index] : null;
      });

      let dash_type = this.HARD_DASH_DATA.dashboard_type;

      if (!this.GEService.isSubscriber(dash_type)) {
        this.GEService.removeFromDashboard.subscribe(values => {
          if (values[0] !== 0 && values[1] === this.HARD_DASH_DATA.dashboard_id) {
            this.filterActions.removeChart(values[0]);
          }
        });
        this.GEService.showChartInDashboard.subscribe(chart => {
          if (chart && chart.dashboard_id === this.HARD_DASH_DATA.dashboard_id) {
            this.addChartToDashboard(chart);
          }
        });
        this.GEService.updateChartInDashboard.subscribe(chart => {
          if (chart && chart.dashboard_id === this.HARD_DASH_DATA.dashboard_id) {
            this.filterActions.updateChart(chart);
          }
        });

        this.GEService.addSubscriber(dash_type);
      }

      this.localeService.use('it');
      await this.loadDashboard();
      this.GEService.loadingScreen.next(false);
    }
    catch (e) {
      console.error('Error on ngOnInit of Facebook', e);
      this.toastr.error('Il caricamento della dashboard non è andato a buon fine. Per favore, riprova oppure contatta il supporto tecnico.', 'Qualcosa è andato storto!');
      this.GEService.loadingScreen.next(false);
    }
  }

  async loadDashboard() { // TODO get pageID and refactor
    let dash;
    let observables: Observable<any>[] = [];
    const chartsToShow: Array<DashboardCharts> = [];
    const dateInterval: IntervalDate = {
      first: this.minDate,
      last: this.maxDate
    };

    let currentData: DashboardData = {
      data: chartsToShow,
      interval: dateInterval,
      type: D_TYPE.FBM,
    };

    this.GEService.loadingScreen.next(true);


    try {
      // Retrieving dashboard ID
      dash = await this.DService.getDashboardByType(D_TYPE.FBM).toPromise(); // Facebook type

      if (dash.id) {
        this.HARD_DASH_DATA.dashboard_id = dash.id; // Retrieving dashboard id
      } else {
        console.error('Cannot retrieve a page ID for the Facebook dashboard.');
        return;
      }

      this.dashErrors.emptyMiniCards = await this.loadMiniCards(this.pageID);

      if (this.dashStored) {
        // Ci sono già dati salvati
        this.filterActions.loadStoredDashboard(D_TYPE.FBM);
        this.bsRangeValue = [subDays(this.maxDate, this.FILTER_DAYS.thirty), this.lastDateRange];
        this.GEService.loadingScreen.next(false);
        if (this.chartArray$.length === 0) {
          this.toastr.info('Puoi iniziare aggiungendo un nuovo grafico.', 'La tua dashboard è vuota');
        }
      } else {
        let ds : Subject<void> = new Subject<void>(); // used to force unsubscription
        // Retrieving dashboard charts
        this.DService.getAllDashboardCharts(this.HARD_DASH_DATA.dashboard_id)
          .subscribe(charts => {
            if (charts && charts.length > 0) { // Checking if dashboard is not empty
              charts.forEach(chart => observables.push(this.CCService.retrieveChartData(chart.chart_id, null, this.pageID))); // Retrieves data for each chart

              forkJoin(observables)
                .pipe(takeUntil(ds))
                .subscribe(dataArray => {
                  for (let i = 0; i < dataArray.length; i++)  {

                    let chart: DashboardCharts = charts[i];

                    if ((dataArray.length > 0 && dataArray[i] == null)) {
                      chart.error = true;
                      console.warn('The attached chart does not contain any data.', chart);
                    }
                    else if (!dataArray[i].status && chart) { // If no error is occurred when retrieving chart data

                      if (dataArray[i].length === 0) { //if there is no data available
                        chart.error = true;
                      }
                      else {
                        chart.chartData = dataArray[i];
                        let date = new Date(chart.chartData.data[0]['date_stop']);
                        if (date < this.minDate)
                          this.minDate = date;
                        // chart.color = chart.chartData.options.color ? chart.chartData.options.colors[0] : null; TODO Check
                        chart.error = false;
                      }
                    } else {
                      chart.error = true;

                      console.error('ERROR in FACEBOOK COMPONENT. Cannot retrieve data from one of the charts. More info:');
                      console.error(dataArray[i]);
                    }
                    chart.chartData = chart.chartData.data;
                    chartsToShow.push(chart); // Original Data

                  }

                  ds.next();
                  ds.complete();

                  currentData.data = chartsToShow;
                  this.filterActions.initData(currentData);
                  this.GEService.updateChartList.next(true); // TODO check to remove

                  // Shows last 30 days
                  // this.datePickerEnabled = true;
                  this.bsRangeValue = [subDays(this.maxDate, this.FILTER_DAYS.thirty), this.lastDateRange];

                  this.GEService.loadingScreen.next(false);
                });

            } else {
              this.filterActions.initData(currentData);
              this.bsRangeValue = [subDays(this.maxDate, this.FILTER_DAYS.thirty), this.lastDateRange];
              this.GEService.loadingScreen.next(false);
              this.toastr.info('Puoi iniziare aggiungendo un nuovo grafico.', 'La tua dashboard è vuota');
            }

          }, err => {
            console.error('ERROR in FACEBOOK COMPONENT, when fetching charts.');
            console.warn(err);
            this.toastr.error('Il caricamento della dashboard non è andato a buon fine. Per favore, riprova oppure contatta il supporto tecnico.', 'Qualcosa è andato storto!');
            this.GEService.loadingScreen.next(false);
          });
      }

      this.loaded = true;

    } catch (e) {
      this.toastr.error('Il caricamento della dashboard non è andato a buon fine. Per favore, riprova oppure contatta il supporto tecnico.', 'Qualcosa è andato storto!');
      console.error('ERROR in CUSTOM-COMPONENT. Cannot retrieve dashboard charts. More info:');
      console.error(e);
      this.GEService.loadingScreen.next(false);
    }
  }

  async loadMiniCards(pageID) {
    // 1. Init intervalData (retrieve data of previous month)
    let results;
    let empty = false;
    let date = new Date(), y = date.getFullYear(), m = date.getMonth();
    const intervalDate: IntervalDate = {
      first: new Date(y, m - 1, 1),
      last: new Date(new Date(y, m, 0).setHours(23, 59, 59, 999))
    };

    let pageIDs = {};
    pageIDs[D_TYPE.FBM] = pageID;

    const observables = this.CCService.retrieveMiniChartData(D_TYPE.FBM, pageIDs, null);
    forkJoin(observables).subscribe(miniDatas => {
      for (let i = 0; i < this.miniCards.length; i++) {
        results = this.CCService.formatMiniChartData(miniDatas[0].data, D_TYPE.FBM, this.miniCards[i].measure, intervalDate);

        empty = empty || !results;

        this.miniCards[i].value = results['value'];
        this.miniCards[i].progress = results['perc'] + '%';
        this.miniCards[i].step = results['step'];
      }
    });

    return empty;

  }

  ngOnDestroy(): void {
    this.removeBreadcrumb();
  }

  addBreadcrumb = (): void => {
    const bread = [] as Breadcrumb[];

    bread.push(new Breadcrumb('Home', '/'));
    bread.push(new Breadcrumb('Dashboard', '/dashboard/'));
    bread.push(new Breadcrumb('Facebook Marketing', '/dashboard/facebook/marketing/'));

    this.breadcrumbActions.updateBreadcrumb(bread);
  };

  removeBreadcrumb = (): void => {
    this.breadcrumbActions.deleteBreadcrumb();
  };

  async addChartToDashboard(dashChart: DashboardCharts) {
    const chartToPush: DashboardCharts = dashChart;
    const intervalDate: IntervalDate = {
      first: this.bsRangeValue[0],
      last: this.bsRangeValue[1]
    };

    const dummySubj: Subject<void> = new Subject<void>(); // used to force unsubscription

    try {
      this.CCService.retrieveChartData(dashChart.chart_id, null, this.pageID)
        .pipe(takeUntil(dummySubj))
        .subscribe( data => {
          this.GEService.loadingScreen.next(true);

          if (!data['status']) { // Se la chiamata non rende errori
            chartToPush.chartData = data.data;
            chartToPush.error = false;

            this.toastr.success('"' + dashChart.title + '" è stato correttamente aggiunto alla dashboard.', 'Grafico aggiunto!');

          } else {
            chartToPush.error = true;
            console.log('Errore recuperando dati per ' + dashChart);
          }
          this.filterActions.addChart(chartToPush);
          this.filterActions.filterData(intervalDate); // Dopo aver aggiunto un grafico, li porta tutti alla stessa data

          this.GEService.loadingScreen.next(false);

          dummySubj.next();
          dummySubj.complete();
        });
    }
    catch (err) {
      console.log('Error querying the chart');
      console.log(err);
    };
  }

  nChartEven() {
    return this.chartArray$.length % 2 === 0;
  }

  async checkExistence() {
    let response, isPermissionGranted, result = null;

    try {
      response = await this.apiKeyService.checkIfKeyExists(D_TYPE.FBM).toPromise();
      isPermissionGranted = await this.apiKeyService.isPermissionGranted(D_TYPE.FBM).toPromise();
      if(isPermissionGranted.tokenValid) {
        result = response['exists'] && isPermissionGranted['granted'];
      } else {
        this.toastr.error('I permessi di accesso ai tuoi dati Facebook sono non validi o scaduti. Riaggiungi la sorgente dati per aggiornarli.', 'Permessi non validi!')
      }

    } catch (e) {
      console.error(e);
    }

    return result;
  }

  onValueChange(value): void {

    if (value) {// && this.datePickerEnabled) {

      const dateInterval: IntervalDate = {
        first: new Date(value[0].setHours(0, 0, 0, 0)),
        last: new Date(value[1].setHours(23, 59, 59))
      };

      this.filterActions.filterData(dateInterval);

      let diff = Math.abs(dateInterval.first.getTime() - dateInterval.last.getTime());
      let diffDays = Math.ceil(diff / (1000 * 3600 * 24)) - 1;

      if (!Object.values(this.FILTER_DAYS).includes(diffDays)) {
        this.dateChoice = 'Personalizzato';
      }
    }
  }

  changeDateFilter(days: number) {
    this.bsRangeValue = [subDays(this.maxDate, days), this.lastDateRange];
    switch (days) {
      case this.FILTER_DAYS.seven:
        this.dateChoice = 'Ultimi 7 giorni';
        break;
      case this.FILTER_DAYS.thirty:
        this.dateChoice = 'Ultimi 30 giorni';
        break;
      case this.FILTER_DAYS.ninety:
        this.dateChoice = 'Ultimi 90 giorni';
        break;
      default:
        this.dateChoice = 'Personalizzato';
        break;
    }
  }

  closeModal() {
    this.modalRef.hide();
  }

  async getPageID() {
    let pageID;

    try {
      pageID = (await this.apiKeyService.getAllKeys().toPromise()).fbm_page_id;
    } catch (e) {
      console.error('getPageID -> error doing the query', e);
    }

    return pageID;
  }

  async htmltoPDF() {
    const pdf = new jsPDF('p', 'px', 'a4');// 595w x 842h
    const cards = document.querySelectorAll('app-card');
    const firstCard = await html2canvas(cards[0]);
    const user = await this.getUserCompany();

    let dimRatio = firstCard['width'] > 400 ? 3 : 2;
    let graphsRow = 2;
    let graphsPage = firstCard['width'] > 400 ? 6 : 4;

    let x = 40, y = 40;
    let offset = y - 10;

    let dateObj = new Date(), month = dateObj.getUTCMonth() + 1, day = dateObj.getUTCDate(), year = dateObj.getUTCFullYear();

    this.openModal(this.reportWait, true);

    pdf.setFontSize(8);
    pdf.text(user.company_name, 320, offset);
    pdf.text('P. IVA: ' + user.vat_number, 320, offset + 10);
    pdf.text(user.first_name + ' ' + user.last_name, 320, offset + 20);
    pdf.text(user.address, 320, offset + 30);
    pdf.text(user.zip + ' - ' + user.city + ' (' + user.province + ')', 320, offset + 40);

    pdf.setFontSize(18);
    pdf.text('REPORT DASHBOARD SITO', x, y - 5);
    y += 20;

    pdf.setFontSize(14);
    pdf.text('Periodo: ' + this.formatStringDate(this.bsRangeValue[0]) + ' - ' + this.formatStringDate(this.bsRangeValue[1]), x, y - 8);
    y += 40;

    // Numero grafici per riga dipendente da dimensioni grafico
    for (let i = 0; i < cards.length; i++) {
      const canvas = await html2canvas(cards[i]);
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      if (i !== 0 && i % graphsRow === 0 && i !== graphsPage) {
        y += canvas.height / dimRatio + 20;
        x = 40;
      }

      if (i !== 0 && i % graphsPage === 0) {
        pdf.addPage();
        x = 40;
        y = 20;
      }

      pdf.addImage(imgData, x, y, canvas.width / dimRatio, canvas.height / dimRatio);
      x += canvas.width / dimRatio + 10;
    }

    pdf.save('report_sito_' + user.username + '_' + day + '-' + month + '-' + year + '.pdf');

    this.closeModal();
  }

  openModal(template: TemplateRef<any> | ElementRef, ignoreBackdrop: boolean = false) {
    this.modalRef = this.modalService.show(template, {
      class: 'modal-md modal-dialog-centered',
      ignoreBackdropClick: ignoreBackdrop,
      keyboard: !ignoreBackdrop
    });
  }

  formatStringDate(date: Date) {
    return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
  }

  clearDashboard(): void {

    this.DService.clearDashboard(this.HARD_DASH_DATA.dashboard_id).subscribe(() => {
      this.filterActions.clearDashboard(D_TYPE.FB);
      this.closeModal();
    }, error => {
      if (error.status === 500) {
        this.toastr.error('Non vi sono grafici da eliminare.', 'Errore durante la pulizia della dashboard.');
        this.closeModal();
        console.error(error);
      } else {
        this.toastr.error('Non è stato possibile rimuovere tutti i grafici. Riprova più tardi oppure contatta il supporto.', 'Errore durante la rimozione dei grafici.');
        //console.error('ERROR in CARD-COMPONENT. Cannot delete a chart from the dashboard.');
        console.error(error);
        this.closeModal();
      }
    });
  }

  async getPagesList() {
    try {
      this.pageList = await this.FBMService.getPages().toPromise();
    } catch (e) {
      console.error('getFbmViewList -> Error doing the query');
    }
  }

  async getPagesName() {
    try {
      this.pageList = await this.FBMService.getPages().toPromise();
      this.title = this.pageList.filter(el => el.id === this.pageID)[0].name;
    } catch (e) {
      console.error('getFbmViewList -> Error doing the query');
    }
  }

  async selectViewSubmit() {
    let update;
    this.submitted = true;

    if (this.selectViewForm.invalid) {
      this.loadingForm = false;
      return;
    }

    const key: ApiKey = {
      fbm_page_id: this.selectViewForm.value.fbm_page_id,
      service_id: D_TYPE.FB
    };

    this.loadingForm = true;

    update = await this.apiKeyService.updateKey(key).toPromise();

    if (update) {
      this.closeModal();
      await this.ngOnInit();
    } else {
      console.error('MANDARE ERRORE');
    }
  }

  optionModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, {class: 'modal-md modal-dialog-centered'});
  }

  async getUserCompany() {
    return <User> await this.userService.get().toPromise();
  }

}
