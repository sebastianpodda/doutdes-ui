import {Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {BreadcrumbActions} from '../../../core/breadcrumb/breadcrumb.actions';
import {Breadcrumb} from '../../../core/breadcrumb/Breadcrumb';
import {GoogleAnalyticsService} from '../../../shared/_services/googleAnalytics.service';
import {DashboardCharts} from '../../../shared/_models/DashboardCharts';
import {DashboardService} from '../../../shared/_services/dashboard.service';
import {ChartsCallsService} from '../../../shared/_services/charts_calls.service';
import {GlobalEventsManagerService} from '../../../shared/_services/global-event-manager.service';
import {FilterActions} from '../redux-filter/filter.actions';
import {select} from '@angular-redux/store';
import {forkJoin, Observable} from 'rxjs';
import {DashboardData, IntervalDate} from '../redux-filter/filter.model';
import {addDays, subDays} from 'date-fns';
import {AggregatedDataService} from '../../../shared/_services/aggregated-data.service';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {UserService} from '../../../shared/_services/user.service';
import {User} from '../../../shared/_models/User';
import {D_TYPE} from '../../../shared/_models/Dashboard';
import {GaMiniCards, MiniCard} from '../../../shared/_models/MiniCard';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import {ApiKeysService} from '../../../shared/_services/apikeys.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ApiKey} from '../../../shared/_models/ApiKeys';
import {ToastContainerDirective, ToastrService} from 'ngx-toastr';


@Component({
  selector: 'app-feature-dashboard-google',
  templateUrl: './googleAnalytics.component.html'
})

export class FeatureDashboardGoogleAnalyticsComponent implements OnInit, OnDestroy {

  // @ViewChild(ToastContainerDirective) toastContainer: ToastContainerDirective;
  @ViewChild('selectView') selectView;

  public D_TYPE = D_TYPE;
  public HARD_DASH_DATA = {
    dashboard_type: D_TYPE.GA,
    dashboard_id: null
  };

  public FILTER_DAYS = { // Deve avere un valore in meno per avere un intervallo corretto
    seven: 6,
    thirty: 29,
    ninety: 89
  };

  public chartArray$: Array<DashboardCharts> = [];
  public miniCards: MiniCard[] = GaMiniCards;
  private dashStored: DashboardData;

  public loading = false;
  public isApiKeySet: boolean = true;

  @select() filter: Observable<any>;

  // Date variables
  firstDateRange: Date;
  lastDateRange: Date;
  minDate: Date = subDays(new Date(), this.FILTER_DAYS.ninety + 1);
  maxDate: Date = new Date();
  bsRangeValue: Date[];
  dateChoice: String = 'Ultimi 30 giorni';
  datePickerEnabled = false;

  modalRef: BsModalRef;

  // Form for init
  selectViewForm: FormGroup;
  loadingForm: boolean;
  viewList;
  submitted: boolean;


  constructor(
    private GAService: GoogleAnalyticsService,
    private breadcrumbActions: BreadcrumbActions,
    private DService: DashboardService,
    private CCService: ChartsCallsService,
    private GEService: GlobalEventsManagerService,
    private filterActions: FilterActions,
    private userService: UserService,
    private toastr: ToastrService,
    private ADService: AggregatedDataService,
    private modalService: BsModalService,
    private apiKeyService: ApiKeysService,
    private formBuilder: FormBuilder
  ) {
  }

  async loadDashboard() {
    let dash, charts, dataArray;
    const observables: Observable<any>[] = [];
    const chartsToShow: Array<DashboardCharts> = [];
    const dateInterval: IntervalDate = {
      first: this.minDate,
      last: this.maxDate
    };
    let currentData: DashboardData = {
      data: chartsToShow,
      interval: dateInterval,
      type: D_TYPE.GA,
    };
    let chart: DashboardCharts;

    this.GEService.loadingScreen.next(true);

    try {
      // Retrieving dashboard ID
      dash = await this.DService.getDashboardByType(D_TYPE.GA).toPromise(); // Google type

      if (dash.id) {
        this.HARD_DASH_DATA.dashboard_id = dash.id; // Retrieving dashboard id
      } else {
        console.error('Cannot retrieve a valid ID for the Website dashboard.');
        return;
      }

      await this.loadMiniCards();

      if (this.dashStored) {
        // Ci sono già dati salvati
        this.filterActions.loadStoredDashboard(D_TYPE.GA);
        this.bsRangeValue = [subDays(new Date(), this.FILTER_DAYS.thirty), this.lastDateRange];
        this.datePickerEnabled = true;
      } else {
        charts = await this.DService.getAllDashboardCharts(this.HARD_DASH_DATA.dashboard_id).toPromise();

        if (charts && charts.length > 0) { // Checking if dashboard is not empty
          charts.forEach(chart => observables.push(this.CCService.retrieveChartData(chart.chart_id)));// Retrieves data for each chart

          dataArray = await forkJoin(observables).toPromise();

          for (let i = 0; i < dataArray.length; i++) {
            chart = charts[i];

            if (dataArray[i] && !dataArray[i].status && chart) { // If no error is occurred when retrieving chart data
              chart.chartData = dataArray[i];
              chart.error = false;
            } else {
              chart.error = true;
              console.error('ERROR in Google Analytics COMPONENT. The chart data is undefined or it\'s not possible to retrieve data from the chart ', chart, '. More info:');
              console.error(dataArray[i]);
            }

            chartsToShow.push(chart);
          }

          currentData.data = chartsToShow;

          this.filterActions.initData(currentData);
          this.GEService.updateChartList.next(true);

          // Shows last 30 days
          this.datePickerEnabled = true;
          this.bsRangeValue = [subDays(new Date(), this.FILTER_DAYS.thirty), this.lastDateRange];

          this.GEService.loadingScreen.next(false);

        } else {
          this.filterActions.initData(currentData);
          this.GEService.loadingScreen.next(false);
          this.toastr.info('Puoi iniziare aggiungendo un nuovo grafico.','La tua dashboard è vuota');
        }
      }

    } catch (e) {
      console.error('ERROR in CUSTOM-COMPONENT. Cannot retrieve dashboard charts. More info:');
      console.error(e);
    }
  }

  async loadMiniCards() {
    // 1. Init intervalData (retrieve data of previous month)
    let results;
    let date = new Date(), y = date.getFullYear(), m = date.getMonth();

    const intervalDate: IntervalDate = {
      first: new Date(y, m - 1, 1),
      last: new Date(new Date(y, m, 0).setHours(23, 59, 59, 999))
    };

    const observables = this.CCService.retrieveMiniChartData(D_TYPE.GA, null, intervalDate);

    forkJoin(observables).subscribe(miniDatas => {
      for (const i in miniDatas) {
        results = this.CCService.formatMiniChartData(miniDatas[i], D_TYPE.GA, this.miniCards[i].measure);
        this.miniCards[i].value = results['value'];
        this.miniCards[i].progress = results['perc'] + '%';
        this.miniCards[i].step = results['step'];
      }
    });
  }

  addChartToDashboard(dashChart: DashboardCharts) {
    const chartToPush: DashboardCharts = dashChart;

    const dateInterval: IntervalDate = {
      first: this.bsRangeValue[0],
      last: this.bsRangeValue[1]
    };

    this.CCService.retrieveChartData(dashChart.chart_id, dateInterval)
      .subscribe(chartData => {

        this.GEService.loadingScreen.next(true);

        if (chartData && !chartData['status']) { // Se la chiamata non rende errori
          chartToPush.chartData = chartData;
          chartToPush.error = false;

          this.toastr.success('"' + dashChart.title + '" è stato correttamente aggiunto alla dashboard.', 'Grafico correttamente aggiunto!');
        } else {
          chartToPush.error = true;
          console.error('Errore recuperando dati per ' + dashChart);
        }

        this.filterActions.addChart(chartToPush);
        this.filterActions.filterData(dateInterval);

        this.GEService.loadingScreen.next(false);
      }, error1 => {
        console.error('Error querying the Chart');
        console.error(error1);
      });
  }

  onValueChange(value): void {

    if (value && this.datePickerEnabled) {

      const dateInterval: IntervalDate = {
        first: new Date(value[0].setHours(0, 0, 0, 0)), // TO REMEMBER: always set ms to 0!!!!
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

  changeData(days: number) {
    this.bsRangeValue = [subDays(new Date(), days), this.lastDateRange];

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

  addBreadcrumb() {
    const bread = [] as Breadcrumb[];

    bread.push(new Breadcrumb('Home', '/'));
    bread.push(new Breadcrumb('Dashboard', '/dashboard/'));
    bread.push(new Breadcrumb('Sito web', '/dashboard/google/'));

    this.breadcrumbActions.updateBreadcrumb(bread);
  }

  removeBreadcrumb() {
    this.breadcrumbActions.deleteBreadcrumb();
  }

  async ngOnInit() {
    let existence, view_id, update;
    let key: ApiKey;

    // this.toastr.overlayContainer = this.toastContainer;

    this.addBreadcrumb();

    try {
      existence = await this.checkExistance();

      if (!existence) { // If the Api Key has not been set yet, then a message is print
        this.isApiKeySet = false;
        return;
      }

      view_id = await this.getViewID();

      // We check if the user has already set a preferred page if there is more than one in his permissions.
      if(!view_id) {

        await this.getViewList();

        if(this.viewList.length === 1) {
          console.warn('SONO QUA', this.viewList);

          key = {ga_view_id: this.viewList[0]['id'], service_id: D_TYPE.GA};
          update = await this.apiKeyService.updateKey(key).toPromise();

          if(!update) {
            return;
          }
        } else {
          this.selectViewForm = this.formBuilder.group({
            view_id: ['', Validators.compose([Validators.maxLength(15), Validators.required])],
          });

          this.selectViewForm.controls['view_id'].setValue(this.viewList[0].id);

          this.openModal(this.selectView, true);

          return;
        }
      }

      this.firstDateRange = subDays(new Date(), 30); //this.minDate;
      this.lastDateRange = this.maxDate;
      //this.bsRangeValue = [this.firstDateRange, this.lastDateRange];
      this.bsRangeValue = [subDays(new Date(), 30), this.lastDateRange]; // Starts with Last 30 days

      this.filter.subscribe(elements => {
        this.chartArray$ = elements['filteredDashboard'] ? elements['filteredDashboard']['data'] : [];
        const index = elements['storedDashboards'] ? elements['storedDashboards'].findIndex((el: DashboardData) => el.type === D_TYPE.GA) : -1;
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
        this.GEService.loadingScreen.subscribe(value => {
          this.loading = value;
        });

        this.GEService.addSubscriber(dash_type);
      }

      await this.loadDashboard();

    } catch (e) {
      console.error('Error on ngOnInit of Google Analytics', e);
    }
  }

  ngOnDestroy() {
    this.removeBreadcrumb();
    this.filterActions.removeCurrent();
  }

  async htmltoPDF() {
    const pdf = new jsPDF('p', 'px', 'a4');// 595w x 842h
    const cards = document.querySelectorAll('app-card');
    let fileName, userCompany;

    let month = (new Date()).getMonth() + 1;
    let day = (new Date()).getDate();
    let year = (new Date()).getFullYear();

    const firstCard = await html2canvas(cards[0]);
    let dimRatio = firstCard['width'] > 400 ? 3 : 2;
    let graphsRow = 2;
    let graphsPage = firstCard['width'] > 400 ? 6 : 4;
    let x = 20, y = 40;

    this.GEService.loadingScreen.next(true);

    try {
      userCompany = await this.getUserCompany();
      fileName = 'report_website_' + userCompany + '_' + day + '_' + month + '_' + year + '.pdf';

      pdf.setFontSize(12);
      pdf.text('Doutdes per ' + userCompany, 340, 20);

      pdf.setFontSize(30);
      pdf.text('Google Analytics', x, y);
      y += 20;

      pdf.setFontSize(20);
      pdf.text('Intervallo temporale: ' + this.formatStringDate(this.bsRangeValue[0]) + ' - ' + this.formatStringDate(this.bsRangeValue[1]), x, y);
      y += 20;

      // Numero grafici per riga dipendente da dimensioni grafico
      // width > 400: 2 per riga, dimensione / 3
      // 200 <= width <= 400: 3 per riga, dimensione / 2

      for (let i = 0; i < cards.length; i++) {
        const canvas = await html2canvas(cards[i]);
        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        if (i !== 0 && i % graphsRow === 0 && i !== graphsPage) {
          y += canvas.height / dimRatio + 20;
          x = 20;
        }

        if (i !== 0 && i % graphsPage === 0) {
          pdf.addPage();
          x = 20;
          y = 20;
        }

        pdf.addImage(imgData, x, y, canvas.width / dimRatio, canvas.height / dimRatio);
        x += canvas.width / dimRatio + 10;
      }


      pdf.save(fileName);

    } catch (e) {
      console.error(e);
      // TODO show message with error on frontend
    }

    this.GEService.loadingScreen.next(false);
    this.closeModal();
  }

  formatStringDate(date: Date) {
    return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
  }

  async getUserCompany() {
    let user: User;
    try {
      user = await this.userService.get().toPromise();
    } catch (e) {
      console.error(e);
    }

    return user.company_name;
  }

  nChartEven() {
    return this.chartArray$.length % 2 === 0;
  }

  async selectViewSubmit(){
    let update;
    this.submitted = true;

    if (this.selectViewForm.invalid) {
      this.loadingForm = false;
      return;
    }

    const key: ApiKey = {
      ga_view_id: this.selectViewForm.value.view_id,
      service_id: D_TYPE.GA
    };

    this.loadingForm = true;

    update = await this.apiKeyService.updateKey(key).toPromise();

    if(update) {
      this.closeModal();
      await this.ngOnInit();
    } else {
      console.error('MANDARE ERRORE');
    }
  }

  openModal(template: TemplateRef<any> | ElementRef, ignoreBackdrop: boolean = false) {
    this.modalRef = this.modalService.show(template, {class: 'modal-md modal-dialog-centered', ignoreBackdropClick: ignoreBackdrop, keyboard: !ignoreBackdrop});
  }

  closeModal(): void {
    this.modalRef.hide();
  }

  async checkExistance() {
    let response, result = null;

    try {
      response = await this.apiKeyService.checkIfKeyExists(D_TYPE.GA).toPromise();
      result = response['exists'] && (await this.apiKeyService.isPermissionGranted(D_TYPE.GA).toPromise())['granted'];
    } catch (e) {
      console.error(e);
    }

    return result;
  }

  async getViewID()  {
    let viewID;

    try {
      viewID = (await this.apiKeyService.getAllKeys().toPromise()).ga_view_id;
    } catch (e) {
      console.error('getViewID -> error doing the query', e);
    }

    return viewID;
  }

  async getViewList() {
    try {
      this.viewList = await this.GAService.getViewList().toPromise();
    } catch (e) {
      console.error('getViewList -> Error doing the query');
    }
  }
}
