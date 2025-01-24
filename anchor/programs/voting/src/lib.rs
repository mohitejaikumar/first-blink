#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("Egxy8uRynXkQrNJCccC1yd4ybWmrJ3ANueg5gqUpHRuZ");

const ANCHOR_DISCRIMINATOR: usize = 8;

#[program]
pub mod voting {
    use super::*;

    pub fn initialize_poll(ctx: Context<InitializePoll>, poll_id: u64, poll_description: String, poll_start: u64, poll_end: u64) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.poll_id = poll_id;
        poll.poll_description = poll_description;
        poll.poll_start = poll_start;
        poll.poll_end = poll_end;
        Ok(())
    }

    pub fn initialize_candidate(ctx: Context<InitializeCandidate>, candidate_name: String, _poll_id: u64) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        candidate.candidate_name = candidate_name;
        candidate.candidate_vote = 0;

        let poll = &mut ctx.accounts.poll;
        poll.poll_candidates += 1;
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, _poll_id: u64, _candidate_name: String) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        candidate.candidate_vote += 1;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR + Poll::INIT_SPACE,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(candidate_name: String, _poll_id: u64)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR + Candidate::INIT_SPACE,
        seeds = [_poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump,
    )]
    pub candidate: Account<'info, Candidate>,
    #[account(
        mut, 
        seeds = [_poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    pub system_program: Program<'info, System>,

}

#[derive(Accounts)]
#[instruction(_poll_id: u64, _candidate_name: String)]
pub struct Vote<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [_poll_id.to_le_bytes().as_ref(), _candidate_name.as_bytes()],
        bump
    )]
    pub candidate: Account<'info, Candidate>,
    #[account(
        mut,
        seeds = [_poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
}

#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u64,
    #[max_len(50)]
    pub poll_description: String,
    pub poll_start: u64,
    pub poll_end: u64,
    pub poll_candidates: u64
}


#[account]
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(50)]
    pub candidate_name: String,
    pub candidate_vote: u64

}