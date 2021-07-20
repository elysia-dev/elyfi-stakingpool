import { StakingPool } from '../typechain/StakingPool';
describe('StakingPool.migrate', () => {
  context('Reward claim in migration', async () => {
    it('reverts when user migrates', async () => {});
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
