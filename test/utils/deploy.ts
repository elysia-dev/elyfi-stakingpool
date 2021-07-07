import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import {
  StakingAsset,
  RewardAsset,
  StakingPool,
  StakingPool__factory,
  StakingAsset__factory,
  RewardAsset__factory,
} from '../../typechain';

export const setRewardAsset = async (): Promise<RewardAsset> => {
  let rewardAsset: RewardAsset;

  const rewardAssetFactory = (await ethers.getContractFactory(
    'RewardAsset'
  )) as RewardAsset__factory;

  rewardAsset = await rewardAssetFactory.deploy();

  return rewardAsset;
};

export const setStakingAsset = async (): Promise<StakingAsset> => {
  let stakingAsset: StakingAsset;

  const stakingAssetFactory = (await ethers.getContractFactory(
    'StakingAsset'
  )) as StakingAsset__factory;

  stakingAsset = await stakingAssetFactory.deploy();

  return stakingAsset;
};

export const setStakingPool = async (
  stakingAsset: StakingAsset,
  rewardAsset: RewardAsset,
  amountPerSecond: BigNumber
): Promise<StakingPool> => {
  let stakingPool: StakingPool;

  const stakingPoolFactory = (await ethers.getContractFactory(
    'StakingPool'
  )) as StakingPool__factory;

  stakingPool = await stakingPoolFactory.deploy(
    stakingAsset.address,
    rewardAsset.address,
    amountPerSecond
  );

  return stakingPool;
};

export const testenv = ()
