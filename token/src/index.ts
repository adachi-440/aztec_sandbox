import {
  AztecRPC,
  Fr,
  computeMessageSecretHash,
  createAztecRpcClient,
  createDebugLogger,
  getSchnorrAccount,
  waitForSandbox,
} from '@aztec/aztec.js';
import { GrumpkinScalar } from '@aztec/circuits.js';
import { TokenContract } from '@aztec/noir-contracts/types';

const { SANDBOX_URL = 'http://localhost:8080' } = process.env;

async function main() {
  ////////////// CREATE THE CLIENT INTERFACE AND CONTACT THE SANDBOX //////////////
  const logger = createDebugLogger('token');

  // We create AztecRPC client connected to the sandbox URL
  const aztecRpc = createAztecRpcClient(SANDBOX_URL);
  // Wait for sandbox to be ready
  await waitForSandbox(aztecRpc);

  const nodeInfo = await aztecRpc.getNodeInfo();

  logger('Aztec Sandbox Info ', nodeInfo);

  ////////////// CREATE SOME ACCOUNTS WITH SCHNORR SIGNERS //////////////
  // Creates new accounts using an account contract that verifies schnorr signatures
  // Returns once the deployment transactions have settled
  const createSchnorrAccounts = async (numAccounts: number, aztecRpc: AztecRPC) => {
    const accountManagers = Array(numAccounts)
      .fill(0)
      .map(() =>
        getSchnorrAccount(
          aztecRpc,
          GrumpkinScalar.random(), // encryption private key
          GrumpkinScalar.random(), // signing private key
        ),
      );
    return await Promise.all(
      accountManagers.map(async x => {
        await x.waitDeploy({});
        return x;
      }),
    );
  };

  // Create 2 accounts and wallets to go with each
  logger(`Creating accounts using schnorr signers...`);
  const accounts = await createSchnorrAccounts(2, aztecRpc);

  ////////////// VERIFY THE ACCOUNTS WERE CREATED SUCCESSFULLY //////////////

  const [alice, bob] = (await Promise.all(accounts.map(x => x.getCompleteAddress()))).map(x => x.address);

  // Verify that the accounts were deployed
  const registeredAccounts = (await aztecRpc.getRegisteredAccounts()).map(x => x.address);
  for (const [account, name] of [
    [alice, 'Alice'],
    [bob, 'Bob'],
  ] as const) {
    if (registeredAccounts.find(acc => acc.equals(account))) {
      logger(`Created ${name}'s account at ${account.toShortString()}`);
      continue;
    }
    logger(`Failed to create account for ${name}!`);
  }

  ////////////// DEPLOY OUR TOKEN CONTRACT //////////////

  // Deploy a token contract, create a contract abstraction object and link it to the owner's wallet
  const initialSupply = 1_000_000n;

  logger(`Deploying token contract minting an initial ${initialSupply} tokens to Alice...`);
  const contract = await TokenContract.deploy(aztecRpc).send().deployed();

  // Create the contract abstraction and link to Alice's wallet for future signing
  const tokenContractAlice = await TokenContract.at(contract.address, await accounts[0].getWallet());

  // Initialize the contract and add Bob as a minter
  logger(alice)
  // @ts-ignore
  await tokenContractAlice.methods._initialize(alice).send().wait();
  // @ts-ignore
  await tokenContractAlice.methods.set_minter(bob, true).send().wait();

  logger(`Contract successfully deployed at address ${contract.address.toShortString()}`);

  const secret = Fr.random();
  const secretHash = await computeMessageSecretHash(secret);

  await tokenContractAlice.methods.mint_private(initialSupply, secretHash).send().wait();
  // @ts-ignore
  await tokenContractAlice.methods.redeem_shield(alice, initialSupply, secret).send().wait();
}

main();
