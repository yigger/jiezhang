import Request from './request'
import Statement from './logic/statement'
import Main from './logic/main'
import User from './logic/user'
import Category from './logic/category'
import Asset from './logic/asset'
import AccountBook from './logic/account_book'
import Finance from './logic/finance'
import SuperStatement from './logic/superStatement'
import SuperChart from './logic/superChart'
import Budget from './logic/budget'
import Chaos from './logic/chaos'
import Statistic from './logic/statistic'
import Message from './logic/message'
import Payee from './logic/payee'
import Friend from './logic/friend'

export class Api extends Request {
  private createLazyService<T>(key: string, Constructor: new (api: Api) => T): T {
    if (!this[key]) {
      this[key] = new Constructor(this)
    }
    return this[key]
  }

  get main(): Main {
    return this.createLazyService('_main', Main)
  }

  get statements(): Statement {
    return this.createLazyService('_statement', Statement)
  }

  get users(): User {
    return this.createLazyService('_user', User)
  }

  get categories(): Category {
    return this.createLazyService('_category', Category)
  }

  get assets(): Asset {
    return this.createLazyService('_asset', Asset)
  }

  get account_books(): AccountBook {
    return this.createLazyService('_account_book', AccountBook)
  }

  get finances(): Finance {
    return this.createLazyService('_finance', Finance)
  }

  get superStatements(): SuperStatement {
    return this.createLazyService('_super_statement', SuperStatement)
  }

  get superCharts(): SuperChart {
    return this.createLazyService('_super_chart', SuperChart)
  }

  get budgets(): Budget {
    return this.createLazyService('_budget', Budget)
  }
  
  get chaos(): Chaos {
    return this.createLazyService('_chaos', Chaos)
  }

  get statistics(): Statistic {
    return this.createLazyService('_statistic', Statistic)
  }

  get messages(): Message {
    return this.createLazyService('_message', Message)
  }

  get payees(): Payee {
    return this.createLazyService('_payee', Payee)
  }

  get friends(): Friend {
    return this.createLazyService('_friend', Friend)
  }
}