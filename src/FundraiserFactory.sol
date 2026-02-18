// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Fundraiser} from "./Fundraiser.sol";

/// @notice Deploys and tracks individual Fundraiser contracts.
///         One factory per deployment — shared by all campaigns.
contract FundraiserFactory {
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    address public immutable usdc;
    address[] public fundraisers;

    address public owner;
    address public feeRecipient;
    uint256 public feeBps;

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    uint256 public constant MAX_FEE_BPS = 1000; // 10% hard cap

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event FundraiserCreated(
        address indexed fundraiser, address indexed creator, string name, uint256 goalAmount, uint256 deadline
    );
    event FeeUpdated(uint256 newFeeBps);
    event FeeRecipientUpdated(address newRecipient);
    event OwnerTransferred(address newOwner);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error InvalidUSDC();
    error NotOwner();
    error FeeTooHigh();
    error ZeroAddress();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address _usdc, address _feeRecipient, uint256 _feeBps) {
        if (_usdc == address(0)) revert InvalidUSDC();
        if (_feeRecipient == address(0)) revert ZeroAddress();
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();

        usdc = _usdc;
        owner = msg.sender;
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
    }

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // -------------------------------------------------------------------------
    // External functions
    // -------------------------------------------------------------------------

    /// @notice Deploy a new Fundraiser campaign. Caller becomes the creator.
    /// @param name        Display name of the campaign.
    /// @param description Short description of the campaign.
    /// @param goalAmount  Target amount in USDC (6 decimals).
    /// @param deadline    Unix timestamp after which no more donations are accepted.
    /// @return Address of the newly deployed Fundraiser contract.
    function createFundraiser(string memory name, string memory description, uint256 goalAmount, uint256 deadline)
        external
        returns (address)
    {
        Fundraiser fundraiser =
            new Fundraiser(usdc, msg.sender, name, description, goalAmount, deadline, feeRecipient, feeBps);

        fundraisers.push(address(fundraiser));

        emit FundraiserCreated(address(fundraiser), msg.sender, name, goalAmount, deadline);

        return address(fundraiser);
    }

    /// @notice Update the platform fee in basis points (owner only).
    function setFeeBps(uint256 _feeBps) external onlyOwner {
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        feeBps = _feeBps;
        emit FeeUpdated(_feeBps);
    }

    /// @notice Update the fee recipient address (owner only).
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        if (_feeRecipient == address(0)) revert ZeroAddress();
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(_feeRecipient);
    }

    /// @notice Transfer factory ownership (owner only).
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
        emit OwnerTransferred(newOwner);
    }

    // -------------------------------------------------------------------------
    // View helpers
    // -------------------------------------------------------------------------

    /// @notice Returns all deployed fundraiser addresses.
    function getFundraisers() external view returns (address[] memory) {
        return fundraisers;
    }

    /// @notice Returns the total number of campaigns created.
    function getFundraiserCount() external view returns (uint256) {
        return fundraisers.length;
    }
}
