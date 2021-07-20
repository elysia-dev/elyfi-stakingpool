import { Contract } from 'ethers';
import { DeployedContract } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import path from 'path';

export const getStakingPool = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const file =
    (require(getDeploymentPath(hre.network.name, stakingPool.StakingPool)) as DeployedContract) ||
    undefined;

  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  if (file == undefined) {
    const stakingAsset = await getStakingAsset(hre);
    const rewardAsset = await getRewardAsset(hre);
    const StakingPoolLocalDeploy = await deploy('StakingPool', {
      from: deployer,
      log: true,
      args: [stakingAsset.address, rewardAsset.address],
    });
    return await hre.ethers.getContractAt(
      StakingPoolLocalDeploy.abi,
      StakingPoolLocalDeploy.address
    );
  }

  return await hre.ethers.getContractAt(file.abi, file.address);
};

export const getStakingAsset = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const file =
    (require(getDeploymentPath(hre.network.name, stakingPool.StakingAsset)) as DeployedContract) ||
    undefined;

  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  if (file == undefined) {
    const StakingAssetLocalDeploy = await deploy('StakingAsset', {
      from: deployer,
      log: true,
    });
    return await hre.ethers.getContractAt(
      StakingAssetLocalDeploy.abi,
      StakingAssetLocalDeploy.address
    );
  }
  return await hre.ethers.getContractAt(file.abi, file.address);
};

export const getRewardAsset = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const file = require(getDeploymentPath(
    hre.network.name,
    stakingPool.RewardAsset
  )) as DeployedContract;
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  if (file == undefined) {
    const StakingAssetLocalDeploy = await deploy('RewardAsset', {
      from: deployer,
      log: true,
    });
    return await hre.ethers.getContractAt(
      StakingAssetLocalDeploy.abi,
      StakingAssetLocalDeploy.address
    );
  }

  return await hre.ethers.getContractAt(file.abi, file.address);
};

const stakingPool = {
  StakingPool: 'StakingPool.json',
  StakingAsset: 'StakingAsset.json',
  RewardAsset: 'RewardAsset.json',
};

const getDeploymentPath = (network: string, file: string) => {
  return path.join(__dirname, '..', '..', 'deployments', network, file);
};
