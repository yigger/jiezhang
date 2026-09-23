import AccountBook from './logic/account_book'
import Asset from './logic/asset'
import Budget from './logic/budget'
import Category from './logic/category'
import Chaos from './logic/chaos'
import Finance from './logic/finance'
import Friend from './logic/friend'
import Main from './logic/main'
import Message from './logic/message'
import Payee from './logic/payee'
import Statement from './logic/statement'
import Statistic from './logic/statistic'
import SuperChart from './logic/superChart'
import SuperStatement from './logic/superStatement'
import User from './logic/user'
import Request from './request'

export class Api extends Request {
  private _main?: Main
  private _statement?: Statement
  private _user?: User
  private _category?: Category
  private _asset?: Asset
  private _account_book?: AccountBook
  private _finance?: Finance
  private _super_statement?: SuperStatement
  private _super_chart?: SuperChart
  private _budget?: Budget
  private _chaos?: Chaos
  private _statistic?: Statistic
  private _message?: Message
  private _payee?: Payee
  private _friend?: Friend

  get main(): Main {
    return (this._main ??= new Main(this))
  }

  get statements(): Statement {
    return (this._statement ??= new Statement(this))
  }

  get users(): User {
    return (this._user ??= new User(this))
  }

  get categories(): Category {
    return (this._category ??= new Category(this))
  }

  get assets(): Asset {
    return (this._asset ??= new Asset(this))
  }

  get account_books(): AccountBook {
    return (this._account_book ??= new AccountBook(this))
  }

  get finances(): Finance {
    return (this._finance ??= new Finance(this))
  }

  get superStatements(): SuperStatement {
    return (this._super_statement ??= new SuperStatement(this))
  }

  get superCharts(): SuperChart {
    return (this._super_chart ??= new SuperChart(this))
  }

  get budgets(): Budget {
    return (this._budget ??= new Budget(this))
  }

  get chaos(): Chaos {
    return (this._chaos ??= new Chaos(this))
  }

  get statistics(): Statistic {
    return (this._statistic ??= new Statistic(this))
  }

  get messages(): Message {
    return (this._message ??= new Message(this))
  }

  get payees(): Payee {
    return (this._payee ??= new Payee(this))
  }

  get friends(): Friend {
    return (this._friend ??= new Friend(this))
  }
}
