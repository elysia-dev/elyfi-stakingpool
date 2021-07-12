import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { getRewardAsset, getStakingAsset } from './utils/dependencies';

export const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const stakingAsset = await getStakingAsset(hre);

  const rewardAsset = await getRewardAsset(hre);

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

deploy.tags = ['testnet'];
