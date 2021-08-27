import { ethers, Wallet } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const provider = async (network: string) => {
  return new ethers.providers.InfuraProvider(network, process.env.INFURA_API_KEY);
};

export const getDeployer = async (hre: HardhatRuntimeEnvironment): Promise<Wallet> => {
  const privateKey = process.env.ADMIN as string;

  return new Wallet(privateKey, await provider(hre.network.name));
};
