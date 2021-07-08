import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

export interface InitRoundData {
  rewardPerSecond: BigNumber;
  year: number;
  month: number;
  day: number;
  duration: number;
}

export const first: InitRoundData = {
  rewardPerSecond: ethers.utils.parseEther('1'),
  year: 2021,
  month: 7,
  day: 10,
  duration: 30,
};

export const second: InitRoundData = {
  rewardPerSecond: ethers.utils.parseEther('1'),
  year: 2021,
  month: 9,
  day: 10,
  duration: 30,
};

export const third: InitRoundData = {
  rewardPerSecond: ethers.utils.parseEther('1'),
  year: 2021,
  month: 11,
  day: 10,
  duration: 30,
};