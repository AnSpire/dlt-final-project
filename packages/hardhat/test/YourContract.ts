import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { YourContract } from "../typechain-types";

describe("Voting contract", function () {
  async function deployVotingFixture() {
    const [owner, voter1, voter2, voter3] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("YourContract");
    const contract = (await factory.deploy(owner.address)) as YourContract;
    await contract.waitForDeployment();
    await contract.createVoting("Test question?", ["Option A", "Option B"]);
    return { contract, owner, voter1, voter2, voter3 };
  }

  it("prevents double voting", async function () {
    const { contract, voter1 } = await loadFixture(deployVotingFixture);
    await contract.connect(voter1).vote(0);
    await expect(contract.connect(voter1).vote(0)).to.be.revertedWith("Already voted");
  });

  it("prevents voting after the poll is ended", async function () {
    const { contract, owner, voter1 } = await loadFixture(deployVotingFixture);
    await contract.connect(owner).endVoting();
    await expect(contract.connect(voter1).vote(0)).to.be.revertedWith("Voting not active");
  });

  it("counts votes correctly", async function () {
    const { contract, voter1, voter2, voter3 } = await loadFixture(deployVotingFixture);
    await contract.connect(voter1).vote(0);
    await contract.connect(voter2).vote(1);
    await contract.connect(voter3).vote(0);

    const [, , counts] = await contract.getResults();
    expect(counts[0]).to.equal(2n);
    expect(counts[1]).to.equal(1n);
  });
});
