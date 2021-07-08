import { BigNumber, utils } from 'ethers';
import { waffle } from 'hardhat';
import TestEnv from './types/TestEnv';
import { RAY, SECONDSPERDAY } from './utils/constants';
import { setTestEnv } from './utils/testEnv';
import { getTimestamp, toTimestamp } from './utils/time';
import { expectDataAfterStake } from './utils/expect';
import { getPoolData, getUserData } from './utils/helpers';
require('./utils/matchers.ts');

import { expect } from 'chai';

describe('StakingPool.stake', () => {
  let testEnv: TestEnv;

  const provider = waffle.provider;
  const [deployer, alice, bob, carol] = provider.getWallets();

  const rewardPersecond = BigNumber.from(utils.parseEther('1'));
  const year = BigNumber.from(2022);
  const month = BigNumber.from(7);
  const day = BigNumber.from(7);
  const duration = BigNumber.from(30);

  const startTimestamp = toTimestamp(year, month, day);
  const endTimestamp = startTimestamp.add(BigNumber.from(SECONDSPERDAY).mul(duration));

  beforeEach('deploy staking pool', async () => {
    testEnv = await setTestEnv();
    await testEnv.stakingAsset.connect(alice).faucet();
  });

  it('reverts if the round has not initiated', async () => {
    await expect(
      testEnv.stakingPool.connect(alice).stake(utils.parseEther('100'))
    ).to.be.revertedWith('StakingNotInitiated');
  });

  context('when the first round initiated', async () => {
    beforeEach('init the first round', async () => {
      await testEnv.stakingPool
        .connect(deployer)
        .initNewRound(rewardPersecond, year, month, day, duration);
      await testEnv.stakingAsset.connect(alice).approve(testEnv.stakingPool.address, RAY);
    });
    it('reverts if user staking amount is 0', async () => {
      await expect(testEnv.stakingPool.connect(alice).stake(0)).to.be.revertedWith('InvaidAmount');
    });

    it('success', async () => {
      const poolDataBefore = await getPoolData(testEnv);
      const userDataBefore = await getUserData(testEnv, alice);
      const stakeAmount = utils.parseEther('100');
      await testEnv.stakingAsset.connect(alice).approve(testEnv.stakingPool.address, stakeAmount);
      const stakeTx = await testEnv.stakingPool.connect(alice).stake(stakeAmount);

      const [expectedPoolData, expectedUserData] = expectDataAfterStake(
        poolDataBefore,
        userDataBefore,
        await getTimestamp(stakeTx),
        stakeAmount
      );

      const poolDataAfter = await getPoolData(testEnv);
      const userDataAfter = await getUserData(testEnv, alice);

      expect(poolDataAfter).to.be.equalPoolData(expectedPoolData);
      expect(userDataAfter).to.be.equalUserData(expectedUserData);
    });
  });

  context('stake scenario', async () => {
    const stakeAmount = utils.parseEther('100');
    beforeEach('init the first round', async () => {
      await testEnv.stakingPool
        .connect(deployer)
        .initNewRound(rewardPersecond, year, month, day, duration);

      await testEnv.stakingAsset.connect(alice).faucet();
      await testEnv.stakingAsset.connect(alice).approve(testEnv.stakingPool.address, RAY);
      await testEnv.stakingAsset.connect(bob).faucet();
      await testEnv.stakingAsset.connect(bob).approve(testEnv.stakingPool.address, RAY);
    });
    it('first stake and second stake', async () => {
      await testEnv.stakingPool.connect(alice).stake(stakeAmount);

      const poolDataBefore = await getPoolData(testEnv);
      const userDataBefore = await getUserData(testEnv, alice);
      const stakeTx = await testEnv.stakingPool.connect(alice).stake(stakeAmount);

      const [expectedPoolData, expectedUserData] = expectDataAfterStake(
        poolDataBefore,
        userDataBefore,
        await getTimestamp(stakeTx),
        stakeAmount
      );

      const poolDataAfter = await getPoolData(testEnv);
      const userDataAfter = await getUserData(testEnv, alice);
      expect(poolDataAfter).to.be.equalPoolData(expectedPoolData);
      expect(userDataAfter).to.be.equalUserData(expectedUserData);
    });
  });
});
