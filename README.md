A map generator that simulates people and early civilizations.

http://aperocky.com/prehistoric

![Life of Amy Freeman](/md_images/3.png)
The current economic condition of Amy the lumberjack

![Market Economy](/md_images/4.png)
The general economy of the prehistoric world in year 249 AD.

![Growth](/md_images/2.png)
The world has grown a lot by 650 AD

![Family](/md_images/0.png)
Peek in the life of individual families - And see where siblings end up.

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

Existing stockpiles don't last forever, as things break and food go bad and gold starts becoming worthless.

## TODO

Empire pack where wealth cities start organizing senate and soldiers to establish their own country - and rival towns the same.


## Deprecation

The code got messy and I had less spare time, but I plan to give this project another go since the holiday seasons are rolling around. 

However the structure was not well designed to begin with. The project got increasingly harder to work with on such basis so I'm deciding to restart the project on a similar structure to `hydro-sim`. Where things are more extensible and better defined. I had a lot of fun writing this and I'm looking forward to add the Empire feature to the build.

One more thing, `hydro-sim` worked fine on the new ARM64 mac but this project had trouble building. One more reason to start it anew.
