import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import {
  deployOrGetStakingAsset,
  deployOrGetRewardAsset,
  getStakingAsset,
} from '../utils/getDeployedContracts';
import { getElToken, getElyfi } from '../utils/getDependencies';
import { getDeployer } from '../utils/getWallet';

const testPool: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (hre.network.name == 'mainnet') {
    throw new Error('Testpool should not be deployed on the test network');
  }
  const deployer = await getDeployer(hre);

  const { deploy } = hre.deployments;

  const stakingAsset = await getElToken(hre);

  const rewardAsset = await getElyfi(hre);

  const stakingPool = await deploy('StakingPoolTest', {
    from: deployer.address,
    args: [stakingAsset.address, rewardAsset.address],
    log: true,
  });

  await stakingAsset.connect(deployer).transfer(stakingPool.address, '1' + '0'.repeat(26));

  await hre.run('etherscan-verify', {
    network: hre.network.name,
  });
};
testPool.tags = ['testPool'];

export default testPool;
