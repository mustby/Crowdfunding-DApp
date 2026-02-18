// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {Fundraiser} from "../src/Fundraiser.sol";
import {FundraiserFactory} from "../src/FundraiserFactory.sol";

contract FundraiserTest is Test {
    MockUSDC public usdc;
    FundraiserFactory public factory;
    Fundraiser public fundraiser;

    address public creator = makeAddr("creator");
    address public donor1 = makeAddr("donor1");
    address public donor2 = makeAddr("donor2");

    uint256 public constant GOAL = 1000e6; // 1,000 USDC
    uint256 public constant DURATION = 30 days;
    uint256 public constant INITIAL_BALANCE = 5000e6; // 5,000 USDC per donor

    function setUp() public {
        usdc = new MockUSDC();
        factory = new FundraiserFactory(address(usdc));

        // Fund donors
        usdc.mint(donor1, INITIAL_BALANCE);
        usdc.mint(donor2, INITIAL_BALANCE);

        // Creator deploys a campaign via the factory
        vm.prank(creator);
        address addr = factory.createFundraiser("Test Campaign", "A test fundraiser", GOAL, block.timestamp + DURATION);
        fundraiser = Fundraiser(addr);

        // Donors approve the fundraiser contract
        vm.prank(donor1);
        usdc.approve(address(fundraiser), type(uint256).max);
        vm.prank(donor2);
        usdc.approve(address(fundraiser), type(uint256).max);
    }

    // -------------------------------------------------------------------------
    // Donation
    // -------------------------------------------------------------------------

    function test_Donate() public {
        vm.prank(donor1);
        fundraiser.donate(500e6);

        assertEq(fundraiser.totalRaised(), 500e6);
        assertEq(fundraiser.donations(donor1), 500e6);
        assertEq(usdc.balanceOf(address(fundraiser)), 500e6);
    }

    function test_MultipleDonors() public {
        vm.prank(donor1);
        fundraiser.donate(600e6);
        vm.prank(donor2);
        fundraiser.donate(400e6);

        assertEq(fundraiser.totalRaised(), GOAL);
        assertTrue(fundraiser.isGoalMet());
    }

    function test_RevertDonate_AfterDeadline() public {
        vm.warp(block.timestamp + DURATION + 1);
        vm.prank(donor1);
        vm.expectRevert(Fundraiser.DeadlinePassed.selector);
        fundraiser.donate(500e6);
    }

    // -------------------------------------------------------------------------
    // Withdrawal
    // -------------------------------------------------------------------------

    function test_CreatorWithdraw() public {
        vm.prank(donor1);
        fundraiser.donate(GOAL);

        uint256 before = usdc.balanceOf(creator);
        vm.prank(creator);
        fundraiser.withdraw();

        assertEq(usdc.balanceOf(creator), before + GOAL);
        assertEq(usdc.balanceOf(address(fundraiser)), 0);
        assertTrue(fundraiser.withdrawn());
    }

    function test_RevertWithdraw_NotCreator() public {
        vm.prank(donor1);
        fundraiser.donate(GOAL);

        vm.prank(donor1);
        vm.expectRevert(Fundraiser.NotCreator.selector);
        fundraiser.withdraw();
    }

    function test_RevertWithdraw_GoalNotMet() public {
        vm.prank(donor1);
        fundraiser.donate(500e6);

        vm.prank(creator);
        vm.expectRevert(Fundraiser.GoalNotMet.selector);
        fundraiser.withdraw();
    }

    function test_RevertWithdraw_AlreadyWithdrawn() public {
        vm.prank(donor1);
        fundraiser.donate(GOAL);

        vm.prank(creator);
        fundraiser.withdraw();

        vm.prank(creator);
        vm.expectRevert(Fundraiser.AlreadyWithdrawn.selector);
        fundraiser.withdraw();
    }

    // -------------------------------------------------------------------------
    // Refunds
    // -------------------------------------------------------------------------

    function test_ClaimRefund() public {
        vm.prank(donor1);
        fundraiser.donate(500e6);

        uint256 before = usdc.balanceOf(donor1);
        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(donor1);
        fundraiser.claimRefund();

        assertEq(usdc.balanceOf(donor1), before + 500e6);
        assertEq(fundraiser.donations(donor1), 0);
    }

    function test_MultipleRefunds() public {
        vm.prank(donor1);
        fundraiser.donate(300e6);
        vm.prank(donor2);
        fundraiser.donate(200e6);

        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(donor1);
        fundraiser.claimRefund();
        vm.prank(donor2);
        fundraiser.claimRefund();

        assertEq(usdc.balanceOf(address(fundraiser)), 0);
    }

    function test_RevertRefund_BeforeDeadline() public {
        vm.prank(donor1);
        fundraiser.donate(500e6);

        vm.prank(donor1);
        vm.expectRevert(Fundraiser.DeadlineNotPassed.selector);
        fundraiser.claimRefund();
    }

    function test_RevertRefund_GoalWasMet() public {
        vm.prank(donor1);
        fundraiser.donate(GOAL);

        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(donor1);
        vm.expectRevert(Fundraiser.GoalAlreadyMet.selector);
        fundraiser.claimRefund();
    }

    function test_RevertRefund_NoDonation() public {
        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(donor1);
        vm.expectRevert(Fundraiser.NoDonationToRefund.selector);
        fundraiser.claimRefund();
    }

    // -------------------------------------------------------------------------
    // Factory
    // -------------------------------------------------------------------------

    function test_Factory_TracksFundraiser() public view {
        assertEq(factory.getFundraiserCount(), 1);
        assertEq(factory.fundraisers(0), address(fundraiser));
    }

    function test_Factory_MultipleDeployments() public {
        vm.prank(creator);
        factory.createFundraiser("Campaign 2", "Desc 2", 500e6, block.timestamp + 7 days);

        assertEq(factory.getFundraiserCount(), 2);
        assertEq(factory.getFundraisers().length, 2);
    }

    // -------------------------------------------------------------------------
    // View helpers
    // -------------------------------------------------------------------------

    function test_IsExpired() public {
        assertFalse(fundraiser.isExpired());
        vm.warp(block.timestamp + DURATION + 1);
        assertTrue(fundraiser.isExpired());
    }

    function test_IsGoalMet() public {
        assertFalse(fundraiser.isGoalMet());
        vm.prank(donor1);
        fundraiser.donate(GOAL);
        assertTrue(fundraiser.isGoalMet());
    }

    // -------------------------------------------------------------------------
    // Constructor validation
    // -------------------------------------------------------------------------

    function test_RevertDeploy_ZeroGoal() public {
        vm.expectRevert(Fundraiser.InvalidGoal.selector);
        new Fundraiser(address(usdc), creator, "X", "Y", 0, block.timestamp + 1 days);
    }

    function test_RevertDeploy_DeadlineInPast() public {
        vm.expectRevert(Fundraiser.InvalidDeadline.selector);
        new Fundraiser(address(usdc), creator, "X", "Y", GOAL, block.timestamp - 1);
    }
}
