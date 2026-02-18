// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @notice A single fundraising campaign.
///         Deployed by FundraiserFactory — one contract per campaign.
///
///         Lifecycle:
///           - Donors call donate() before the deadline.
///           - If totalRaised >= goalAmount, creator can withdraw() at any time.
///           - If deadline passes and goal was NOT met, donors can claimRefund().
contract Fundraiser {
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    IERC20 public immutable usdc;
    address public immutable creator;

    string public name;
    string public description;
    uint256 public immutable goalAmount;
    uint256 public immutable deadline;

    uint256 public totalRaised;
    bool public withdrawn;

    mapping(address => uint256) public donations;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event Donated(address indexed donor, uint256 amount);
    event Withdrawn(address indexed creator, uint256 amount);
    event RefundClaimed(address indexed donor, uint256 amount);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error NotCreator();
    error GoalNotMet();
    error GoalAlreadyMet();
    error DeadlinePassed();
    error DeadlineNotPassed();
    error AlreadyWithdrawn();
    error NoDonationToRefund();
    error InvalidGoal();
    error InvalidDeadline();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(
        address _usdc,
        address _creator,
        string memory _name,
        string memory _description,
        uint256 _goalAmount,
        uint256 _deadline
    ) {
        if (_goalAmount == 0) revert InvalidGoal();
        if (_deadline <= block.timestamp) revert InvalidDeadline();

        usdc = IERC20(_usdc);
        creator = _creator;
        name = _name;
        description = _description;
        goalAmount = _goalAmount;
        deadline = _deadline;
    }

    // -------------------------------------------------------------------------
    // External functions
    // -------------------------------------------------------------------------

    /// @notice Donate USDC to this campaign. Caller must approve this contract first.
    function donate(uint256 amount) external {
        if (block.timestamp >= deadline) revert DeadlinePassed();

        donations[msg.sender] += amount;
        totalRaised += amount;

        // Interactions last — state is already updated above
        usdc.transferFrom(msg.sender, address(this), amount);

        emit Donated(msg.sender, amount);
    }

    /// @notice Creator withdraws all funds once the goal is met.
    ///         Can be called at any time after the goal is reached.
    function withdraw() external {
        if (msg.sender != creator) revert NotCreator();
        if (totalRaised < goalAmount) revert GoalNotMet();
        if (withdrawn) revert AlreadyWithdrawn();

        withdrawn = true;
        uint256 amount = totalRaised;

        usdc.transfer(creator, amount);

        emit Withdrawn(creator, amount);
    }

    /// @notice Donor reclaims their funds if deadline passed and goal was not met.
    function claimRefund() external {
        if (block.timestamp < deadline) revert DeadlineNotPassed();
        if (totalRaised >= goalAmount) revert GoalAlreadyMet();

        uint256 amount = donations[msg.sender];
        if (amount == 0) revert NoDonationToRefund();

        // Zero out before transfer to prevent reentrancy
        donations[msg.sender] = 0;

        usdc.transfer(msg.sender, amount);

        emit RefundClaimed(msg.sender, amount);
    }

    // -------------------------------------------------------------------------
    // View helpers
    // -------------------------------------------------------------------------

    function isGoalMet() external view returns (bool) {
        return totalRaised >= goalAmount;
    }

    function isExpired() external view returns (bool) {
        return block.timestamp >= deadline;
    }
}
