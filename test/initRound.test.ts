import { BigNumber, ContractTransaction, utils } from 'ethers';
import { waffle } from 'hardhat';
import TestEnv from './types/TestEnv';
import { SECONDSPERDAY } from './utils/constants';
import { setTestEnv } from './utils/testEnv';
import { advanceTimeTo, getTimestamp, toTimestamp } from './utils/time';

const { expect } = require('chai');

describe('StakingPool.initRound', () => {
  let testEnv: TestEnv;

  const provider = waffle.provider;
  const [deployer, depositor] = provider.getWallets();

  const rewardPersecond = BigNumber.from(utils.parseEther('1'));
  const year = BigNumber.from(2022);
  const month = BigNumber.from(7);
  const day = BigNumber.from(7);
  const duration = BigNumber.from(30);

  const startTimestamp = toTimestamp(year, month, day);
  const endTimestamp = startTimestamp.add(BigNumber.from(SECONDSPERDAY).mul(duration));

  beforeEach(async () => {
    testEnv = await setTestEnv();
    await testEnv.stakingAsset.connect(depositor).faucet();
  });

  it('staking pool deployed', async () => {
    expect(await testEnv.stakingPool.stakingAsset()).to.be.equal(testEnv.stakingAsset.address);
    expect(await testEnv.stakingPool.rewardAsset()).to.be.equal(testEnv.rewardAsset.address);
  });

  context('when the staking pool deployed', async () => {
    it('reverts if general account initiate the round', async () => {
      await expect(
        testEnv.stakingPool
          .connect(depositor)
          .initNewRound(rewardPersecond, year, month, day, duration)
      ).to.be.reverted;
    });

    it('success', async () => {
      const initTx = await testEnv.stakingPool
        .connect(deployer)
        .initNewRound(rewardPersecond, year, month, day, duration);

      const poolData = await testEnv.stakingPool.getPoolData(1);

      expect(poolData.rewardPerSecond).to.be.equal(rewardPersecond);
      expect(poolData.rewardIndex).to.be.equal(0);
      expect(poolData.startTimestamp).to.be.equal(startTimestamp);
      expect(poolData.endTimestamp).to.be.equal(endTimestamp);
      expect(poolData.totalPrincipal).to.be.equal(0);
      expect(poolData.lastUpdateTimestamp).to.be.equal(await getTimestamp(initTx));
      expect(await testEnv.stakingPool.currentRound()).to.be.equal(1);
    });
    it('reverts if the next round initiated before the current round is over', async () => {
      await testEnv.stakingPool
        .connect(deployer)
        .initNewRound(rewardPersecond, year, month, day, duration);
      await expect(
        testEnv.stakingPool
          .connect(deployer)
          .initNewRound(rewardPersecond, year, month, day, duration)
      ).to.be.reverted;
    });
  });

  context('when current round is over', async () => {
    let initTx: ContractTransaction;
    const nextYear = year.add(1);
    const nextStartTimestamp = toTimestamp(year, month, day);
    const nextEndTimestamp = nextStartTimestamp.add(BigNumber.from(SECONDSPERDAY).mul(duration));

    beforeEach('init first round and time passes', async () => {
      initTx = await testEnv.stakingPool
        .connect(deployer)
        .initNewRound(rewardPersecond, year, month, day, duration);
      await advanceTimeTo(await getTimestamp(initTx), endTimestamp);
    });
    it('success', async () => {
      await testEnv.stakingPool
        .connect(deployer)
        .initNewRound(rewardPersecond, nextYear, month, day, duration);

      const poolData = await testEnv.stakingPool.getPoolData(1);

      expect(poolData.rewardPerSecond).to.be.equal(rewardPersecond);
      expect(poolData.rewardIndex).to.be.equal(0);
      expect(poolData.startTimestamp).to.be.equal(nextStartTimestamp);
      expect(poolData.endTimestamp).to.be.equal(nextEndTimestamp);
      expect(poolData.totalPrincipal).to.be.equal(0);
      expect(poolData.lastUpdateTimestamp).to.be.equal(await getTimestamp(initTx));
      expect(await testEnv.stakingPool.currentRound()).to.be.equal(1);
    });

    it('reverts when user has migrated', async () => {});
  });
});
