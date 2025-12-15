"use client";

import { useCallback, useMemo } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const { data: resultsData, isLoading: resultsLoading, refetch } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getResults",
  });

  const { data: pollId } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "currentPollId",
  });

  const { data: lastVotedPoll } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "lastVotedPoll",
    args: connectedAddress ? [connectedAddress] : undefined,
    watch: true,
  });

  const { data: ownerAddress } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "owner",
  });

  const { writeContractAsync: voteAsync, isMining: voteMining } = useScaffoldWriteContract({
    contractName: "Voting",
  });

  const { writeContractAsync: endVotingAsync, isMining: endMining } = useScaffoldWriteContract({
    contractName: "Voting",
  });

  const poll = useMemo(() => {
    if (!resultsData) return null;
    const [question, opts, counts, active] = resultsData as unknown as [
      string,
      string[],
      bigint[],
      boolean,
    ];
    return {
      question,
      options: opts,
      counts: counts.map(c => Number(c)),
      active,
    };
  }, [resultsData]);

  const hasVoted = useMemo(() => {
    if (!pollId || !lastVotedPoll) return false;
    return lastVotedPoll === pollId;
  }, [pollId, lastVotedPoll]);

  const totalVotes = poll?.counts.reduce((a, b) => a + b, 0) ?? 0;

  const handleVote = useCallback(
    async (index: number) => {
      if (!poll?.active) return;
      await voteAsync({
        functionName: "vote",
        args: [BigInt(index)],
      });
      await refetch();
    },
    [poll?.active, refetch, voteAsync],
  );

  const handleEndVoting = useCallback(async () => {
    await endVotingAsync({ functionName: "endVoting" });
    await refetch();
  }, [endVotingAsync, refetch]);

  const isOwner = ownerAddress && connectedAddress && ownerAddress.toLowerCase() === connectedAddress.toLowerCase();

  return (
    <div className="flex flex-col gap-6 py-10 px-4 md:px-10 max-w-5xl w-full mx-auto">
      <div className="flex items-center justify-between gap-4 flex-col md:flex-row">
        <div>
          <p className="text-sm uppercase tracking-wide text-neutral">Web3 Demo</p>
          <h1 className="text-3xl font-bold">Децентрализованное голосование</h1>
          <p className="text-base text-secondary">Подключите кошелёк и выберите свой вариант.</p>
        </div>
        <RainbowKitCustomConnectButton />
      </div>

      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          {resultsLoading && <p>Загрузка данных голосования...</p>}
          {!resultsLoading && poll && (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm text-neutral">Вопрос</p>
                  <h2 className="text-2xl font-semibold">{poll.question}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${poll.active ? "badge-success" : "badge-ghost"}`}>
                    {poll.active ? "Активно" : "Завершено"}
                  </span>
                  <span className="badge badge-outline">Голосов: {totalVotes}</span>
                </div>
              </div>

              <div className="grid gap-4 mt-6">
                {poll.options.map((option, idx) => {
                  const votes = poll.counts[idx] ?? 0;
                  const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                  return (
                    <div key={option} className="p-4 rounded-xl bg-base-100 border border-base-300">
                      <div className="flex justify-between items-center gap-3 flex-wrap">
                        <div>
                          <p className="text-lg font-medium">{option}</p>
                          <p className="text-sm text-neutral">
                            {votes} голосов {totalVotes > 0 && `(${percent}%)`}
                          </p>
                        </div>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleVote(idx)}
                          disabled={!connectedAddress || !poll.active || hasVoted || voteMining}
                        >
                          {hasVoted ? "Уже проголосовали" : "Голосовать"}
                        </button>
                      </div>
                      <div className="mt-3 h-2 w-full bg-base-300 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4">
                <p className="text-sm text-neutral">
                  Статус: {poll.active ? "можно голосовать" : "голосование закрыто"}
                </p>
                {isOwner && poll.active && (
                  <button className="btn btn-outline" onClick={handleEndVoting} disabled={endMining}>
                    Завершить голосование
                  </button>
                )}
              </div>
            </>
          )}
          {!resultsLoading && !poll && <p>Голосование не найдено. Запустите деплой или создайте опрос в контракте.</p>}
        </div>
      </div>
    </div>
  );
};

export default Home;
