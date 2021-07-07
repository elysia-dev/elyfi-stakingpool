// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;
import './libraries/TimeConverter.sol';
import './logic/StakingPoolLogic.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract StakingPool {
  using StakingPoolLogic for PoolData;
  using SafeERC20 for IERC20;

  constructor(address stakingAsset_, address rewardAsset_) {
    stakingAsset = IERC20(stakingAsset_);
    rewardAsset = IERC20(rewardAsset_);
    _admin = msg.sender;
  }

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

  uint8 public currentRound;

  address internal _admin;

  IERC20 public stakingAsset;
  IERC20 public rewardAsset;

  mapping(uint8 => PoolData) internal _rounds;

  function stake(uint256 amount) external {
    PoolData storage poolData = _rounds[currentRound];

    if (poolData.endTimestamp < block.timestamp) revert();

    poolData.updateStakingPool(msg.sender);

    stakingAsset.safeTransferFrom(msg.sender, address(this), amount);

    poolData.userPrincipal[msg.sender] += amount;
    poolData.totalPrincipal += amount;
  }

  function claim(uint8 round) external {
    PoolData storage poolData = _rounds[round];

    uint256 reward = poolData.getUserReward(msg.sender);

    if (reward == 0) revert();

    rewardAsset.safeTransfer(msg.sender, reward);

    poolData.userReward[msg.sender] = 0;
  }

  function withdraw(uint256 amount) external {
    PoolData storage poolData = _rounds[currentRound];
    poolData.updateStakingPool(msg.sender);

    stakingAsset.safeTransfer(msg.sender, amount);

    poolData.userPrincipal[msg.sender] -= amount;
    poolData.totalPrincipal -= amount;
  }

  function migrate() external {
    _migrate();
  }

  function _migrate() internal {
    uint256 totalUserReward;
    uint256 totalUserRound;
    for (uint8 i = 0; i < currentRound; i++) {
      PoolData storage poolData = _rounds[i];
      totalUserReward += poolData.userReward[msg.sender];
      totalUserRound += poolData.userPrincipal[msg.sender];
      poolData.userReward[msg.sender] = poolData.userIndex[msg.sender] = poolData.userPrincipal[
        msg.sender
      ] = 0;
    }
  }

  function getUserReward(uint8 round) external view {
    PoolData storage poolData = _rounds[round];

    poolData.getUserReward(msg.sender);
  }

  function getRewardIndex(uint8 round) external view returns (uint256) {
    PoolData storage poolData = _rounds[round];

    return poolData.getRewardIndex();
  }

  struct PoolDataLocalVars {
    uint256 rewardPerSecond;
    uint256 rewardIndex;
    uint256 startTimestamp;
    uint256 endTimestamp;
    uint256 totalPrincipal;
    uint256 lastUpdateTimestamp;
  }

  function getPoolData(uint8 round) external view returns (PoolDataLocalVars memory) {
    PoolData storage poolData = _rounds[round];
    PoolDataLocalVars memory vars;

    vars.rewardPerSecond = poolData.rewardPerSecond;
    vars.rewardIndex = poolData.rewardIndex;
    vars.startTimestamp = poolData.startTimestamp;
    vars.endTimestamp = poolData.endTimestamp;
    vars.totalPrincipal = poolData.totalPrincipal;
    vars.lastUpdateTimestamp = poolData.lastUpdateTimestamp;

    return vars;
  }

  function initNewRound(
    uint256 rewardPerSecond,
    uint16 year,
    uint8 month,
    uint8 day,
    uint8 duration
  ) external onlyAdmin {
    PoolData storage poolDataBefore = _rounds[currentRound];

    uint256 roundstartTimestamp = TimeConverter.toTimestamp(year, month, day);

    if (roundstartTimestamp < poolDataBefore.endTimestamp) revert();

    uint8 newRound = currentRound + 1;
    _rounds[newRound].initRound(rewardPerSecond, roundstartTimestamp, duration);

    currentRound = newRound;
  }

  modifier onlyAdmin {
    if (msg.sender != _admin) revert();
    _;
  }
}
