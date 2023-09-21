contract Token {
    #[aztec(private)]
    fn constructor() {}

    #[aztec(public)]
    fn claim_public(
        to: AztecAddress,
        amount: Field,
        canceller: EthereumAddress,
        msg_key: Field,
        secret: Field,
    ) -> Field {}

    #[aztec(public)]
    fn exit_to_l1_public(
        recipient: EthereumAddress, // ethereum address to withdraw to
        amount: Field,
        callerOnL1: EthereumAddress, // ethereum address that can call this function on the L1 portal (0x0 if anyone can call)
        nonce: Field, // nonce used in the approval message by `msg.sender` to let bridge burn their tokens on L2
    ) -> Field {}

    // Private functions below

    #[aztec(private)]
    fn claim_private(
        amount: Field,
        secret_hash_for_redeeming_minted_notes: Field, // secret hash used to redeem minted notes at a later time. This enables anyone to call this function and mint tokens to a user on their behalf
        canceller: EthereumAddress,
        msg_key: Field, // L1 to L2 message key as derived from the inbox contract
        secret_for_L1_to_L2_message_consumption: Field, // secret used to consume the L1 to L2 message
    ) -> Field {}

    #[aztec(private)]
    fn exit_to_l1_private(
        recipient: EthereumAddress, // ethereum address to withdraw to
        token: AztecAddress,
        amount: Field,
        callerOnL1: EthereumAddress, // ethereum address that can call this function on the L1 portal (0x0 if anyone can call)
        nonce: Field, // nonce used in the approval message by `msg.sender` to let bridge burn their tokens on L2
    ) -> Field {}

    // Internal functions below

    // should be internal
    #[aztec(public)]
    fn _initialize(token: AztecAddress) {}

    #[aztec(public)]
    internal fn _call_mint_on_token(amount: Field, secret_hash: Field) {}

    #[aztec(public)]
    internal fn _assert_token_is_same(token: Field) {}

    // Unconstrained functions (read only)

    unconstrained fn token() -> Field {}
}