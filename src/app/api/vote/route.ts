import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Voting } from "@/../anchor/target/types/voting";
import { Program } from "@coral-xyz/anchor";
import { BN } from "bn.js";

export const OPTIONS = GET;
const IDL = require("@/../anchor/target/idl/voting.json");

export async function GET(request: Request){
    const actionMetadata:ActionGetResponse = {
        icon: "https://assets-in.bmscdn.com/iedb/movies/images/mobile/thumbnail/xlarge/t20-world-cup-2024-india-vs-pakistan-et00400032-1717572595.jpg",
        title: "Vote for your favorite team",
        description: "Who do you think will win the T20 World Cup 2024?",
        label: "Vote",
        links: {
            actions: [
                {
                   label: "Vote for India",
                   href: "/api/vote?candidate=India",
                   type: "post",
                },
                {
                   label: "Vote for Pakistan",
                   href: "/api/vote?candidate=Pakistan",
                   type: "post",
                },
                
            ],
        }
    }
    return Response.json(actionMetadata, {headers: ACTIONS_CORS_HEADERS});
}

export async function POST(request: Request){
    const url = new URL(request.url);
    const candidate = url.searchParams.get("candidate");
    if(candidate!="India" && candidate!="Pakistan"){
        return Response.json({error: "Invalid candidate"}, {status: 400});
    }

    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const program: Program<Voting> = new Program(IDL, {connection});
    const body: ActionPostRequest = await request.json();
    let voter;
    
    try {
        voter = new PublicKey(body.account);
    }
    catch(e){
        return Response.json({error: "Error voting"}, {status: 500});
    }
    
    const instruction = await program.methods
    .vote(new BN(1), candidate)
    .accounts({
        signer: voter
    })
    .instruction();

    const blockhash = await connection.getLatestBlockhash();

    const transaction = new Transaction({
        feePayer: voter,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
    })
    .add(instruction);
    
    const response = await createPostResponse({
        fields: {
            transaction: transaction,
            type: "transaction",
        }
    })

    return Response.json(response, {headers: ACTIONS_CORS_HEADERS});


}