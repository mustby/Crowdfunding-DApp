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

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event FundraiserCreated(
        address indexed fundraiser, address indexed creator, string name, uint256 goalAmount, uint256 deadline
    );

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error InvalidUSDC();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address _usdc) {
        if (_usdc == address(0)) revert InvalidUSDC();
        usdc = _usdc;
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
        Fundraiser fundraiser = new Fundraiser(usdc, msg.sender, name, description, goalAmount, deadline);

        fundraisers.push(address(fundraiser));

        emit FundraiserCreated(address(fundraiser), msg.sender, name, goalAmount, deadline);

        return address(fundraiser);
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
