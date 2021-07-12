// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;
import './libraries/TimeConverter.sol';
import './logic/StakingPoolLogic.sol';
import './interface/IStakingPool.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import 'hardhat/console.sol';

contract StakingPool is IStakingPool {
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

  function stake(uint256 amount) external override {
    PoolData storage poolData = _rounds[currentRound];

    if (currentRound == 0) revert StakingNotInitiated();

    if (poolData.endTimestamp < block.timestamp && poolData.startTimestamp > block.timestamp)
      revert NotInRound();

    if (amount == 0) revert InvaidAmount();

    poolData.updateStakingPool(currentRound, msg.sender);

    stakingAsset.safeTransferFrom(msg.sender, address(this), amount);

    poolData.userPrincipal[msg.sender] += amount;
    poolData.totalPrincipal += amount;

    emit Stake(
      msg.sender,
      amount,
      poolData.userIndex[msg.sender],
      poolData.userPrincipal[msg.sender],
      currentRound
    );
  }

  function claim(uint8 round) external override {
    PoolData storage poolData = _rounds[round];

    uint256 reward = poolData.getUserReward(msg.sender);

    if (reward == 0) revert ZeroReward();

    rewardAsset.safeTransfer(msg.sender, reward);

    poolData.userReward[msg.sender] = 0;

    uint256 rewardLeft = rewardAsset.balanceOf(address(this));

    emit Claim(msg.sender, reward, rewardLeft, currentRound);
  }

  function withdraw(uint256 amount) external override {
    PoolData storage poolData = _rounds[currentRound];
    poolData.updateStakingPool(currentRound, msg.sender);

    stakingAsset.safeTransfer(msg.sender, amount);

    poolData.userPrincipal[msg.sender] -= amount;
    poolData.totalPrincipal -= amount;

    emit Withdraw(
      msg.sender,
      amount,
      poolData.userIndex[msg.sender],
      poolData.userPrincipal[msg.sender],
      currentRound
    );
  }

  function migrate() external override {
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

  function getRewardIndex(uint8 round) external view override returns (uint256) {
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

  function getPoolData(uint8 round)
    external
    view
    override
    returns (
      uint256 rewardPerSecond,
      uint256 rewardIndex,
      uint256 startTimestamp,
      uint256 endTimestamp,
      uint256 totalPrincipal,
      uint256 lastUpdateTimestamp
    )
  {
    PoolData storage poolData = _rounds[round];

    return (
      poolData.rewardPerSecond,
      poolData.rewardIndex,
      poolData.startTimestamp,
      poolData.endTimestamp,
      poolData.totalPrincipal,
      poolData.lastUpdateTimestamp
    );
  }

  function getUserData(uint8 round, address user)
    external
    view
    override
    returns (
      uint256 userIndex,
      uint256 userReward,
      uint256 userPrincipal
    )
  {
    PoolData storage poolData = _rounds[round];

    return (poolData.userIndex[user], poolData.getUserReward(user), poolData.userPrincipal[user]);
  }

  function initNewRound(
    uint256 rewardPerSecond,
    uint16 year,
    uint8 month,
    uint8 day,
    uint8 duration
  ) external override onlyAdmin {
    PoolData storage poolDataBefore = _rounds[currentRound];

    uint256 roundstartTimestamp = TimeConverter.toTimestamp(year, month, day);

    if (roundstartTimestamp < poolDataBefore.endTimestamp) revert RoundConflicted();

    uint8 newRound = currentRound + 1;
    (uint256 startTimestamp, uint256 endTimestamp) = _rounds[newRound].initRound(
      rewardPerSecond,
      roundstartTimestamp,
      duration
    );

    currentRound = newRound;

    emit InitRound(rewardPerSecond, startTimestamp, endTimestamp, currentRound);
  }

  modifier onlyAdmin {
    if (msg.sender != _admin) revert OnlyAdmin();
    _;
  }
}
