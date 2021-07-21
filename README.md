# elyfi-stakingpool

Elyfi staking pool

## Deploy

```
#Deploy on live network
yarn hardhat deploy --network networkname --tags {elPool | elyfiPool}
(networkname : mainnet | ropsten | ... )

#Deploy on local network
yarn hardhat deploy --network networkname --tags testPool
(networkname : hardhat | ganache)
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
