import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { getContractAt } from 'hardhat-deploy-ethers/dist/src/helpers';

import { ethers } from 'hardhat';

export const deployTestnet: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const stakingAsset = await getStakingAsset(hre, deployer);

  const rewardAsset = getRewardAsset(hre, deployer);

  const stakingPool = await deploy('StakingPool', {
    from: deployer,
    args: [stakingAsset.address, rewardAsset.address],
    log: true,
  });

  if (hre.network.name === 'ganache') return;

  await hre.run('etherscan-verify', {
    network: hre.network.name,
  });
};

deployTestnet.tags = ['testnet'];

export const deployMainnet: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const stakingAsset = await getStakingAsset(hre, deployer);

  const rewardAsset = getRewardAsset(hre, deployer);

  const stakingPool = await deploy('StakingPool', {
    from: deployer,
    args: [stakingAsset.address, rewardAsset.address],
    log: true,
  });

  if (hre.network.name === 'ganache') return;

  await hre.run('etherscan-verify', {
    network: hre.network.name,
  });
};

deployTestnet.tags = ['mainnet'];
