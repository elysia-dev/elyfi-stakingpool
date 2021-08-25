// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;
import '../StakingPoolV2.sol';
import '../libraries/TimeConverter.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

library StakingPoolLogicV2 {
  using StakingPoolLogicV2 for StakingPoolV2.PoolData;

  event UpdateStakingPool(address indexed user, uint256 newRewardIndex, uint256 totalPrincipal);

  function getRewardIndex(StakingPoolV2.PoolData storage poolData, uint256 totalSupply)
    internal
    view
    returns (uint256)
  {
    uint256 currentTimestamp = block.timestamp;
    uint256 timeDiff = currentTimestamp - poolData.lastUpdateTimestamp;

    if (timeDiff == 0) {
      return poolData.rewardIndex;
    }

    if (totalSupply == 0) {
      return poolData.rewardIndex;
    }

    uint256 rewardIndexDiff = (timeDiff * poolData.rewardPerSecond * 1e9) / totalSupply;

    return poolData.rewardIndex + rewardIndexDiff;
  }

  function getUserReward(
    StakingPoolV2.PoolData storage poolData,
    address user,
    uint256 totalSupply,
    uint256 userBalance
  ) internal view returns (uint256) {
    if (poolData.userIndex[user] == 0) {
      return 0;
    }
    uint256 indexDiff = getRewardIndex(poolData, totalSupply) - poolData.userIndex[user];

    uint256 result = poolData.userReward[user] + (userBalance * indexDiff) / 1e9;

    return result;
  }

  function updateStakingPool(
    StakingPoolV2.PoolData storage poolData,
    address user,
    uint256 totalSupply,
    uint256 userBalance
  ) internal {
    poolData.userReward[user] = getUserReward(poolData, user, totalSupply, userBalance);
    poolData.rewardIndex = poolData.userIndex[user] = getRewardIndex(poolData, totalSupply);
    poolData.lastUpdateTimestamp = block.timestamp;
    emit UpdateStakingPool(msg.sender, poolData.rewardIndex, totalSupply);
  }

  function initRound(StakingPoolV2.PoolData storage poolData, uint256 rewardPerSecond) internal {
    poolData.rewardPerSecond = rewardPerSecond;
    poolData.rewardIndex = 1e18;
  }

  function resetUserData(StakingPoolV2.PoolData storage poolData, address user) internal {
    poolData.userReward[user] = 0;
    poolData.userIndex[user] = 0;
  }
}
