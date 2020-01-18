A map generator that aspire to also be simulating people and civilizations.

http://aperocky.com/prehistoric

## How it works

Different types of people (farmer, fisher, gatherer etc) put strength over an area of map.

The total sum of strength for each type of production is then turned into production of `$resource`. Only one type of production _mode_ per tile, the other types are discarded.

each person issue draft of resources to a number of area. These draft are then pooled together, the total production of that area are then distributed according to draft strength. This design allows non-resource producer to also get a slice of the pie. (i.e. bandits)

## TODO

Add buildings (town, farms)

Add types (bandit, police, trader)

Add resources (Currently food is the only resource)

Create market mechanism as a second mechanism to distribute production (probably incorporate new resource type gold).
