import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { getStakingAsset, getRewardAsset } from '../utils/getDeployedContracts';
const testPool: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (hre.network.name != 'ganache') {
    throw new Error('Testpool should be on the local network');
  }
  const { deployer } = await hre.getNamedAccounts();
  hre.deployments;
  const { deploy } = hre.deployments;

  const stakingAsset = await getStakingAsset(hre);

  const rewardAsset = await getRewardAsset(hre);

  const stakingPool = await deploy('StakingPool', {
    from: deployer,
    args: [stakingAsset.address, rewardAsset.address],
    log: true,
  });
};
testPool.tags = ['testPool'];

export default testPool;
