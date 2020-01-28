A map generator that simulates people and early civilizations. Oh, and inflation.

http://aperocky.com/prehistoric

## How it works

Different types of people (farmer, fisher, gatherer etc) put efforts to gather resources over an area of map.

The total sum of strength for each type of production is then turned into production of `$resource`. Only one type of production _mode_ per tile, the other types are discarded.

each person issue draft of resources to a number of area. These draft are then pooled together, the total production of that area are then distributed according to draft strength. This design allows non-resource producer to also get a slice of the pie. (i.e. bandits)

When enough people of certain kind get together, buildings are created. Maintenance are used to determine it could upgrade, or downgrade.

### Market
---

Traders produce gold (or fiat currency, whatever, the inflation is huge), it is used to conduct trade.

Each person produce supply, demand and budget based on current stock, desired consumption and gold available.

It is then pooled together to create a market, prices can be extremely volatile!

## TODO

Named cities

More reporting, a ranked wealth of cities and individuals.

Types Coming soon:

    Craftswoman

Add resources:

    TOOL

Potentially create human intervention in form of government types and functions. Thinking of introducing taxman, bandits, and player decision on subsidies in next few iterations.

