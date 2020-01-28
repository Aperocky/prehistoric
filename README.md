A map generator that simulates people and early civilizations.

http://aperocky.com/prehistoric

![Market Economy](/md_images/0.png)
Economy of a thriving prehistoric community

![City Life](/md_images/3.png)
Town, cities and farms lead different lives.

![Carrie Baker](/md_images/5.png)
Checkout how Carrie Baker is doing.

## How it works

Different types of people (farmer, fisher, gatherer etc) put efforts to gather resources over an area of map.

The total sum of strength for each type of production is then turned into production of `$resource`. Only one type of production _mode_ per tile, the other types are discarded.

each person issue draft of resources to a number of area. These draft are then pooled together, the total production of that area are then distributed according to draft strength. This design allows non-resource producer to also get a slice of the pie. (i.e. bandits)

*Alternatively*, There are **private enteprise**, especially in resources that does not involve usage of public land, where person receive the fruit of their own labor, and then exchange it on the market for other resources.

When enough people of certain kind get together, buildings are created. Maintenance are used to determine it could upgrade, or downgrade.

### Market
---

Traders produce gold (or fiat currency, whatever, the inflation is huge), it is used to conduct trade.

Each person produce supply, demand and budget based on current stock, desired consumption and gold available.

It is then pooled together to create a market, prices can be extremely volatile! Usually, trader has a golden window where their need is fulfilled, during which exponential inflation happen. Gold supply then evens out and prices stablize.

## TODO

Named cities

More reporting, a ranked wealth of cities and individuals.

Types Coming soon:

    Craftswoman

Add resources:

    TOOL

Potentially create human intervention in form of government types and functions. Thinking of introducing taxman, bandits, and player decision on subsidies in next few iterations.

