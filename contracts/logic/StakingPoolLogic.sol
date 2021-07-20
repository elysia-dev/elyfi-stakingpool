// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;
import '../StakingPool.sol';
import '../libraries/TimeConverter.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import 'hardhat/console.sol';

library StakingPoolLogic {
  using StakingPoolLogic for StakingPool.PoolData;

  event UpdateStakingPool(
    address indexed user,
    uint256 newRewardIndex,
    uint256 totalPrincipal,
    uint8 currentRound
  );

  function getRewardIndex(StakingPool.PoolData storage poolData) internal view returns (uint256) {
    uint256 currentTimestamp = block.timestamp < poolData.endTimestamp
      ? block.timestamp
      : poolData.endTimestamp;
    uint256 timeDiff = currentTimestamp - poolData.lastUpdateTimestamp;
    uint256 totalPrincipal = poolData.totalPrincipal;

    console.log(
      'getIndex Time',
      poolData.rewardIndex,
      currentTimestamp,
      poolData.lastUpdateTimestamp
    );

    if (timeDiff == 0) {
      return poolData.rewardIndex;
    }

    if (totalPrincipal == 0) {
      return poolData.rewardIndex;
    }

    uint256 rewardIndexDiff = (timeDiff * poolData.rewardPerSecond * 1e9) / totalPrincipal;

    console.log('getIndex', poolData.rewardIndex, totalPrincipal, rewardIndexDiff);

    return poolData.rewardIndex + rewardIndexDiff;
  }

  function getUserReward(StakingPool.PoolData storage poolData, address user)
    internal
    view
    returns (uint256)
  {
    if (poolData.userIndex[user] == 0) {
      console.log('getReward stop');
      return 0;
    }
    uint256 indexDiff = getRewardIndex(poolData) - poolData.userIndex[user];

    uint256 balance = poolData.userPrincipal[user];

    uint256 result = poolData.userReward[user] + (balance * indexDiff) / 1e9;

    console.log(
      'getReward',
      getRewardIndex(poolData),
      poolData.userIndex[user],
      (balance * indexDiff)
    );

    return result;
  }

  function updateStakingPool(
    StakingPool.PoolData storage poolData,
    uint8 currentRound,
    address user
  ) internal {
    console.log('updateStakingPool start');
    poolData.userReward[user] = getUserReward(poolData, user);
    console.log('123', poolData.userReward[user]);
    poolData.rewardIndex = poolData.userIndex[user] = getRewardIndex(poolData);
    console.log('456', poolData.rewardIndex);
    poolData.lastUpdateTimestamp = block.timestamp;
    console.log('contract updatepool userReward', poolData.userReward[user]);
    emit UpdateStakingPool(msg.sender, poolData.rewardIndex, poolData.totalPrincipal, currentRound);
  }

  function initRound(
    StakingPool.PoolData storage poolData,
    uint256 rewardPerSecond,
    uint256 roundStartTimestamp,
    uint8 duration
  ) internal returns (uint256, uint256) {
    poolData.rewardPerSecond = rewardPerSecond;
    poolData.startTimestamp = roundStartTimestamp;
    poolData.endTimestamp = roundStartTimestamp + (duration * 1 days);
    poolData.lastUpdateTimestamp = roundStartTimestamp;
    poolData.rewardIndex = 1e18;

    return (poolData.startTimestamp, poolData.endTimestamp);
  }

  function resetUserData(StakingPool.PoolData storage poolData, address user) internal {
    poolData.userReward[user] = 0;
    poolData.userIndex[user] = 0;
    poolData.userPrincipal[user] = 0;
  }
}
