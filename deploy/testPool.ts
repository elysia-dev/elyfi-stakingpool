import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import {
  deployOrGetStakingAsset,
  deployOrGetRewardAsset,
  getStakingAsset,
} from '../utils/getDeployedContracts';
const testPool: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (hre.network.name == 'mainnet') {
    throw new Error('Testpool should not be deployed on the test network');
  }
  const { deployer } = await hre.getNamedAccounts();

  const { deploy } = hre.deployments;

  const stakingAsset = await getStakingAsset(hre);

  const rewardAsset = await getStakingAsset(hre);

  const stakingPool = await deploy('StakingPoolTest', {
    from: deployer,
    args: [stakingAsset.address, rewardAsset.address],
    log: true,
  });

  await stakingAsset.connect(deployer).transfer(stakingPool.address, '1' + '0'.repeat(27));

  await hre.run('etherscan-verify', {
    network: hre.network.name,
  });
};
testPool.tags = ['testPool'];

export default testPool;
