// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

interface IStakingPoolV2 {
  error StakingNotInitiated();
  error InvaidAmount();
  error ZeroReward();
  error OnlyAdmin();
  error NotEnoughPrincipal(uint256 principal);
  error ZeroPrincipal();

  event Stake(address indexed user, uint256 amount, uint256 userIndex, uint256 userPrincipal);
  event Withdraw(address indexed user, uint256 amount, uint256 userIndex, uint256 userPrincipal);
  event Claim(address indexed user, uint256 reward, uint256 rewardLeft);
  event Migrate(address user, uint256 amount);

  function stake(uint256 amount) external;

  function claim() external;

  function withdraw(uint256 amount) external;

  function migrate() external;

  function getRewardIndex() external view returns (uint256);

  function getUserReward(address user) external view returns (uint256);

  function getPoolData()
    external
    view
    returns (
      uint256 rewardPerSecond,
      uint256 rewardIndex,
      uint256 lastUpdateTimestamp
    );

  function initNewRound(
    uint256 rewardPerSecond,
    uint16 year,
    uint8 month,
    uint8 day,
    uint8 duration
  ) external;
}
