import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import path from 'path';
import { DeployedContract } from 'hardhat-deploy/types';
import { StakingPool } from '../typechain';
import { getContractAt } from 'hardhat-deploy-ethers/dist/src/helpers';
import * as rounds from '../data/rounds';

interface Args {
  round: keyof typeof rounds;
}

task('testnet:initNewRound', 'Initiate staking round')
  .addParam('round', 'The round to initiate, first, second, third... ')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let stakingPool: StakingPool;
    const [deployer] = await hre.ethers.getSigners();

    const contractPath = path.join(__dirname, '..', 'deployments', hre.network.name);

    const deployedStakingPool = require(path.join(contractPath, 'StakingPool')) as DeployedContract;

    stakingPool = (await getContractAt(
      hre,
      deployedStakingPool.abi,
      deployedStakingPool.address,
      deployer
    )) as StakingPool;

    const roundData: rounds.InitRoundData = rounds[args.round];

    console.log(roundData.rewardPerSecond);

    const initTx = await stakingPool.initNewRound(
      roundData.rewardPerSecond,
      roundData.year,
      roundData.month,
      roundData.day,
      roundData.duration
    );
    await initTx.wait();

    console.log('Round initiated');
  });
