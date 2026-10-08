export function decodeVote(answer, decode) {
  if(!answer || answer.type!=='choice' || !Object.hasOwn(decode,answer.choice)) throw Error('Missing or invalid choice');
  if(!Number.isFinite(answer.confidence)||answer.confidence<0||answer.confidence>1) throw Error('Invalid confidence');
  const probabilities=answer.probabilities;
  if(!probabilities || Object.keys(probabilities).length!==2 || Object.keys(decode).some(k=>!Number.isFinite(probabilities[k])||probabilities[k]<0||probabilities[k]>1)) throw Error('Invalid probabilities');
  if(Math.abs(Object.values(probabilities).reduce((a,b)=>a+b,0)-1)>0.02) throw Error('Invalid probability sum');
  if(probabilities[answer.choice]<Math.max(...Object.values(probabilities))) throw Error('Choice is not a maximum');
  return {meaning:decode[answer.choice],answer};
}

export function classify(candidate,votes) {
  if(votes.length!==3 || votes.some(v=>!['winner','loser'].includes(v.meaning))) throw Error('Three complete binary judgments required');
  const winnerVotes=votes.filter(v=>v.meaning==='winner').length;
  return {winner:candidate.checks.bodyContrastPass===true&&candidate.checks.accentTextPass===true&&winnerVotes>=2,winnerVotes,stable:winnerVotes===0||winnerVotes===3};
}
