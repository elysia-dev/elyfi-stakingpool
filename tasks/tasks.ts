import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { StakingAsset, StakingPool } from '../typechain';
import * as rounds from '../data/rounds';
import { getStakingAsset, getStakingPool } from '../utils/getDeployedContracts';
import { utils } from 'ethers';

interface Args {
  round: keyof typeof rounds;
  amount: string;
}

task('testnet:initNewRound', 'Initiate staking round')
  .addParam('round', 'The round to initiate, first, second, third... ')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let stakingPool: StakingPool;
    const [deployer] = await hre.ethers.getSigners();

    stakingPool = await getStakingPool(hre);

    const roundData: rounds.InitRoundData = rounds[args.round];

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

task('testnet:stake', 'Stake asset')
  .addParam('amount', 'The amount to stake')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let stakingPool: StakingPool;
    const [deployer] = await hre.ethers.getSigners();
    const amount = utils.parseEther(args.amount);

    stakingPool = await getStakingPool(hre);

    const stakingAsset = (await getStakingAsset(hre)) as StakingAsset;

    if ((await stakingAsset.balanceOf(deployer.address)).lt(amount)) {
      const faucetTx = await stakingAsset.connect(deployer).faucet();
      await faucetTx.wait();
      console.log(`Account took faucet`);
    }

    if ((await stakingAsset.allowance(deployer.address, stakingPool.address)).lt(amount)) {
      const approveTx = await stakingAsset.connect(deployer).approve(stakingPool.address, amount);
      await approveTx.wait();
      console.log(`Account approved`);
    }

    const stakeTx = await stakingPool.connect(deployer).stake(amount);
    await stakeTx.wait();

    console.log(`Stake amount ${args.amount} success `);
  });

task('testnet:withdraw', 'Unstake asset')
  .addParam('amount', 'The amount to stake')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let stakingPool: StakingPool;
    const [deployer] = await hre.ethers.getSigners();

    stakingPool = await getStakingPool(hre);

    const amount = utils.parseEther(args.amount);

    const withdrawTx = await stakingPool.connect(deployer).withdraw(amount, 1);
    await withdrawTx.wait();

    console.log(`Withdraw amount ${args.amount} success `);
  });
