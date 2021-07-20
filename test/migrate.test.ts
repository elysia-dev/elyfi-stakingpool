import { BigNumber, ethers, utils } from 'ethers';
import { waffle } from 'hardhat';
import TestEnv from './types/TestEnv';
import { RAY, SECONDSPERDAY } from './utils/constants';
import { setTestEnv } from './utils/testEnv';
import { advanceTimeTo, getTimestamp, toTimestamp } from './utils/time';
import { expectDataAfterClaim, expectDataAfterMigrate } from './utils/expect';
import { getPoolData, getUserData } from './utils/helpers';
require('./utils/matchers.ts');

import { expect } from 'chai';

describe('StakingPool.claim reward', () => {
  let testEnv: TestEnv;
  let firstRound: number;
  let secondRound: number;

  const provider = waffle.provider;
  const [deployer, alice, bob, carol] = provider.getWallets();

  const firstRoundInit = {
    rewardPersecond: BigNumber.from(utils.parseEther('1')),
    year: BigNumber.from(2022),
    month: BigNumber.from(7),
    day: BigNumber.from(7),
    duration: BigNumber.from(30),
  };

  const secondRoundInit = {
    rewardPersecond: BigNumber.from(utils.parseEther('1')),
    year: BigNumber.from(2022),
    month: BigNumber.from(9),
    day: BigNumber.from(7),
    duration: BigNumber.from(30),
  };

  const firstRoundStartTimestamp = toTimestamp(
    firstRoundInit.year,
    firstRoundInit.month,
    firstRoundInit.day
  );
  const secondRoundStartTimestamp = toTimestamp(
    secondRoundInit.year,
    secondRoundInit.month,
    secondRoundInit.day
  ).add(10);

  const amount = ethers.utils.parseEther('1');

  beforeEach('deploy staking pool and init first round', async () => {
    testEnv = await setTestEnv();
    await testEnv.rewardAsset.connect(deployer).transfer(testEnv.stakingPool.address, RAY);
    await testEnv.stakingPool
      .connect(deployer)
      .initNewRound(
        firstRoundInit.rewardPersecond,
        firstRoundInit.year,
        firstRoundInit.month,
        firstRoundInit.day,
        firstRoundInit.duration
      );
    await testEnv.stakingAsset.connect(alice).faucet();
    await testEnv.stakingAsset.connect(alice).approve(testEnv.stakingPool.address, RAY);
    await testEnv.stakingAsset.connect(bob).faucet();
    const tx = await testEnv.stakingAsset.connect(bob).approve(testEnv.stakingPool.address, RAY);
    firstRound = await testEnv.stakingPool.currentRound();
    await advanceTimeTo(await getTimestamp(tx), firstRoundStartTimestamp);
  });

  it('reverts if migrates current or scheduled round', async () => {
    await expect(testEnv.stakingPool.connect(alice).migrate(0, firstRound)).to.be.revertedWith(
      'NotInitiatedRound'
    );
    await expect(testEnv.stakingPool.connect(alice).migrate(0, firstRound + 1)).to.be.revertedWith(
      'NotInitiatedRound'
    );
  });

  context('second round initiated', async () => {
    beforeEach('user interactions and init second round', async () => {
      await testEnv.stakingPool.connect(alice).stake(amount.mul(3));
      await testEnv.stakingPool.connect(bob).stake(amount.mul(2));
      const tx = await testEnv.stakingPool
        .connect(deployer)
        .initNewRound(
          secondRoundInit.rewardPersecond,
          secondRoundInit.year,
          secondRoundInit.month,
          secondRoundInit.day,
          secondRoundInit.duration
        );
      await advanceTimeTo(await getTimestamp(tx), secondRoundStartTimestamp);
    });
    it.only('success when user migrate all', async () => {
      const fromPoolDataBefore = await getPoolData(testEnv, firstRound);
      const fromUserDataBefore = await getUserData(testEnv, alice, firstRound);

      const toPoolDataBefore = await getPoolData(testEnv, secondRound);
      const toUserDataBefore = await getUserData(testEnv, alice, secondRound);

      console.log('migrationTx start!');
      const migrateTx = await testEnv.stakingPool.connect(alice).migrate(amount.mul(3), firstRound);
      console.log('migrationTx end!');
      const [
        [expectedFromPoolData, expectedFromUserData],
        [expectedToPoolData, expectedToUserData],
      ] = expectDataAfterMigrate(
        fromPoolDataBefore,
        fromUserDataBefore,
        toPoolDataBefore,
        toUserDataBefore,
        await getTimestamp(migrateTx),
        amount.mul(3)
      );

      const fromPoolDataAfter = await getPoolData(testEnv, firstRound);
      const fromUserDataAfter = await getUserData(testEnv, alice, firstRound);

      const toPoolDataAfter = await getPoolData(testEnv, secondRound);
      const toUserDataAfter = await getUserData(testEnv, alice, secondRound);

      expect(fromPoolDataAfter).to.be.equalPoolData(expectedFromPoolData);
      expect(fromUserDataAfter).to.be.equalUserData(expectedFromUserData);
      expect(toPoolDataAfter).to.be.equalPoolData(expectedToPoolData);
      expect(toUserDataAfter).to.be.equalUserData(expectedToUserData);
    });
    it('success', async () => {});
  });

  context('claim scenario', async () => {
    it('success', async () => {});
  });
});

describe('StakingPool.migrate', () => {
  context('Reward claim in migration', async () => {
    it('not emit Claim event when user reward is 0', async () => {});
  });

  context('Withdraw in migrations', async () => {
    it('not emit Withdrawal event when user withdrawl amount is 0', async () => {});
  });

  context('when current round is over', async () => {
    it('success', async () => {});

    it('reverts when user has already migrated', async () => {});
  });
});
