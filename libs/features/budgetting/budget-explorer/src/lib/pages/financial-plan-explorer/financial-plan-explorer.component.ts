import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {} from 'lodash';
import { filter, Observable, Subscription, take } from 'rxjs';

import { Logger } from '@iote/bricks-angular';

import { FinancialExplorerStateService } from '../../local-state/f-explorer.state.service';
import { FinancialExplorerState } from '../../local-model/f-explorer.state.model';

/**
 * This page visualises the Budget Explorer, which is the core feature of this application.
 * The Budget Explorer allows to edit and forecast specific budgets and to see their evolution over x years.
 */
@Component({
  selector: 'app-financial-plan-explorer',
  templateUrl: './financial-plan-explorer.component.html',
  styleUrls: ['./financial-plan-explorer.component.scss']
})
export class FinancialPlanExplorerPageComponent implements OnInit, OnDestroy
{
  private _subscr = new Subscription();

  budgetId!: string;
  state$!: Observable<FinancialExplorerState>;

  startYear!: number;
  year!     : number;
  years!    : number[];

  minValue = 0;
  maxValue = 1;

  loading = true;

  constructor(private _state$$: FinancialExplorerStateService,
              private _route: ActivatedRoute,
              private _logger: Logger)
  { }

  ngOnInit() 
  {
    const routeParams = this._route.snapshot.paramMap;
    const bId = routeParams.get('budgetId');

    if(!bId) {
      alert('Component cannot load as no budget-id has been passed through the route. Please contact support.');
      throw new Error('FPE-L1');
    }

    this.state$ = this._state$$.init(bId).pipe(filter(st => st.loaded));

    this._subscr = 
      this.state$.subscribe(st => {
        this.year = st.year;
      });

    this._subscr = // Only on load (ref take 1)
      this.state$.pipe(take(1))
        .subscribe(st => {
          this.startYear = st.year;
          this.years = st.years; // TODO: Can be nice to have the ability to add years. In this case the other subscr must set years.
        });
  }

  /** Prev/Next-style navigation by year */
  navigateYear(nav: 'prev' | 'next')
  {  
    if (nav === 'prev' && this.year > this.startYear) {
      this.year--;
      this.minValue = this.year % this.startYear;
      this.maxValue = this.minValue + 1;
    }
    else if (nav === 'next' && this.year < this.years[this.years.length - 1]) {
      this.year++;
      this.minValue = this.year % this.startYear;
      this.maxValue = this.minValue + 1;
    }
    else
      this._logger.log(() => "The year you are trying to navigate to does not exist!");

    this.setYear(this.year);
  }

  setYear(year: number) {
    // Emit change in year.
    this.year = year;
    this._state$$.setYear(this.year);
  }

  // translateStatus(status: BudgetStatus) {
  //   switch (status) {
  //     case 'in-use':
  //       return 'Active';

  //     case 'open':
  //       return 'Design';

  //     case 'archived':
  //       return 'No Longer in Use';

  //     case 'deleted':
  //       return 'Deleted';

  //     default:
  //       break;
  //   }
  // }
  ngOnDestroy = () => this._subscr.unsubscribe();
}


  // private _generateExcelData(source: Observable<any>, total: Observable<any>) {
  //   let reqData = { dataList: [], total: {} };

  //   source.subscribe(dataList => {
  //     reqData.dataList = dataList;
  //   });

  //   total.subscribe(total => {
  //     reqData.total = total;
  //   });

  //   return reqData;
  // }

  // private _getExcelData() {
  //   this.balanceExcelData = this._generateExcelData(this.balanceTable, this.balance);
  //   this.costExcelData = this._generateExcelData(this.costDataSource, this.costTotal);
  //   this.incomeExcelData = this._generateExcelData(this.incomeDataSource, this.incomeTotal);
  // }

  // private _generateExcelDataForYear(excelData, year) {
  //   let body = [];
  //   let totalData = { Category: 'Total', Name: '' };

  //   // For the body data - cell rows that aren't the total
  //   excelData.dataList.forEach(data => {
  //     let res = { Category: data.name, Name: data.isHeader ? '' : data.name };

  //     for (let i = 0; i < data.amountByYearAndMonth[this.years.indexOf(year)].amountPerMonth.length; i++) {
  //       res[this.months[i].name] = data.amountByYearAndMonth[this.years.indexOf(this.year)].amountPerMonth[i].amount;
  //     }

  //     body.push(res);
  //   });

  //   // For the totals
  //   for (let i = 0; i < excelData.total.amountByYearAndMonth[this.years.indexOf(year)].amountPerMonth.length; i++) {
  //     totalData[this.months[i].name] = excelData.total.amountByYearAndMonth[this.years.indexOf(this.year)].amountPerMonth[i].amount;
  //   }

  //   body.push(totalData);

  //   return body;
  // }

  // downloadExcelFile() {
  //   const balanceExcelDataForYear = this._generateExcelDataForYear(this.balanceExcelData, this.year);
  //   const costExcelDataForYear = this._generateExcelDataForYear(this.costExcelData, this.year);
  //   const incomeExcelDataForYear = this._generateExcelDataForYear(this.incomeExcelData, this.year);

  //   this._excelExportService.exportToExcel(balanceExcelDataForYear, costExcelDataForYear, incomeExcelDataForYear);
  // }