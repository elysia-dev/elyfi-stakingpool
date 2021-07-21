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

  /***************** View functions ******************/

  function getRewardIndex(uint8 round) external view override returns (uint256) {
    PoolData storage poolData = _rounds[round];
    return poolData.getRewardIndex();
  }

  function getUserReward(address user, uint8 round) external view override returns (uint256) {
    PoolData storage poolData = _rounds[round];
    // console.log(
    //   'contract getUserReward blocktimestamp, below is getReward',
    //   block.timestamp,
    //   poolData.getUserReward(user)
    // );

    return poolData.getUserReward(user);
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

    return (poolData.userIndex[user], poolData.userReward[user], poolData.userPrincipal[user]);
  }

  /***************** External functions ******************/

  function stake(uint256 amount) external override {
    PoolData storage poolData = _rounds[currentRound];

    if (currentRound == 0) revert StakingNotInitiated();

    if (poolData.endTimestamp < block.timestamp || poolData.startTimestamp > block.timestamp)
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

  function withdraw(uint256 amount, uint8 round) external override {
    _withdraw(amount, round);
  }

  function claim(uint8 round) external override {
    _claim(msg.sender, round);
  }

  function migrate(uint256 amount, uint8 round) external override {
    if (round >= currentRound) revert NotInitiatedRound(round, currentRound);
    PoolData storage poolData = _rounds[round];
    uint256 userPrincipal = poolData.userPrincipal[msg.sender];

    if (userPrincipal == 0) revert ZeroPrincipal();

    uint256 amountToWithdraw = userPrincipal - amount;

    // Claim reward
    if (poolData.getUserReward(msg.sender) != 0) {
      _claim(msg.sender, round);
    }

    // Withdraw
    if (amountToWithdraw != 0) {
      _withdraw(amountToWithdraw, round);
    }

    // Update current pool
    PoolData storage currentPoolData = _rounds[currentRound];
    currentPoolData.updateStakingPool(currentRound, msg.sender);

    // Migrate user principal
    poolData.userPrincipal[msg.sender] -= amount;
    currentPoolData.userPrincipal[msg.sender] += amount;

    // Migrate total principal
    poolData.totalPrincipal -= amount;
    currentPoolData.totalPrincipal += amount;

    emit Stake(
      msg.sender,
      amount,
      currentPoolData.userIndex[msg.sender],
      currentPoolData.userPrincipal[msg.sender],
      currentRound
    );

    emit Migrate(msg.sender, amount, round, currentRound);
  }

  /***************** Internal functions ******************/

  function _withdraw(uint256 amount, uint8 round) internal {
    PoolData storage poolData = _rounds[round];

    if (round > currentRound) revert NotInitiatedRound(round, currentRound);

    uint256 amountToWithdraw = amount;
    if (amount == type(uint256).max) {
      amountToWithdraw = poolData.userPrincipal[msg.sender];
    }

    if (poolData.userPrincipal[msg.sender] < amountToWithdraw)
      revert NotEnoughPrincipal(poolData.userPrincipal[msg.sender]);

    poolData.updateStakingPool(round, msg.sender);

    poolData.userPrincipal[msg.sender] -= amountToWithdraw;
    poolData.totalPrincipal -= amountToWithdraw;

    stakingAsset.safeTransfer(msg.sender, amountToWithdraw);

    emit Withdraw(
      msg.sender,
      amountToWithdraw,
      poolData.userIndex[msg.sender],
      poolData.userPrincipal[msg.sender],
      currentRound
    );
  }

  function _claim(address user, uint8 round) internal {
    if (round > currentRound) revert NotInitiatedRound(round, currentRound);

    PoolData storage poolData = _rounds[round];

    uint256 reward = poolData.getUserReward(user);

    if (reward == 0) revert ZeroReward();

    console.log(
      'contract UserIndex updateBefore, after',
      poolData.userIndex[user],
      poolData.getRewardIndex()
    );

    poolData.userReward[user] = 0;
    poolData.userIndex[user] = poolData.getRewardIndex();

    rewardAsset.safeTransfer(user, reward);

    uint256 rewardLeft = rewardAsset.balanceOf(address(this));

    emit Claim(user, reward, rewardLeft, round);
  }

  /***************** Admin Functions ******************/

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

  /***************** Modifier ******************/

  modifier onlyAdmin {
    if (msg.sender != _admin) revert OnlyAdmin();
    _;
  }
}
