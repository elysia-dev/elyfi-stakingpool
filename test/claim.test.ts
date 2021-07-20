import { BigNumber, ethers, utils } from 'ethers';
import { waffle } from 'hardhat';
import TestEnv from './types/TestEnv';
import { RAY, SECONDSPERDAY } from './utils/constants';
import { setTestEnv } from './utils/testEnv';
import { advanceTimeTo, getTimestamp, toTimestamp } from './utils/time';
import {
  expectDataAfterClaim,
  expectDataAfterStake,
  expectDataAfterWithdraw,
} from './utils/expect';
import { getPoolData, getUserData } from './utils/helpers';
require('./utils/matchers.ts');

import { expect } from 'chai';

describe('StakingPool.claim reward', () => {
  let testEnv: TestEnv;
  let currentRound: number;

  const provider = waffle.provider;
  const [deployer, alice, bob, carol] = provider.getWallets();

  const firstRound = {
    rewardPersecond: BigNumber.from(utils.parseEther('1')),
    year: BigNumber.from(2022),
    month: BigNumber.from(7),
    day: BigNumber.from(7),
    duration: BigNumber.from(30),
  };

  const startTimestamp = toTimestamp(firstRound.year, firstRound.month, firstRound.day);
  const endTimestamp = startTimestamp.add(BigNumber.from(SECONDSPERDAY).mul(firstRound.duration));

  const amount = ethers.utils.parseEther('1');

  beforeEach('deploy staking pool and init first round', async () => {
    testEnv = await setTestEnv();
    await testEnv.rewardAsset.connect(deployer).transfer(testEnv.stakingPool.address, RAY);
    await testEnv.stakingPool
      .connect(deployer)
      .initNewRound(
        firstRound.rewardPersecond,
        firstRound.year,
        firstRound.month,
        firstRound.day,
        firstRound.duration
      );
    await testEnv.stakingAsset.connect(alice).faucet();
    await testEnv.stakingAsset.connect(alice).approve(testEnv.stakingPool.address, RAY);
    await testEnv.stakingAsset.connect(bob).faucet();
    const tx = await testEnv.stakingAsset.connect(bob).approve(testEnv.stakingPool.address, RAY);
    currentRound = await testEnv.stakingPool.currentRound();
    await advanceTimeTo(await getTimestamp(tx), startTimestamp);
  });

  context('first claim', async () => {
    it('reverts if invalid round', async () => {
      await expect(testEnv.stakingPool.connect(alice).claim(currentRound + 1)).to.be.revertedWith(
        'NotInitiatedRound'
      );
    });
    it('reverts if user reward is 0', async () => {
      await expect(testEnv.stakingPool.connect(alice).claim(currentRound)).to.be.revertedWith(
        'ZeroReward'
      );
    });
    beforeEach('user stakes', async () => {
      await testEnv.stakingPool.connect(alice).stake(amount);
    });

    it.only('success', async () => {
      const poolDataBefore = await getPoolData(testEnv);
      const userDataBefore = await getUserData(testEnv, alice);

      const claimTx = await testEnv.stakingPool.connect(alice).claim(currentRound);

      const [expectedPoolData, expectedUserData] = expectDataAfterClaim(
        poolDataBefore,
        userDataBefore,
        await getTimestamp(claimTx)
      );

      const poolDataAfter = await getPoolData(testEnv);
      const userDataAfter = await getUserData(testEnv, alice);

      console.log('contract', userDataAfter.userReward.toString());
      console.log(
        'contract getReward',
        (await testEnv.stakingPool.getUserReward(alice.address, currentRound)).toString()
      );
      console.log((await getTimestamp(claimTx)).toString());

      expect(poolDataAfter).to.be.equalPoolData(expectedPoolData);
      expect(userDataAfter).to.be.equalUserData(expectedUserData);
    });
  });

  context('when user reward is not 0', async () => {
    it('success', async () => {});
  });
});
