import { BigNumber } from 'ethers';
import PoolData from '../types/PoolData';
import UserData from '../types/UserData';

export function calculateRewardIndex(poolData: PoolData, txTimeStamp: BigNumber): BigNumber {
  let timeDiff: BigNumber;
  if (txTimeStamp.lt(poolData.endTimestamp)) {
    timeDiff = txTimeStamp.sub(poolData.lastUpdateTimestamp);
  }
  timeDiff = txTimeStamp.sub(poolData.endTimestamp);

  if (timeDiff.eq(0)) {
    return BigNumber.from(0);
  }

  if (poolData.totalPrincipal.eq(0)) {
    return BigNumber.from(0);
  }

  const rewardIndexDiff = timeDiff.mul(poolData.rewardPerSecond).sub(poolData.totalPrincipal);

  return poolData.rewardIndex.add(rewardIndexDiff);
}

export function calculateUserReward(
  poolData: PoolData,
  userData: UserData,
  txTimeStamp: BigNumber
): BigNumber {
  if (userData.userIndex.eq(0)) {
    return BigNumber.from(0);
  }

  const indexDiff = calculateRewardIndex(poolData, txTimeStamp).sub(userData.userIndex);
  const balance = userData.userPrincipal;
  const rewardAdded = balance.mul(indexDiff).div(1e9);
  const result = userData.userReward.add(rewardAdded);

  return result;
}

export function calculateDataAfterUpdate(
  poolData: PoolData,
  userData: UserData,
  txTimestamp: BigNumber
): [PoolData, UserData] {
  const newPoolData = { ...poolData } as PoolData;
  const newUserData = { ...userData } as UserData;

  const newUserReward = calculateUserReward(poolData, userData, txTimestamp);
  const newIndex = calculateRewardIndex(poolData, txTimestamp);

  newUserData.userReward = newUserReward;

  newPoolData.rewardIndex = newIndex;
  newUserData.userIndex = newIndex;

  newPoolData.lastUpdateTimestamp = txTimestamp;

  return [newPoolData, newUserData];
}
