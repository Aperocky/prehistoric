import { Person, PersonUtil } from "./people/person";
import * as lang from "./utilities/langutil";

export type MarketConditions = {
    supply: { [resource: string]: number };
    demand: { [resource: string]: number };
    liquidity: { [resource: string]: number };
    pricing: { [resource: string]: number };
    activity: { [resource: string]: number };
}

function determine_pricing(start_price: number, total_supply: number, total_demand: number, budget_quant_pairs): number {
    // Determine market price by binary search
    // Goal: sell more than 70% of the demand or supply, which ever is less, but not over 100%.
    let satisfy_condition = (pct_sup, pct_dem) => {
        if (pct_sup > 70 || pct_dem > 70) {
            return true;
        }
        return false;
    }
    let overflow_condition = (pct_sup) => {
        if (pct_sup > 100) {
            return true;
        }
        return false;
    }
    let curr_price = start_price;
    let prev_price = start_price*2; // Prev price to always be higher
    let prev_pct_sup = 0;
    let prev_pct_dem = 0;
    let iter_count = 0;
    while (true) {
        iter_count++;
        if (iter_count > 10) {
            return curr_price;
        }
        let sum_sold = 0;
        for (let pair of budget_quant_pairs) {
            let total = pair["demand"] * curr_price;
            sum_sold += total > pair["budget"] ? pair["budget"]/curr_price : pair["demand"];
        }
        let pct_sup = sum_sold/total_supply * 100;
        let pct_dem = sum_sold/total_demand * 100;
        if (satisfy_condition(pct_sup, pct_dem)) {
            if (overflow_condition(pct_sup)) {
                // Keep prev_price same as overflow means we need a higher price to reduce demand.
                curr_price = (curr_price + prev_price)/2;
            } else {
                return curr_price;
            }
        } else {
            if (pct_sup - prev_pct_sup < 5 && pct_dem - prev_pct_dem < 5) {
                return prev_price; // No need to change the price by half for <5% of customer/seller
            }
            prev_price = curr_price;
            curr_price = curr_price/2;
        }
        prev_pct_sup = pct_sup;
        prev_pct_dem = pct_dem;
    }
    return 0;
}

export function get_supply_and_demand(people: Person[], simulation) : MarketConditions {
    // Hard code here for resource types.
    let all_resource_types = ["FOOD", "WOOD", "TOOL"];
    let supply: { [resource: string]: number } = {};
    let demand: { [resource: string]: number } = {};
    let liquidity: { [resource: string]: number } = {};
    let budget_quant_pair: { [resource: string]: any[] }= {"FOOD": [], "WOOD": [], "TOOL": []};
    for (let person of people) {
        person.surplus = PersonUtil.get_surplus_resources(person);
        person.demand = PersonUtil.get_demand_resources(person, simulation.genealogy);
        person.budget = PersonUtil.get_available_budget(person);
        lang.obj_addition(supply, person.surplus);
        lang.obj_addition(demand, person.demand);
        lang.obj_addition(liquidity, person.budget);
        for (let restype of all_resource_types) {
            if (restype in person.demand && restype in person.budget) {
                let pair = {"demand": person.demand[restype], "budget": person.budget[restype]};
                budget_quant_pair[restype].push(pair);
            }
        }
    }

    // Calculate binary interation start price, conservative to never exceed demand so binary search only need to search down
    // price = budget/supply (If demand > supply)
    // price = budget/supply*demand/supply (If demand < supply)

    let pricing = {};
    for (let resource_type of all_resource_types) {
        let budget_quant_pairs = budget_quant_pair[resource_type];
        let resource_supply = supply[resource_type] ? supply[resource_type] : 0;
        let resource_demand = demand[resource_type] ? demand[resource_type] : 0;
        let resource_budget = liquidity[resource_type] ? liquidity[resource_type] : 0;
        let resource_demand_scale = resource_demand > resource_supply ? 1 : resource_demand/resource_supply;
        let resource_patched_supply = resource_supply + 0.01; // Don't divide by 0
        let resource_price = resource_budget / resource_patched_supply * resource_demand_scale;
        if (resource_supply > 0) {
            resource_price = determine_pricing(resource_price, resource_supply, resource_demand, budget_quant_pairs);
        }
        pricing[resource_type] = resource_price;
        supply[resource_type] = resource_supply;
        demand[resource_type] = resource_demand;
        liquidity[resource_type] = resource_budget;
    }
    return {
        supply: supply,
        demand: demand,
        liquidity: liquidity,
        pricing: pricing,
        activity: {},
    }
}

export function do_business(people: Person[], market_condition: MarketConditions) : void {
    // BUY up until budget runs out, or demand has been reached.
    let total_bought : { [resource: string] : number } = {FOOD: 0, WOOD: 0, TOOL: 0} // Just initiate here to avoid nasty
    for (let person of people) {
        // Clear transactions
        person.transactions = {}
        for (let [rtype, rd] of Object.entries(person.demand)) {
            if (market_condition.supply[rtype] == 0) {
                continue;
            }
            let res_budget = person.budget[rtype] ? person.budget[rtype] : 0;
            let curr_wallet = person.store["GOLD"] ? person.store["GOLD"] : 0;
            let spend_mark = curr_wallet > res_budget ? res_budget : curr_wallet;
            if (spend_mark == 0) {
                continue;
            }
            let rprice = market_condition.pricing[rtype];
            if (rprice == 0) {
                continue; // Shouldn't ever get here, safeguard nonetheless
            }
            let potential_purchase = spend_mark/rprice;
            let purchase_amount = potential_purchase > rd ? rd : potential_purchase; // Buy up to demand.
            let real_spending = purchase_amount * rprice;
            lang.add_value(person.store, "GOLD", -real_spending, "SPENDING MONEY");
            lang.add_value(person.store, rtype, purchase_amount, "BAGGING BOUGHT");
            total_bought[rtype] += purchase_amount;
            if ("BUY" in person.transactions) {
                person.transactions["BUY"][rtype] = [purchase_amount, real_spending] as number[];
            } else {
                person.transactions["BUY"] = {};
                person.transactions["BUY"][rtype] = [purchase_amount, real_spending] as number[];
            }
        }
    }

    let scale : { [resource: string] : number } = {};
    for (let [rtype, rb] of Object.entries(total_bought)) {
        let scale_factor = rb / (market_condition.supply[rtype] + 0.01);
        scale[rtype] = scale_factor;
    }
    for (let person of people) {
        for (let [rtype, rs] of Object.entries(person.surplus)) {
            let rprice = market_condition.pricing[rtype];
            if (rprice == 0) {
                continue;
            }
            let total_sold = scale[rtype] * rs;
            let sold_for = total_sold * rprice;
            lang.add_value(person.store, rtype, -total_sold, "SELLING RESOURCES");
            lang.add_value(person.store, "GOLD", sold_for, "REAPING PROFIT");
            if ("SELL" in person.transactions) {
                person.transactions["SELL"][rtype] = [total_sold, sold_for] as number[];
            } else {
                person.transactions["SELL"] = {};
                person.transactions["SELL"][rtype] = [total_sold, sold_for] as number[];
            }
        }
    }
    market_condition.activity = total_bought;
}
