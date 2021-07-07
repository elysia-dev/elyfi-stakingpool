// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;
import '../StakingPool.sol';
import '../libraries/TimeConverter.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

library StakingPoolLogic {
  using StakingPoolLogic for StakingPool.PoolData;

  function getRewardIndex(StakingPool.PoolData storage poolData) internal view returns (uint256) {
    uint256 currentTimestamp = block.timestamp < poolData.endTimestamp
      ? block.timestamp
      : poolData.endTimestamp;
    uint256 timeDiff = block.timestamp - currentTimestamp;
    uint256 totalPrincipal = poolData.totalPrincipal;

    if (timeDiff == 0) {
      return poolData.rewardIndex;
    }

    if (totalPrincipal == 0) {
      return 0;
    }

    uint256 rewardIndexDiff = (timeDiff * poolData.rewardPerSecond) / totalPrincipal;

    return poolData.rewardIndex + rewardIndexDiff;
  }

  function getUserReward(StakingPool.PoolData storage poolData, address user)
    internal
    view
    returns (uint256)
  {
    if (poolData.userIndex[user] == 0) {
      return 0;
    }
    uint256 indexDiff = getRewardIndex(poolData) - poolData.userIndex[user];

    uint256 balance = poolData.userPrincipal[user];

    uint256 result = poolData.userReward[user] + (balance * indexDiff) / 1e9;

    return result;
  }

  function updateStakingPool(StakingPool.PoolData storage poolData, address user) internal {
    poolData.userReward[user] = getUserReward(poolData, user);
    poolData.rewardIndex = poolData.userIndex[user] = getRewardIndex(poolData);
    poolData.lastUpdateTimestamp = block.timestamp;
  }

  function initRound(
    StakingPool.PoolData storage poolData,
    uint256 rewardPerSecond,
    uint256 roundStartTimestamp,
    uint8 duration
  ) internal {
    poolData.rewardPerSecond = rewardPerSecond;
    poolData.startTimestamp = roundStartTimestamp;
    poolData.endTimestamp = roundStartTimestamp + (duration * 1 days);
    poolData.lastUpdateTimestamp = block.timestamp;
  }

  function resetUserData(StakingPool.PoolData storage poolData, address user) internal {
    poolData.userReward[user] = 0;
    poolData.userIndex[user] = 0;
    poolData.userPrincipal[user] = 0;
  }
}
