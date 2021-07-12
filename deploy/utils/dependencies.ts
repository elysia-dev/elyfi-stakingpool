import { Contract } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { AssetData } from '../../data/types/AssetData';

export const getStakingAsset = async (hre: HardhatRuntimeEnvironment) => {
  let stakingAsset: Contract;

  // Need refactor
  const data: AssetData = require('../../data/assets/el').default;

  stakingAsset = await hre.ethers.getContractAt(
    data[hre.network.name].abi,
    data[hre.network.name].address
  );
  return stakingAsset;
};

export const getRewardAsset = async (hre: HardhatRuntimeEnvironment) => {
  let stakingAsset: Contract;

  // Need refactor
  const data: AssetData = require('../../data/assets/elyfi').default;

  stakingAsset = await hre.ethers.getContractAt(
    data[hre.network.name].abi,
    data[hre.network.name].address
  );
  return stakingAsset;
};
