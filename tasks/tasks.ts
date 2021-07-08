import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import path from 'path';
import fs from 'fs';
import { DeployedContract } from 'hardhat-deploy/types';
import { StakingPool } from '../typechain';
import { getContractAt } from 'hardhat-deploy-ethers/dist/src/helpers';
import * as roundData from '../data/rounds';

interface Args {
  round: string;
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

    const round = roundData[args.round] as roundData.InitRoundData;

    const initTx = await stakingPool.initNewRound(
      round.rewardPerSecond,
      round.year,
      round.month,
      round.day,
      round.duration
    );
    await initTx.wait();

    console.log('Round initiated');
  });
