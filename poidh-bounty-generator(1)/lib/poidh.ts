export const POIDH_ADDRESS = '0x5555Fa783936C260f77385b4E153B9725feF1719' as const;
export const BASE_CHAIN_ID = 8453;
export const POIDH_V2_OFFSET = 986n;
export const MIN_BOUNTY_ETH = '0.001';

export const poidhAbi = [
  {
    type: 'function', name: 'createSoloBounty', stateMutability: 'payable',
    inputs: [{ name: 'name', type: 'string' }, { name: 'description', type: 'string' }], outputs: []
  },
  {
    type: 'event', name: 'BountyCreated', anonymous: false,
    inputs: [
      { indexed: true, name: 'id', type: 'uint256' },
      { indexed: true, name: 'issuer', type: 'address' },
      { indexed: false, name: 'title', type: 'string' },
      { indexed: false, name: 'description', type: 'string' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'createdAt', type: 'uint256' },
      { indexed: false, name: 'isOpenBounty', type: 'bool' },
      { indexed: false, name: 'round', type: 'uint256' }
    ]
  }
] as const;

export function poidhUrl(contractId: bigint) {
  return `https://poidh.xyz/base/bounty/${contractId + POIDH_V2_OFFSET}`;
}
