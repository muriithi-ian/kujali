import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { BudgetRowType } from '@app/model/finance/planning/budget-grouping';
import { BudgetRowYear } from '@app/model/finance/planning/budget-lines-by-year';
import { FinancialExplorerState } from '@app/model/finance/planning/budget-rendering-state';

import { LinkBudgetModalComponent } from '../link-budget-modal/link-budget-modal.component';

@Component({
  selector: 'app-financial-plan-result-table',
  templateUrl: './financial-plan-result-table.component.html',
  styleUrls: ['./financial-plan-result-table.component.scss']
})
export class  FinancialPlanResultTableComponent implements OnInit, OnDestroy
{
  private _sBs!: Subscription;

  @Input() state$!: Observable<FinancialExplorerState>;
  @Input() budgetId: string;

  @Output() budgetSubmitted = new EventEmitter();

  balanceTable$!: Observable<BudgetRowYear[]>;
  balance$!     : Observable<BudgetRowYear>;

  tableType = BudgetRowType.Result;

  constructor(private _dialog: MatDialog)
  { }

  ngOnInit() {
    this.balanceTable$ = this.state$.pipe(map(res => [res.scopedCostTotals, res.scopedIncomeTotals].concat(res.scopedChildBudgets).concat([res.scopedResult])));
    this.balance$      = this.state$.pipe(map(res => res.scopedBalance));
  }

  linkChildModal() 
  {
    this._dialog.open( LinkBudgetModalComponent, 
        { data: this.budgetId })
    .afterClosed();
  }

  downloadExcelFile() {
    console.log('Service does not exist');
  }

  submitBudget() {
    this.budgetSubmitted.emit();
  }

  ngOnDestroy(): void {
    if(this._sBs)
      this._sBs.unsubscribe();
  }
}
