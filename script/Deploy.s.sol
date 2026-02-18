// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {FundraiserFactory} from "../src/FundraiserFactory.sol";

/// @notice Deploys MockUSDC + FundraiserFactory.
///         For Sepolia testnet. On mainnet, replace MockUSDC with real USDC address.
///
///         Usage:
///           forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL \
///             --broadcast --verify -vvvv
contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        MockUSDC usdc = new MockUSDC();
        FundraiserFactory factory = new FundraiserFactory(address(usdc));

        console.log("MockUSDC deployed at:       ", address(usdc));
        console.log("FundraiserFactory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}
