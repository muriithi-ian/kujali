import { Injectable } from "@angular/core";

import { Store } from "@iote/state";

import { BudgetsStore } from './budgets.store';
import { Budget, BudgetRecord, BudgetStatus, OrgBudgetsOverview } from "@app/model/finance/planning/budgets";

@Injectable()
export class OrgBudgetsStore extends Store<OrgBudgetsOverview>
{
  protected store = 'org-budget-store';

  constructor(budgets$$: BudgetsStore) 
  { 
    super(null as any);

    budgets$$.get()
      .subscribe(b => {
        const overview = this._createBudgetsOverview(b);  

        this.set(overview, 'FROM BUDGETS LOAD');
    });
  }


  private _createBudgetsOverview(budgets: Budget[]): OrgBudgetsOverview
  {
    if (budgets.length == 0)
      return { inUse: [], archived: [], underConstruction: [] };

    // Order of execution is important to lock in budgets!
    const inUse    = budgets.filter(b => b.status == BudgetStatus.InUse);
                          
    const archived = budgets.filter(b => b.status == BudgetStatus.Archived);
                                                                           // Neither status means deleted
    const rest     = budgets.filter(b => (b.status == BudgetStatus.Open || (b.status != BudgetStatus.Archived && b.status != BudgetStatus.InUse)) 
                                            && ! inUse.map(bx => bx.id).includes(b.id) 
                                              && ! archived.map(bx => bx.id).includes(b.id));

    return {
      inUse:  this._createRootTree(inUse, budgets),
      archived: this._createRootTree(archived, budgets),
      underConstruction: this._createRootTree(rest, budgets)
    }
  }

  private _createRootTree(filtered: Budget[], all: Budget[]): BudgetRecord[]
  {
    const roots = filtered.filter(f => ! _(all).flatMap(a => a.childrenList).includes(f.id));

    const mightBeChildren = all.filter(a => ! _.includes(roots.map(r => r.id), a.id));

    return roots.map(root => this._findChildren(root, mightBeChildren));
  }

  private _findChildren(current: Budget, availableNodes: Budget[], parentStatus?: BudgetStatus): BudgetRecord
  {
    // If status is not in use but parent status is locked -> Lock child as well
    if (current.status != BudgetStatus.InUse && parentStatus != null && parentStatus == BudgetStatus.InUse)
      current.status = BudgetStatus.InUse;
    
    const childNodes = availableNodes.filter(node => current.childrenList.includes(node.id as string));
    // Do not allow recursive budgets nor budgets inheriting their aunts/sisters.
    const childNodePossibleChildren = availableNodes.filter(n => n.id != current.id
                                                                    && !_.includes(current.childrenList, n.id));
    
    return {
      budget: current,
      status: current.status,

      children: childNodes.map(ch => this._findChildren(ch, childNodePossibleChildren, current.status)),

      lockedIn: current.status == BudgetStatus.InUse,
    }
  }
}