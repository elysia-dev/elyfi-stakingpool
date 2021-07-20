# elyfi-stakingpool

Elyfi staking pool

## Deploy

```
#Deploy on live network(mainnet | ropsten)
yarn hardhat --network networkname --tags {elPool | elyfiPool}

#Deploy on local network(hardhat | ganache)
yarn hardhat --network networkname --tags testPool
```

## Test

```
yarn test test/*.test.ts
```

## Task

```
# Init New Round
yarn hardhat --network networkname testnet:initNewRound --round {first|second|third...}
```
