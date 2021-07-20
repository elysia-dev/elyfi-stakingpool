import { BigNumber, ethers, utils } from 'ethers';
import { waffle } from 'hardhat';
import TestEnv from './types/TestEnv';
import { RAY, SECONDSPERDAY } from './utils/constants';
import { setTestEnv } from './utils/testEnv';
import { advanceTimeTo, getTimestamp, toTimestamp } from './utils/time';
import { expectDataAfterClaim } from './utils/expect';
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
  );

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
    firstRound = await testEnv.stakingPool.firstRound();
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
    it('reverts if user reward is 0', async () => {
      await expect(testEnv.stakingPool.connect(alice).claim(firstRound)).to.be.revertedWith(
        'ZeroReward'
      );
    });
    beforeEach('user stakes', async () => {
      await testEnv.stakingPool.connect(alice).stake(amount);
    });

    it('success', async () => {
      const poolDataBefore = await getPoolData(testEnv);
      const userDataBefore = await getUserData(testEnv, alice);

      const claimTx = await testEnv.stakingPool.connect(alice).claim(firstRound);

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
        (await testEnv.stakingPool.getUserReward(alice.address, firstRound)).toString()
      );
      console.log((await getTimestamp(claimTx)).toString());

      expect(poolDataAfter).to.be.equalPoolData(expectedPoolData);
      expect(userDataAfter).to.be.equalUserData(expectedUserData);
    });
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
