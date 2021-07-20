import { BigNumber } from 'ethers';

interface UserData {
  userIndex: BigNumber;
  userReward: BigNumber;
  userInternalReward: BigNumber;
  userPrincipal: BigNumber;
  stakingAssetBalance: BigNumber;
  rewardAssetBalance: BigNumber;
}

export default UserData;
