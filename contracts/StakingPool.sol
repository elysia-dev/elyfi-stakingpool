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

  function stake(uint256 amount) external {
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

  function claim(uint8 round) external {
    PoolData storage poolData = _rounds[round];

    uint256 reward = poolData.getUserReward(msg.sender);

    if (reward == 0) revert ZeroReward();

    rewardAsset.safeTransfer(msg.sender, reward);

    poolData.userReward[msg.sender] = 0;

    uint256 rewardLeft = rewardAsset.balanceOf(address(this));

    emit Claim(msg.sender, reward, rewardLeft, currentRound);
  }

  function withdraw(uint256 amount) external {
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

  struct UserDataLocalVars {
    uint256 userIndex;
    uint256 userReward;
    uint256 userPrincipal;
  }

  function getUserData(uint8 round, address user) external view returns (UserDataLocalVars memory) {
    PoolData storage poolData = _rounds[round];
    UserDataLocalVars memory vars;

    vars.userIndex = poolData.userIndex[user];
    vars.userPrincipal = poolData.userPrincipal[user];
    vars.userReward = poolData.getUserReward(user);

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
