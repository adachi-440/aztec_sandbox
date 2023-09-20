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
}

main();