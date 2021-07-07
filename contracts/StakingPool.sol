// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;
import './libraries/TimeConverter.sol';
import './logic/StakingPoolLogic.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract StakingPool {
  using StakingPoolLogic for PoolData;
  using SafeERC20 for IERC20;

  constructor(
    address stakingAsset,
    address rewardAsset,
    uint256 amountPerSecond
  ) {}

  struct PoolData {
    uint256 rewardPerSecond;
    uint256 rewardIndex;
    uint256 startTimestamp;
    uint256 endTimestamp;
    uint256 totalPrincipal;
    uint256 lastUpdateTimestamp;
    mapping(address => uint256) userIndex;
    mapping(address => uint256) userReward;
    mapping(address => uint256) userPrincipal;
  }

  uint8 internal _currentRound;

  IERC20 internal _stakingAsset;
  IERC20 internal _rewardAsset;

  mapping(uint8 => PoolData) internal _rounds;

  function stake(uint256 amount, bool migrate) external {
    PoolData storage poolData = _rounds[_currentRound];

    if (poolData.endTimestamp < block.timestamp) revert();

    poolData.updateStakingPool(msg.sender);

    _stakingAsset.safeTransferFrom(msg.sender, address(this), amount);

    poolData.userPrincipal[msg.sender] += amount;
    poolData.totalPrincipal += amount;
  }

  function claim(uint8 round) external {
    PoolData storage poolData = _rounds[round];

    uint256 reward = poolData.getUserReward(msg.sender);

    if (reward == 0) revert();

    _rewardAsset.safeTransfer(msg.sender, reward);

    poolData.userReward[msg.sender] = 0;
  }

  function withdraw(uint256 amount) external {
    PoolData storage poolData = _rounds[_currentRound];
    poolData.updateStakingPool(msg.sender);

    _stakingAsset.safeTransfer(msg.sender, amount);

    poolData.userPrincipal[msg.sender] -= amount;
    poolData.totalPrincipal -= amount;
  }

  function migrate() external {
    _migrate();
  }

  function _migrate() internal {
    uint256 totalUserReward;
    uint256 totalUserRound;
    for (uint8 i = 0; i < _currentRound; i++) {
      PoolData storage poolData = _rounds[i];
      totalUserReward += poolData.userReward[msg.sender];
      totalUserRound += poolData.userPrincipal[msg.sender];
      poolData.userReward[msg.sender] = poolData.userIndex[msg.sender] = poolData.userPrincipal[
        msg.sender
      ] = 0;
    }
  }

  function getUserReward(uint8 Round) external view {
    PoolData storage poolData = _rounds[Round];

    poolData.getUserReward(msg.sender);
  }

  function getRewardIndex(uint8 Round) external view returns (uint256) {
    PoolData storage poolData = _rounds[Round];

    return poolData.getRewardIndex();
  }

  function initNewRound(
    uint256 rewardPerSecond,
    uint16 year,
    uint8 month,
    uint8 day,
    uint8 duration
  ) external {
    PoolData storage poolDataBefore = _rounds[_currentRound];

    uint256 roundstartTimestamp = TimeConverter.toTimestamp(year, month, day);

    if (roundstartTimestamp < poolDataBefore.endTimestamp) revert();

    uint8 newRound = _currentRound + 1;

    _rounds[newRound].initRound(rewardPerSecond, roundstartTimestamp, duration);
  }
}
