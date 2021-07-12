// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

interface IStakingPool {
  error NotInRound();
  error StakingNotInitiated();
  error InvaidAmount();
  error ZeroReward();
  error OnlyAdmin();
  error RoundConflicted();

  event Stake(
    address indexed user,
    uint256 amount,
    uint256 userIndex,
    uint256 userPrincipal,
    uint8 currentRound
  );
  event Withdraw(
    address indexed user,
    uint256 amount,
    uint256 userIndex,
    uint256 userPrincipal,
    uint8 currentRound
  );

  event Claim(address indexed user, uint256 reward, uint256 rewardLeft, uint8 currentRound);

  event InitRound(
    uint256 rewardPerSecond,
    uint256 startTimestamp,
    uint256 endTimestamp,
    uint256 currentRound
  );

  function stake(uint256 amount) external;

  function claim(uint8 round) external;

  function withdraw(uint256 amount) external;

  function migrate() external;

  function getRewardIndex(uint8 round) external view returns (uint256);

  function getPoolData(uint8 round)
    external
    view
    returns (
      uint256 rewardPerSecond,
      uint256 rewardIndex,
      uint256 startTimestamp,
      uint256 endTimestamp,
      uint256 totalPrincipal,
      uint256 lastUpdateTimestamp
    );

  function getUserData(uint8 round, address user)
    external
    view
    returns (
      uint256 userIndex,
      uint256 userReward,
      uint256 userPrincipal
    );

  function initNewRound(
    uint256 rewardPerSecond,
    uint16 year,
    uint8 month,
    uint8 day,
    uint8 duration
  ) external;
}
