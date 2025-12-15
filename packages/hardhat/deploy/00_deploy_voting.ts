import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the Voting contract using the deployer account and
 * initializes a default poll.
 */
const deployVoting: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Voting", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });

  const voting = await hre.ethers.getContract<Contract>("Voting", deployer);
  const question = "Какой стек для web3 вы предпочитаете?";
  const options = ["Scaffold-ETH 2", "Hardhat + Ethers", "Foundry", "Другой вариант"];

  const active = await voting.votingActive();
  if (!active) {
    const tx = await voting.createVoting(question, options);
    await tx.wait();
  }

  const results = await voting.getResults();
  console.log("📊 Default voting created:", results[0], "with options", options);
};

export default deployVoting;

deployVoting.tags = ["Voting"];
