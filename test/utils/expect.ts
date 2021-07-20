import { BigNumber, ethers } from 'ethers';
import PoolData from '../types/PoolData';
import UserData from '../types/UserData';
import { calculateDataAfterUpdate, calculateRewardIndex, calculateUserReward } from './calculate';

export function expectDataAfterStake(
  poolData: PoolData,
  userData: UserData,
  txTimeStamp: BigNumber,
  amount: BigNumber
): [PoolData, UserData] {
  const [newPoolData, newUserData]: [PoolData, UserData] = calculateDataAfterUpdate(
    poolData,
    userData,
    txTimeStamp
  );

  const newUserStakingAssetBalance = newUserData.stakingAssetBalance.sub(amount);
  const newUserPrincipal = newUserData.userPrincipal.add(amount);

  newUserData.stakingAssetBalance = newUserStakingAssetBalance;
  newUserData.userPrincipal = newUserPrincipal;

  const newPoolTotalPrincipal = newPoolData.totalPrincipal.add(amount);
  newPoolData.totalPrincipal = newPoolTotalPrincipal;

  const newPoolStakingAssetBalance = newPoolData.stakingAssetBalance.add(amount);
  newPoolData.stakingAssetBalance = newPoolStakingAssetBalance;

  return [newPoolData, newUserData];
}

export function expectDataAfterWithdraw(
  poolData: PoolData,
  userData: UserData,
  txTimeStamp: BigNumber,
  amount: BigNumber
): [PoolData, UserData] {
  const [newPoolData, newUserData]: [PoolData, UserData] = calculateDataAfterUpdate(
    poolData,
    userData,
    txTimeStamp
  );

  let withdrawAmount = amount;

  if (amount.eq(ethers.constants.MaxUint256)) {
    withdrawAmount = userData.userPrincipal;
  }

  const newUserStakingAssetBalance = newUserData.stakingAssetBalance.add(withdrawAmount);
  const newUserPrincipal = newUserData.userPrincipal.sub(withdrawAmount);
  newUserData.stakingAssetBalance = newUserStakingAssetBalance;
  newUserData.userPrincipal = newUserPrincipal;

  const newPoolTotalPrincipal = newPoolData.totalPrincipal.sub(withdrawAmount);
  newPoolData.totalPrincipal = newPoolTotalPrincipal;

  const newPoolStakingAssetBalance = newPoolData.stakingAssetBalance.sub(withdrawAmount);
  newPoolData.stakingAssetBalance = newPoolStakingAssetBalance;

  return [newPoolData, newUserData];
}

export function expectDataAfterClaim(
  poolData: PoolData,
  userData: UserData,
  txTimeStamp: BigNumber
): [PoolData, UserData] {
  const newPoolData = { ...poolData } as PoolData;
  const newUserData = { ...userData } as UserData;

  const accruedReward = calculateUserReward(poolData, userData, txTimeStamp);
  const newUserRewardAssetBalance = userData.rewardAssetBalance.add(accruedReward);
  newUserData.rewardAssetBalance = newUserRewardAssetBalance;

  newUserData.userInternalReward = newUserData.userReward = BigNumber.from(0);

  const newRewardIndex = calculateRewardIndex(poolData, txTimeStamp);
  newUserData.userIndex = newRewardIndex;

  const newPoolTotalRewardAssetBalance = poolData.rewardAssetBalance.sub(accruedReward);
  newPoolData.rewardAssetBalance = newPoolTotalRewardAssetBalance;

  return [newPoolData, newUserData];
}
