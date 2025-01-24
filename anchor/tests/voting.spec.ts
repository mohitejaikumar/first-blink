import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair, PublicKey} from '@solana/web3.js'
import {Voting} from '../target/types/voting'
import { BankrunProvider, startAnchor } from 'anchor-bankrun';
import { scopePollingDetectionStrategy } from '@solana/wallet-adapter-base';

const IDL = require("../target/idl/voting.json");

const votingAddress = new PublicKey("Egxy8uRynXkQrNJCccC1yd4ybWmrJ3ANueg5gqUpHRuZ")

describe('voting', () => {
     let context;
     let provider;
     anchor.setProvider(anchor.AnchorProvider.env());
     let votingProgram = anchor.workspace.Voting as Program<Voting>;

    //  beforeAll(async ()=> {
    //   context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);
    //   provider = new BankrunProvider(context);
    //   votingProgram = new Program<Voting>(IDL, provider);
    //  })

     it('Initialize Poll', async ()=>{
      
      await votingProgram.methods.initializePoll(
        new anchor.BN(1),
        "Who do you think will win the T20 World Cup 2024?",
        new anchor.BN(0),
        new anchor.BN(1821246480)
      ).rpc();

      const [pollAddress] = PublicKey.findProgramAddressSync(
        [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
        votingAddress
      )
      const poll = await votingProgram.account.poll.fetch(pollAddress);
      expect(poll.pollId.toNumber()).toEqual(1);
      expect(poll.pollDescription).toEqual("Who do you think will win the T20 World Cup 2024?");
      expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());

     })

     it('Initialize Candidate', async ()=>{
        await votingProgram.methods.initializeCandidate(
          "India",
          new anchor.BN(1),
        ).rpc();
        await votingProgram.methods.initializeCandidate(
          "Pakistan",
          new anchor.BN(1),
        ).rpc();

        const [candidateAddress1] = PublicKey.findProgramAddressSync(
          [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("India")],
          votingAddress
        )
        const [candidateAddress2] = PublicKey.findProgramAddressSync(
          [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Pakistan")],
          votingAddress
        )
        const candidate1 = await votingProgram.account.candidate.fetch(candidateAddress1);
        const candidate2 = await votingProgram.account.candidate.fetch(candidateAddress2);
        expect(candidate1.candidateName).toEqual("India");
        expect(candidate2.candidateName).toEqual("Pakistan");
        const [pollAddress] = PublicKey.findProgramAddressSync(
          [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
          votingAddress
        )
        const poll = await votingProgram.account.poll.fetch(pollAddress);
        expect(poll.pollCandidates.toNumber()).toEqual(2);
     })

     it('vote', async ()=>{
        await votingProgram.methods.vote(
          new anchor.BN(1),
          "India"
        ).rpc();
        const [candidateAddress] = PublicKey.findProgramAddressSync(
          [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("India")],
          votingAddress
        );
        const candidate = await votingProgram.account.candidate.fetch(candidateAddress);
        expect(candidate.candidateVote.toNumber()).toEqual(1);

     })

})
