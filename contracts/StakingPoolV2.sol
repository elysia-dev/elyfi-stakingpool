// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;
import './libraries/TimeConverter.sol';
import './logic/StakingPoolLogicV2.sol';
import './token/StakedElyfiToken.sol';
import './interface/IStakingPoolV2.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

/// @title Elyfi StakingPool contract
/// @notice Users can stake their asset and earn reward for their staking.
/// The reward calculation is based on the reward index and user balance. The amount of reward index change
/// is inversely proportional to the total amount of supply. Accrued rewards can be obtained by multiplying
/// the difference between the user index and the current index by the user balance. User index and the pool
/// index is updated and aligned with in the staking and withdrawing action.
/// @author Elysia
contract StakingPoolV2 is IStakingPoolV2, StakedElyfiToken {
  using StakingPoolLogicV2 for PoolData;
  using SafeERC20 for IERC20;

  constructor(IERC20 stakingAsset_, IERC20 rewardAsset_) StakedElyfiToken(stakingAsset_) {
    stakingAsset = stakingAsset_;
    rewardAsset = rewardAsset_;
    _admin = msg.sender;
  }

  struct PoolData {
    uint256 rewardPerSecond;
    uint256 rewardIndex;
    uint256 lastUpdateTimestamp;
    mapping(address => uint256) userIndex;
    mapping(address => uint256) userReward;
  }

  address internal _admin;

  IERC20 public stakingAsset;
  IERC20 public rewardAsset;

  PoolData internal _poolData;

  /***************** View functions ******************/

  /// @notice Returns reward index of the round
  function getRewardIndex() external view override returns (uint256) {
    PoolData storage poolData = _poolData;
    uint256 totalSupply = totalSupply();
    return poolData.getRewardIndex(totalSupply);
  }

  /// @notice Returns user accrued reward index of the round
  /// @param user The user address
  function getUserReward(address user) external view override returns (uint256) {
    PoolData storage poolData = _poolData;
    uint256 totalSupply = totalSupply();
    uint256 userBalance = balanceOf(user);
    return poolData.getUserReward(user, totalSupply, userBalance);
  }

  /// @notice Returns the state and data of the round
  /// @return rewardPerSecond The total reward accrued per second in the round
  /// @return rewardIndex The reward index of the round
  /// @return lastUpdateTimestamp The last update timestamp of the round
  function getPoolData()
    external
    view
    override
    returns (
      uint256 rewardPerSecond,
      uint256 rewardIndex,
      uint256 lastUpdateTimestamp
    )
  {
    PoolData storage poolData = _poolData;

    return (poolData.rewardPerSecond, poolData.rewardIndex, poolData.lastUpdateTimestamp);
  }

  /***************** External functions ******************/

  /// @notice Stake the amount of staking asset to pool contract and update data.
  /// @param amount Amount to stake.
  function stake(uint256 amount) external override {
    PoolData storage poolData = _poolData;

    if (amount == 0) revert InvaidAmount();

    uint256 totalSupply = totalSupply();
    uint256 userBalance = balanceOf(msg.sender);

    poolData.updateStakingPool(msg.sender, totalSupply, userBalance);

    depositFor(msg.sender, amount);

    emit Stake(
      msg.sender,
      amount,
      poolData.userIndex[msg.sender],
      stakingAsset.balanceOf(msg.sender)
    );
  }

  /// @notice Withdraw the amount of principal from the pool contract and update data
  /// @param amount Amount to withdraw
  function withdraw(uint256 amount) external override {
    _withdraw(amount);
  }

  /// @notice Transfer accrued reward to msg.sender. User accrued reward will be reset and user reward index will be set to the current reward index.
  function claim() external override {
    _claim(msg.sender);
  }

  /// @notice Migrate the amount of principal to the current round and transfer the rest principal to the caller
  function migrate() external override {
    PoolData storage poolData = _poolData;
  }

  /***************** Internal functions ******************/

  function _withdraw(uint256 amount) internal {
    PoolData storage poolData = _poolData;

    uint256 amountToWithdraw = amount;

    uint256 userBalance = balanceOf(msg.sender);
    uint256 totalSupply = totalSupply();

    if (amount == type(uint256).max) {
      amountToWithdraw = userBalance;
    }

    if (balanceOf(msg.sender) < amountToWithdraw) revert NotEnoughPrincipal(userBalance);

    poolData.updateStakingPool(msg.sender, totalSupply, userBalance);

    withdrawTo(msg.sender, amount);

    emit Withdraw(msg.sender, amountToWithdraw, poolData.userIndex[msg.sender], userBalance);
  }

  function _claim(address user) internal {
    PoolData storage poolData = _poolData;

    uint256 totalSupply = totalSupply();
    uint256 userBalance = balanceOf(msg.sender);

    uint256 reward = poolData.getUserReward(user, totalSupply, userBalance);

    if (reward == 0) revert ZeroReward();

    poolData.userReward[user] = 0;
    poolData.userIndex[user] = poolData.getRewardIndex(totalSupply);

    rewardAsset.safeTransfer(user, reward);

    uint256 rewardLeft = rewardAsset.balanceOf(address(this));

    emit Claim(user, reward, rewardLeft);
  }

  /***************** Admin Functions ******************/

  /// @notice Init the new round. After the round closed, staking is not allowed.
  /// @param rewardPerSecond The total accrued reward per second in new round
  /// @param year The round start year
  /// @param month The round start month
  /// @param day The round start day
  /// @param duration The duration of the initiated round
  function initNewRound(
    uint256 rewardPerSecond,
    uint16 year,
    uint8 month,
    uint8 day,
    uint8 duration
  ) external override onlyAdmin {}

  function retrieveResidue() external onlyAdmin {
    rewardAsset.safeTransfer(_admin, rewardAsset.balanceOf(address(this)));
  }

  /***************** Modifier ******************/

  modifier onlyAdmin() {
    if (msg.sender != _admin) revert OnlyAdmin();
    _;
  }
}
