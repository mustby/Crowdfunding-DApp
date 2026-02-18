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
    address public feeRecipient = makeAddr("feeRecipient");

    uint256 public constant GOAL = 1000e6; // 1,000 USDC
    uint256 public constant DURATION = 30 days;
    uint256 public constant INITIAL_BALANCE = 5000e6; // 5,000 USDC per donor
    uint256 public constant FEE_BPS = 250; // 2.5%

    function setUp() public {
        usdc = new MockUSDC();
        factory = new FundraiserFactory(address(usdc), feeRecipient, FEE_BPS);

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

        uint256 fee = (GOAL * FEE_BPS) / 10_000; // 25 USDC
        uint256 creatorAmount = GOAL - fee; // 975 USDC

        uint256 creatorBefore = usdc.balanceOf(creator);
        uint256 feeBefore = usdc.balanceOf(feeRecipient);

        vm.prank(creator);
        fundraiser.withdraw();

        assertEq(usdc.balanceOf(creator), creatorBefore + creatorAmount);
        assertEq(usdc.balanceOf(feeRecipient), feeBefore + fee);
        assertEq(usdc.balanceOf(address(fundraiser)), 0);
        assertTrue(fundraiser.withdrawn());
    }

    function test_WithdrawDeductsFee() public {
        vm.prank(donor1);
        fundraiser.donate(GOAL);

        // 2.5% of 1000 USDC = 25 USDC fee, 975 USDC to creator
        uint256 expectedFee = 25e6;
        uint256 expectedCreatorAmount = 975e6;

        vm.prank(creator);
        fundraiser.withdraw();

        assertEq(usdc.balanceOf(feeRecipient), expectedFee);
        assertEq(usdc.balanceOf(creator), expectedCreatorAmount);
        assertEq(usdc.balanceOf(address(fundraiser)), 0);
    }

    function test_WithdrawZeroFee() public {
        // Deploy a new factory + campaign with zero fee
        FundraiserFactory zeroFeeFactory = new FundraiserFactory(address(usdc), feeRecipient, 0);
        vm.prank(creator);
        address addr = zeroFeeFactory.createFundraiser("Zero Fee Campaign", "No fee", GOAL, block.timestamp + DURATION);
        Fundraiser zeroFeeFundraiser = Fundraiser(addr);

        vm.prank(donor1);
        usdc.approve(address(zeroFeeFundraiser), type(uint256).max);
        vm.prank(donor1);
        zeroFeeFundraiser.donate(GOAL);

        uint256 creatorBefore = usdc.balanceOf(creator);
        uint256 feeRecipientBefore = usdc.balanceOf(feeRecipient);

        vm.prank(creator);
        zeroFeeFundraiser.withdraw();

        // Creator gets 100%, no transfer to feeRecipient
        assertEq(usdc.balanceOf(creator), creatorBefore + GOAL);
        assertEq(usdc.balanceOf(feeRecipient), feeRecipientBefore);
        assertEq(usdc.balanceOf(address(zeroFeeFundraiser)), 0);
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
    // Cancellation
    // -------------------------------------------------------------------------

    function test_CreatorCancel() public {
        vm.prank(creator);
        fundraiser.cancel();

        assertTrue(fundraiser.cancelled());
    }

    function test_Cancel_UnlocksRefundBeforeDeadline() public {
        vm.prank(donor1);
        fundraiser.donate(500e6);

        vm.prank(creator);
        fundraiser.cancel();

        uint256 before = usdc.balanceOf(donor1);
        vm.prank(donor1);
        fundraiser.claimRefund();

        assertEq(usdc.balanceOf(donor1), before + 500e6);
        assertEq(fundraiser.donations(donor1), 0);
    }

    function test_Cancel_MultipleRefunds() public {
        vm.prank(donor1);
        fundraiser.donate(300e6);
        vm.prank(donor2);
        fundraiser.donate(200e6);

        vm.prank(creator);
        fundraiser.cancel();

        vm.prank(donor1);
        fundraiser.claimRefund();
        vm.prank(donor2);
        fundraiser.claimRefund();

        assertEq(usdc.balanceOf(address(fundraiser)), 0);
    }

    function test_Cancel_AfterGoalMet() public {
        vm.prank(donor1);
        fundraiser.donate(GOAL);

        vm.prank(creator);
        fundraiser.cancel();

        assertTrue(fundraiser.cancelled());

        uint256 before = usdc.balanceOf(donor1);
        vm.prank(donor1);
        fundraiser.claimRefund();

        assertEq(usdc.balanceOf(donor1), before + GOAL);
    }

    function test_RevertCancel_NotCreator() public {
        vm.prank(donor1);
        vm.expectRevert(Fundraiser.NotCreator.selector);
        fundraiser.cancel();
    }

    function test_RevertCancel_AlreadyCancelled() public {
        vm.prank(creator);
        fundraiser.cancel();

        vm.prank(creator);
        vm.expectRevert(Fundraiser.AlreadyCancelled.selector);
        fundraiser.cancel();
    }

    function test_RevertCancel_AlreadyWithdrawn() public {
        vm.prank(donor1);
        fundraiser.donate(GOAL);

        vm.prank(creator);
        fundraiser.withdraw();

        vm.prank(creator);
        vm.expectRevert(Fundraiser.AlreadyWithdrawn.selector);
        fundraiser.cancel();
    }

    function test_RevertDonate_Cancelled() public {
        vm.prank(creator);
        fundraiser.cancel();

        vm.prank(donor1);
        vm.expectRevert(Fundraiser.CampaignCancelled.selector);
        fundraiser.donate(500e6);
    }

    function test_RevertWithdraw_Cancelled() public {
        vm.prank(donor1);
        fundraiser.donate(GOAL);

        vm.prank(creator);
        fundraiser.cancel();

        vm.prank(creator);
        vm.expectRevert(Fundraiser.CampaignCancelled.selector);
        fundraiser.withdraw();
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

    function test_Factory_SetFeeBps() public {
        // Owner updates fee to 500 bps (5%)
        factory.setFeeBps(500);
        assertEq(factory.feeBps(), 500);

        // New campaign uses the updated fee
        vm.prank(creator);
        address addr = factory.createFundraiser("New Campaign", "With 5% fee", GOAL, block.timestamp + DURATION);
        Fundraiser newFundraiser = Fundraiser(addr);
        assertEq(newFundraiser.feeBps(), 500);

        // Original campaign still has the old fee
        assertEq(fundraiser.feeBps(), FEE_BPS);
    }

    function test_RevertFactory_SetFeeBps_NotOwner() public {
        vm.prank(donor1);
        vm.expectRevert(FundraiserFactory.NotOwner.selector);
        factory.setFeeBps(100);
    }

    function test_RevertFactory_SetFeeBps_TooHigh() public {
        vm.expectRevert(FundraiserFactory.FeeTooHigh.selector);
        factory.setFeeBps(1001);
    }

    function test_Factory_TransferOwnership() public {
        address newOwner = makeAddr("newOwner");
        factory.transferOwnership(newOwner);
        assertEq(factory.owner(), newOwner);

        // New owner can set fee
        vm.prank(newOwner);
        factory.setFeeBps(100);
        assertEq(factory.feeBps(), 100);

        // Old owner (test contract) can no longer call admin functions
        vm.expectRevert(FundraiserFactory.NotOwner.selector);
        factory.setFeeBps(200);
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
        new Fundraiser(address(usdc), creator, "X", "Y", 0, block.timestamp + 1 days, feeRecipient, FEE_BPS);
    }

    function test_RevertDeploy_DeadlineInPast() public {
        vm.expectRevert(Fundraiser.InvalidDeadline.selector);
        new Fundraiser(address(usdc), creator, "X", "Y", GOAL, block.timestamp - 1, feeRecipient, FEE_BPS);
    }
}
