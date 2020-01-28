import { Person, PersonUtil } from "./person";
import * as lang from "./utilities/langutil";

export type MarketConditions = {
    supply: { [resource: string]: number };
    demand: { [resource: string]: number };
    liquidity: { [resource: string]: number };
    pricing: { [resource: string]: number };
    activity: { [resource: string]: number };
}

function obj_addition(sumobj: { [resource: string]: number }, indobj: { [resource: string]: number }) : void {
    for (let [rtype, rcount] of Object.entries(indobj)) {
        if (rtype in sumobj) {
            sumobj[rtype] += rcount;
        } else {
            sumobj[rtype] = rcount;
        }
    }
}

export function get_supply_and_demand(people: Person[]) : MarketConditions {
    let supply:{ [resource: string]: number } = {};
    let demand:{ [resource: string]: number } = {};
    let liquidity:{ [resource: string]: number } = {};
    for (let person of people) {
        person.surplus = PersonUtil.get_surplus_resources(person);
        person.demand = PersonUtil.get_demand_resources(person);
        person.budget = PersonUtil.get_available_budget(person);
        obj_addition(supply, person.surplus);
        obj_addition(demand, person.demand);
        obj_addition(liquidity, person.budget);
    }
    // Calculate pricing
    // demand/supply/supply*budget < Too people unfriendly
    // resource price = budget/supply
    // Total sale will be (supply*supply)/demand when demand > supply, or just demand, it will always be le than supply.
    let pricing = {};
    // Hard code here for resource types.
    let all_resource_types = ["FOOD", "WOOD", "TOOL"];
    for (let resource_type of all_resource_types) {
        let resource_supply = supply[resource_type] ? supply[resource_type] : 0;
        let resource_demand = demand[resource_type] ? demand[resource_type] : 0;
        let resource_budget = liquidity[resource_type] ? liquidity[resource_type] : 0;
        let resource_patched_supply = resource_supply + 1; // Don't divide by 0
        let resource_price = resource_budget / resource_patched_supply;
        pricing[resource_type] = resource_price;
        // Proactively enforce market object nans
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
