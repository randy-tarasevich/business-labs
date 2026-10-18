// Registry: maps the `component` field in a tool's frontmatter to its Astro component.
// To add a tool: create the component, import it here, and add a markdown file in src/content/tools/.
import BreakEven from './BreakEven.astro';
import ClassTimer from './ClassTimer.astro';
import BudgetBalancer from './BudgetBalancer.astro';
import StartupRunway from './StartupRunway.astro';
import InvestorDeal from './InvestorDeal.astro';
import AccountingEquation from './AccountingEquation.astro';
import FinancialStatements from './FinancialStatements.astro';
import InventoryMethods from './InventoryMethods.astro';
import Depreciation from './Depreciation.astro';
import RatioDashboard from './RatioDashboard.astro';
import PriceDemand from './PriceDemand.astro';
import MarketingFunnel from './MarketingFunnel.astro';
import CurrencyTrade from './CurrencyTrade.astro';
import ComparativeAdvantage from './ComparativeAdvantage.astro';
import MarketEntry from './MarketEntry.astro';

export const TOOL_COMPONENTS = {
  BreakEven,
  ClassTimer,
  BudgetBalancer,
  StartupRunway,
  InvestorDeal,
  AccountingEquation,
  FinancialStatements,
  InventoryMethods,
  Depreciation,
  RatioDashboard,
  PriceDemand,
  MarketingFunnel,
  CurrencyTrade,
  ComparativeAdvantage,
  MarketEntry,
};
