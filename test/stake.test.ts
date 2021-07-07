import { waffle } from 'hardhat';
import TestEnv from './types/TestEnv';
import { setTestEnv } from './utils/testEnv';
describe('StakingPool.stake', async () => {
  let testEnv: TestEnv = await setTestEnv();

  const provider = waffle.provider;
  const [deployer, depositor] = provider.getWallets();

  await testEnv.stakingAsset.connect(depositor).faucet();

  context('when current round is not over', async () => {
    it('reverts when user migrates', async () => {
        await testEnv.stakingPool.
    });
  });

  context('when current round is over', async () => {
    it('success', async () => {});

    it('reverts when user has migrated', async () => {});
  });
});
