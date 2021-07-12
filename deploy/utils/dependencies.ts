import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { AssetData } from '../../data/types/AssetData';

export const getStakingAsset = async (hre: HardhatRuntimeEnvironment) => {
  let stakingAsset: Contract;

  // Need refactor
  const data: AssetData = require('../../data/assets/el');

  stakingAsset = await hre.ethers.getContractAt(
    data[hre.network.name].abi,
    data[hre.network.name].address
  );
  return stakingAsset;
};

export const getRewardAsset = async (hre: HardhatRuntimeEnvironment) => {
  let stakingAsset: Contract;

  // Need refactor
  const data: AssetData = require('../../data/assets/elyfi');

  stakingAsset = await hre.ethers.getContractAt(
    data[hre.network.name].abi,
    data[hre.network.name].address
  );
  return stakingAsset;
};
